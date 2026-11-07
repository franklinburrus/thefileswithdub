import { createHash } from 'node:crypto';

const KEY = 'feed-snapshot-v1';
const laneNames = { x: ['metadata', 'playback'], youtube: ['youtube'] };

function laneHealth() {
  return { generation: 0, lastAttemptAt: null, lastSuccessAt: null, consecutiveFailures: 0, errorCategory: null, state: 'uninitialized', newestSourceItem: null };
}
function contentVersion(items) {
  return createHash('sha256').update(JSON.stringify(items)).digest('hex');
}
function initialSnapshot(feed, baseline) {
  const items = baseline.map(item => ({ ...item, ...(feed === 'x' ? { hlsUrl: null } : {}) }));
  return { items, version: contentVersion(items), publishedAt: null, lanes: Object.fromEntries(laneNames[feed].map(lane => [lane, laneHealth()])) };
}
function newest(items, feed) {
  const item = items[0];
  return item ? { id: feed === 'x' ? item.id : item.videoId, publishedAt: feed === 'x' ? item.date || null : item.publishedAt } : null;
}
function acceptContent(snapshot, items, now) {
  const version = contentVersion(items);
  if (snapshot.version !== version) {
    snapshot.items = items;
    snapshot.version = version;
    snapshot.publishedAt = now;
  }
}
function success(lane, now, newestSourceItem) {
  Object.assign(lane, { lastSuccessAt: now, consecutiveFailures: 0, errorCategory: null, state: 'healthy', newestSourceItem });
}
function failure(lane, category) {
  lane.consecutiveFailures += 1;
  lane.errorCategory = category;
  lane.state = 'degraded';
}
function validateItems(items, feed) {
  if (!Array.isArray(items) || !items.length) throw new Error('invalid-candidate');
  const identities = new Set();
  for (const item of items) {
    const id = feed === 'x' ? item.id : item.videoId;
    if (!id || identities.has(id) || typeof item.title !== 'string' || !item.title.trim()) throw new Error('invalid-candidate');
    identities.add(id);
  }
}
function publicLane(lane, snapshot, feed, now, name) {
  const published = name === 'playback' ? snapshot.items.filter(item => item.hlsUrl) : snapshot.items;
  const newestPublishedItem = newest(published, feed);
  const newestSourceItem = name === 'playback' ? newest(snapshot.items.filter(item => item.sourceUrl?.includes('/broadcasts/')), feed) : lane.newestSourceItem;
  const sourceTime = newestSourceItem?.publishedAt ? Date.parse(newestSourceItem.publishedAt) : NaN;
  const publishedTime = newestPublishedItem?.publishedAt ? Date.parse(newestPublishedItem.publishedAt) : NaN;
  const age = lane.lastSuccessAt === null ? null : Math.max(0, now - lane.lastSuccessAt);
  const stale = age !== null && age > (name === 'youtube' ? 10 : 20) * 60_000;
  return {
    lastAttemptAt: lane.lastAttemptAt,
    lastSuccessAt: lane.lastSuccessAt,
    newestSourceItem,
    newestPublishedItem,
    count: published.length,
    lagMs: Number.isFinite(sourceTime) && Number.isFinite(publishedTime) ? Math.max(0, sourceTime - publishedTime) : null,
    consecutiveFailures: lane.consecutiveFailures,
    errorCategory: lane.errorCategory ?? (stale ? 'stale' : null),
    state: stale ? 'degraded' : lane.state,
    version: snapshot.version,
    feedAgeMs: age,
    ...(name === 'playback' ? { resolutions: Object.fromEntries(Object.entries(snapshot.resolutions ?? {}).filter(([id, resolution]) => snapshot.items.some(item => item.id === id && item.sourceUrl === resolution.sourceUrl)).map(([id, resolution]) => [id, { ...resolution, ageMs: resolution.lastSuccessAt === null ? null : Math.max(0, now - resolution.lastSuccessAt) }])) } : {}),
  };
}

/** All accepted content and health share one atomic snapshot in the feed's DO. */
export class FeedRepository {
  constructor(storage, feed, baseline = [], now = Date.now) {
    this.storage = storage;
    this.feed = feed;
    this.baseline = baseline;
    this.now = now;
  }

  async mutate(change) {
    return this.storage.transaction(async transaction => {
      const snapshot = await transaction.get(KEY) ?? initialSnapshot(this.feed, this.baseline);
      const result = change(snapshot, this.now());
      await transaction.put(KEY, snapshot);
      return result;
    });
  }

  async begin(laneName) {
    if (!laneNames[this.feed].includes(laneName)) throw new Error('invalid-lane');
    return this.mutate((snapshot, now) => {
      const lane = snapshot.lanes[laneName];
      lane.generation += 1;
      lane.lastAttemptAt = now;
      return { generation: lane.generation, items: snapshot.items };
    });
  }

  async fail(laneName, generation, category) {
    return this.mutate(snapshot => {
      const lane = snapshot.lanes[laneName];
      if (lane.generation !== generation) return false;
      failure(lane, category);
      return true;
    });
  }

  async acceptMetadata(generation, candidates) {
    validateItems(candidates, 'x');
    return this.mutate((snapshot, now) => {
      const lane = snapshot.lanes.metadata;
      if (lane.generation !== generation) return false;
      const previous = new Map(snapshot.items.map(item => [item.id, item]));
      const items = candidates.map(item => {
        const old = previous.get(item.id);
        return { ...item, hlsUrl: old?.sourceUrl === item.sourceUrl ? old.hlsUrl : null };
      });
      acceptContent(snapshot, items, now);
      success(lane, now, newest(items, 'x'));
      return true;
    });
  }

  async acceptPlayback(generation, results) {
    return this.mutate((snapshot, now) => {
      const lane = snapshot.lanes.playback;
      if (lane.generation !== generation) return false;
      const byId = new Map(results.map(result => [result.id, result]));
      const currentResults = [];
      snapshot.resolutions ??= {};
      const items = snapshot.items.map(item => {
        const result = byId.get(item.id);
        if (!result || result.sourceUrl !== item.sourceUrl) return item;
        currentResults.push(result);
        const previous = snapshot.resolutions[item.id];
        snapshot.resolutions[item.id] = {
          sourceUrl: item.sourceUrl,
          lastAttemptAt: lane.lastAttemptAt,
          lastSuccessAt: result.hlsUrl ? now : previous?.sourceUrl === item.sourceUrl ? previous.lastSuccessAt : null,
          errorCategory: result.errorCategory ?? null,
        };
        return result.hlsUrl ? { ...item, hlsUrl: result.hlsUrl } : item;
      });
      acceptContent(snapshot, items, now);
      const failed = currentResults.find(result => result.errorCategory);
      if (failed) {
        failure(lane, failed.errorCategory);
        if (currentResults.some(result => result.hlsUrl)) lane.lastSuccessAt = now;
      }
      else if (currentResults.length) success(lane, now, newest(items.filter(item => item.hlsUrl), 'x'));
      return true;
    });
  }

  async acceptYoutube(generation, videos) {
    validateItems(videos, 'youtube');
    return this.mutate((snapshot, now) => {
      const lane = snapshot.lanes.youtube;
      if (lane.generation !== generation) return false;
      acceptContent(snapshot, videos, now);
      success(lane, now, newest(videos, 'youtube'));
      return true;
    });
  }

  async read() {
    const snapshot = await this.storage.get(KEY) ?? initialSnapshot(this.feed, this.baseline);
    const now = this.now();
    const lanes = Object.fromEntries(Object.entries(snapshot.lanes).map(([name, lane]) => [name, publicLane(lane, snapshot, this.feed, now, name)]));
    const shared = { version: snapshot.version, publishedAt: snapshot.publishedAt };
    if (this.feed === 'youtube') {
      const source = !snapshot.items.length ? 'unavailable' : lanes.youtube.state === 'healthy' ? 'youtube' : 'last-known-good';
      return { videos: snapshot.items, source, ...shared, health: lanes.youtube };
    }
    return {
      broadcasts: snapshot.items.map(item => ({ ...item, hlsUrl: item.hlsUrl ? `/api/x-media?url=${encodeURIComponent(item.hlsUrl)}` : null })),
      ...shared,
      health: { ...lanes.metadata, state: Object.values(lanes).some(lane => lane.state === 'degraded') ? 'degraded' : lanes.metadata.state, ...lanes },
    };
  }
}
