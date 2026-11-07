import test from 'node:test';
import assert from 'node:assert/strict';
import { FeedRepository } from '../feeds/store.mjs';

class AtomicMemory {
  values = new Map();
  queue = Promise.resolve();
  failNext = false;
  async get(key) { return structuredClone(this.values.get(key)); }
  transaction(callback) {
    const run = this.queue.then(async () => {
      const copy = new Map(structuredClone([...this.values]));
      const transaction = {
        get: async key => structuredClone(copy.get(key)),
        put: async (key, value) => { copy.set(key, structuredClone(value)); },
      };
      const result = await callback(transaction);
      if (this.failNext) { this.failNext = false; throw new Error('interrupted commit'); }
      this.values = copy;
      return result;
    });
    this.queue = run.catch(() => {});
    return run;
  }
}
const x = { id: '1DxLdZjlmrQxm', title: 'Episode', date: '2026-09-15', poster: '/broadcasts/replay-card.svg', sourceUrl: 'https://x.com/i/broadcasts/1DxLdZjlmrQxm' };
const hls = 'https://prod.video.pscp.tv/Transcoding/v1/hls/replay/master.m3u8';
function setup(feed = 'x') {
  const storage = new AtomicMemory();
  let time = 1000;
  const repo = new FeedRepository(storage, feed, feed === 'x' ? [x] : [], () => time++);
  return { repo, storage };
}

test('bundled seed has no fabricated upstream success', async () => {
  const { repo } = setup();
  const result = await repo.read();
  assert.equal(result.broadcasts.length, 1);
  assert.equal(result.health.metadata.lastSuccessAt, null);
  assert.equal(result.publishedAt, null);
});

test('metadata and playback merges preserve concurrent accepted updates', async () => {
  const { repo } = setup();
  const metadata = await repo.begin('metadata');
  const playback = await repo.begin('playback');
  await repo.acceptMetadata(metadata.generation, [{ ...x, title: 'Updated' }]);
  await repo.acceptPlayback(playback.generation, [{ id: x.id, sourceUrl: x.sourceUrl, hlsUrl: hls }]);
  const result = await repo.read();
  assert.equal(result.broadcasts[0].title, 'Updated');
  assert.equal(result.broadcasts[0].hlsUrl, `/api/x-media?url=${encodeURIComponent(hls)}`);
});

test('older attempts cannot overwrite newer content or lane health', async () => {
  const { repo } = setup();
  const older = await repo.begin('metadata');
  const newer = await repo.begin('metadata');
  await repo.acceptMetadata(newer.generation, [{ ...x, title: 'Newest' }]);
  assert.equal(await repo.acceptMetadata(older.generation, [x]), false);
  assert.equal(await repo.fail('metadata', older.generation, 'network'), false);
  assert.equal((await repo.read()).broadcasts[0].title, 'Newest');
  assert.equal((await repo.read()).health.metadata.consecutiveFailures, 0);
});

test('metadata preserves successful playback only for identical source identity', async () => {
  const { repo } = setup();
  let attempt = await repo.begin('playback');
  await repo.acceptPlayback(attempt.generation, [{ id: x.id, sourceUrl: x.sourceUrl, hlsUrl: hls }]);
  const stale = await repo.begin('playback');
  attempt = await repo.begin('metadata');
  const changed = { ...x, sourceUrl: `https://x.com/i/spaces/${x.id}` };
  await repo.acceptMetadata(attempt.generation, [changed]);
  await repo.acceptPlayback(stale.generation, [{ id: x.id, sourceUrl: x.sourceUrl, hlsUrl: hls }]);
  assert.equal((await repo.read()).broadcasts[0].hlsUrl, null);
});

test('failed playback retains good URL and does not change content version', async () => {
  const { repo } = setup();
  let attempt = await repo.begin('playback');
  await repo.acceptPlayback(attempt.generation, [{ id: x.id, sourceUrl: x.sourceUrl, hlsUrl: hls }]);
  const before = await repo.read();
  attempt = await repo.begin('playback');
  await repo.acceptPlayback(attempt.generation, [{ id: x.id, sourceUrl: x.sourceUrl, errorCategory: 'upstream-429' }]);
  const after = await repo.read();
  assert.equal(after.version, before.version);
  assert.equal(after.publishedAt, before.publishedAt);
  assert.equal(after.broadcasts[0].hlsUrl, before.broadcasts[0].hlsUrl);
  assert.equal(after.health.playback.errorCategory, 'upstream-429');
  assert.equal(after.health.playback.lastSuccessAt, before.health.playback.lastSuccessAt);
});

test('interrupted atomic commit changes neither content nor success health', async () => {
  const { repo, storage } = setup();
  const attempt = await repo.begin('metadata');
  const before = await repo.read();
  storage.failNext = true;
  await assert.rejects(repo.acceptMetadata(attempt.generation, [{ ...x, title: 'Interrupted' }]), /interrupted/);
  const after = await repo.read();
  assert.equal(after.version, before.version);
  assert.equal(after.broadcasts[0].title, before.broadcasts[0].title);
  assert.equal(after.health.metadata.lastSuccessAt, null);
});

test('YouTube failure exposes durable last-known-good and recovery clears degradation', async () => {
  const { repo, storage } = setup('youtube');
  const videos = [{ id: 1, title: 'Upload', runtime: 'New upload', date: 'Nov 7, 2026', videoId: 'ysb4ulbDmZ0', image: 'https://i.ytimg.com/vi/ysb4ulbDmZ0/hqdefault.jpg', publishedAt: '2026-11-07T12:00:00.000Z' }];
  let attempt = await repo.begin('youtube');
  await repo.acceptYoutube(attempt.generation, videos);
  const before = await repo.read();
  attempt = await repo.begin('youtube');
  await repo.fail('youtube', attempt.generation, 'network');
  const restored = new FeedRepository(storage, 'youtube', []);
  const degraded = await restored.read();
  assert.equal(degraded.source, 'last-known-good');
  assert.equal(degraded.version, before.version);
  attempt = await repo.begin('youtube');
  await repo.acceptYoutube(attempt.generation, videos);
  const recovered = await repo.read();
  assert.equal(recovered.source, 'youtube');
  assert.equal(recovered.health.consecutiveFailures, 0);
  assert.equal(recovered.health.errorCategory, null);
  assert.equal(recovered.version, before.version);
});

test('playback health reports playable count and metadata-to-playback lag under partial failure', async () => {
  const { repo } = setup();
  const newer = { ...x, id: '2onbAgvyKWBPYg', date: '2026-11-05', sourceUrl: 'https://x.com/i/broadcasts/2onbAgvyKWBPYg' };
  let attempt = await repo.begin('metadata');
  await repo.acceptMetadata(attempt.generation, [newer, x]);
  attempt = await repo.begin('playback');
  await repo.acceptPlayback(attempt.generation, [{ id: newer.id, sourceUrl: newer.sourceUrl, errorCategory: 'upstream-429' }, { id: x.id, sourceUrl: x.sourceUrl, hlsUrl: hls }]);
  const health = (await repo.read()).health.playback;
  assert.equal(health.count, 1);
  assert.equal(health.newestSourceItem.id, newer.id);
  assert.equal(health.newestPublishedItem.id, x.id);
  assert.equal(health.lagMs, Date.parse(newer.date) - Date.parse(x.date));
  assert.ok(health.lastSuccessAt);
  assert.equal(health.state, 'degraded');
});

test('health becomes degraded when scheduled refresh stops without inventing failed attempts', async () => {
  const storage = new AtomicMemory();
  let now = 1000;
  const repo = new FeedRepository(storage, 'youtube', [], () => now);
  const attempt = await repo.begin('youtube');
  await repo.acceptYoutube(attempt.generation, [{ id: 1, title: 'Upload', videoId: 'ysb4ulbDmZ0', publishedAt: '2026-11-06T20:30:28Z' }]);
  now += 11 * 60 * 1000;
  const result = await repo.read();
  assert.equal(result.health.state, 'degraded');
  assert.equal(result.health.errorCategory, 'stale');
  assert.equal(result.health.consecutiveFailures, 0);
  assert.equal(result.source, 'last-known-good');
  assert.equal(result.health.feedAgeMs, 11 * 60 * 1000);
});


test('playback preserves per-source resolution age across partial failures without content version churn', async () => {
  const { repo } = setup();
  let attempt = await repo.begin('playback');
  await repo.acceptPlayback(attempt.generation, [{ id: x.id, sourceUrl: x.sourceUrl, hlsUrl: hls }]);
  const before = await repo.read();
  const oldSuccess = before.health.playback.resolutions[x.id].lastSuccessAt;
  attempt = await repo.begin('playback');
  await repo.acceptPlayback(attempt.generation, [{ id: x.id, sourceUrl: x.sourceUrl, errorCategory: 'upstream-429' }]);
  const after = await repo.read();
  assert.equal(after.version, before.version);
  assert.equal(after.health.playback.resolutions[x.id].lastSuccessAt, oldSuccess);
  assert.ok(after.health.playback.resolutions[x.id].lastAttemptAt > oldSuccess);
  assert.equal(after.health.playback.resolutions[x.id].errorCategory, 'upstream-429');
});

test('playback results captured before retirement cannot restore a removed identity', async () => {
  const dead = { ...x, id: '1DxLddryWQPxm', sourceUrl: 'https://x.com/i/broadcasts/1DxLddryWQPxm' };
  const repo = new FeedRepository(new AtomicMemory(), 'x', [x, dead]);
  const pending = await repo.begin('playback');
  const metadata = await repo.begin('metadata');
  await repo.acceptMetadata(metadata.generation, [x]);
  const retired = await repo.read();
  await repo.acceptPlayback(pending.generation, [{ id: dead.id, sourceUrl: dead.sourceUrl, hlsUrl: hls }]);
  const after = await repo.read();
  assert.deepEqual(after.broadcasts.map(item => item.id), [x.id]);
  assert.equal(after.version, retired.version);
  assert.equal(after.health.playback.resolutions[dead.id], undefined);
});

test('a successful playback refresh after retirement clears the previous dead-source failure', async () => {
  const dead = { ...x, id: '1jGXggZlkdVKZ', sourceUrl: 'https://x.com/i/broadcasts/1jGXggZlkdVKZ' };
  const repo = new FeedRepository(new AtomicMemory(), 'x', [x, dead]);
  let playback = await repo.begin('playback');
  await repo.acceptPlayback(playback.generation, [{ id: x.id, sourceUrl: x.sourceUrl, hlsUrl: hls }, { id: dead.id, sourceUrl: dead.sourceUrl, errorCategory: 'upstream-404' }]);
  assert.equal((await repo.read()).health.playback.state, 'degraded');
  const metadata = await repo.begin('metadata');
  await repo.acceptMetadata(metadata.generation, [x]);
  playback = await repo.begin('playback');
  await repo.acceptPlayback(playback.generation, [{ id: x.id, sourceUrl: x.sourceUrl, hlsUrl: hls }]);
  const after = await repo.read();
  assert.equal(after.health.playback.state, 'healthy');
  assert.equal(after.health.playback.errorCategory, null);
  assert.equal(after.health.playback.consecutiveFailures, 0);
  assert.equal(after.health.playback.resolutions[dead.id], undefined);
  assert.equal(after.health.state, 'healthy');
});
