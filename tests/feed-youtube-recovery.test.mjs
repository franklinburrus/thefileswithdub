import test from 'node:test';
import assert from 'node:assert/strict';
import { CHANNEL_ID, fetchYoutubeVideos } from '../feeds/youtube.mjs';
import { FeedRepository } from '../feeds/store.mjs';
import { refreshFeed } from '../feeds/jobs.mjs';

const uploadsId = `UU${CHANNEL_ID.slice(2)}`;
const firstId = 'ysb4ulbDmZ0';
const secondId = 'aaaaaaaaaaa';
const now = () => Date.parse('2026-11-08T12:00:00Z');
const enabled = { YOUTUBE_DATA_API_FALLBACK_ENABLED: 'true', YOUTUBE_DATA_API_KEY: 'fixture-header-only-secret' };
const playlistItem = (id = firstId) => ({
  kind: 'youtube#playlistItem',
  snippet: { channelId: CHANNEL_ID, playlistId: uploadsId, videoOwnerChannelId: CHANNEL_ID, resourceId: { kind: 'youtube#video', videoId: id }, title: 'Playlist title' },
  contentDetails: { videoId: id, videoPublishedAt: '2026-11-06T20:30:28Z' },
});
const video = (id = firstId, date = '2026-11-06T20:30:28Z') => ({
  kind: 'youtube#video', id,
  snippet: { channelId: CHANNEL_ID, title: id === firstId ? 'Public upload' : 'Public #Shorts', publishedAt: date, liveBroadcastContent: 'none' },
  status: { privacyStatus: 'public', uploadStatus: 'processed' },
});
const rss = `<feed><yt:channelId>${CHANNEL_ID}</yt:channelId><author><uri>https://www.youtube.com/channel/${CHANNEL_ID}</uri></author><entry><yt:videoId>${firstId}</yt:videoId><yt:channelId>${CHANNEL_ID}</yt:channelId><title>Public upload</title><published>2026-11-06T20:30:28Z</published></entry></feed>`;
function upstream({ playlist = [playlistItem()], videos = [video()], rssStatus = 404, apiStatus, apiError, invalidBody } = {}) {
  const calls = [];
  return {
    calls,
    fetcher: async (input, init) => {
      const url = new URL(input);
      calls.push({ url, headers: new Headers(init.headers) });
      assert.equal(url.href.includes(enabled.YOUTUBE_DATA_API_KEY), false);
      if (url.hostname === 'www.youtube.com') return new Response(rssStatus === 200 ? rss : '', { status: rssStatus });
      assert.equal(new Headers(init.headers).get('X-Goog-Api-Key'), enabled.YOUTUBE_DATA_API_KEY);
      if (apiError) throw new Error(apiError);
      if (apiStatus) return new Response('', { status: apiStatus });
      if (invalidBody !== undefined) return new Response(invalidBody);
      if (url.pathname.endsWith('/playlistItems')) {
        assert.equal(url.searchParams.get('playlistId'), uploadsId);
        assert.equal(url.searchParams.get('maxResults'), '50');
        return Response.json({ kind: 'youtube#playlistItemListResponse', items: playlist });
      }
      assert.equal(url.pathname, '/youtube/v3/videos');
      assert.equal(url.searchParams.get('part'), 'snippet,status');
      assert.deepEqual(new Set(url.searchParams.get('id').split(',')), new Set(playlist.map(item => item.contentDetails.videoId)));
      return Response.json({ kind: 'youtube#videoListResponse', items: videos });
    },
  };
}

function repository() {
  let snapshot;
  const storage = {
    get: async () => structuredClone(snapshot),
    transaction: async callback => {
      let candidate = structuredClone(snapshot);
      const result = await callback({ get: async () => structuredClone(candidate), put: async (_key, value) => { candidate = structuredClone(value); } });
      snapshot = candidate;
      return result;
    },
  };
  return new FeedRepository(storage, 'youtube', [], now);
}

test('RSS 404 falls back to bounded playlist and videos ownership validation with public Shorts ordering', async () => {
  const fixture = upstream({ playlist: [playlistItem(), playlistItem(secondId)], videos: [video(), video(secondId, '2026-11-07T12:00:00Z')] });
  const result = await fetchYoutubeVideos(fixture.fetcher, enabled, now);
  assert.deepEqual(result.videos.map(item => item.videoId), [secondId, firstId]);
  assert.equal(result.provider, 'youtube-data-api');
  assert.equal(result.primaryErrorCategory, 'upstream-404');
  assert.equal(fixture.calls.length, 5);
  assert.equal(fixture.calls.filter(call => call.url.hostname === 'www.youtube.com').length, 3);
  assert.equal(fixture.calls.filter(call => call.url.pathname.endsWith('/videos')).length, 1);
});

test('RSS success skips the API even when enabled and returns provider metadata', async () => {
  const fixture = upstream({ rssStatus: 200 });
  const result = await fetchYoutubeVideos(fixture.fetcher, enabled, now);
  assert.equal(result.provider, 'rss');
  assert.equal(result.primaryErrorCategory, null);
  assert.equal(result.videos[0].videoId, firstId);
  assert.equal(fixture.calls.length, 1);
});

test('fallback rejects wrong playlist owner, playlist ID, video owner and conflicting identities', async () => {
  for (const mutate of [
    item => { item.snippet.channelId = 'UCwrong'; },
    item => { item.snippet.playlistId = 'UUwrong'; },
    item => { item.snippet.videoOwnerChannelId = 'UCwrong'; },
    item => { item.snippet.resourceId.videoId = secondId; },
  ]) {
    const item = playlistItem();
    mutate(item);
    await assert.rejects(fetchYoutubeVideos(upstream({ playlist: [item] }).fetcher, enabled, now), /invalid-candidate/);
  }
  const wrong = video();
  wrong.snippet.channelId = 'UCwrong';
  await assert.rejects(fetchYoutubeVideos(upstream({ videos: [wrong] }).fetcher, enabled, now), /invalid-candidate/);
  await assert.rejects(fetchYoutubeVideos(upstream({ videos: [video(secondId)] }).fetcher, enabled, now), /invalid-candidate/);
});

test('fallback excludes private, unlisted, deleted, failed, unprocessed, scheduled and future videos', async () => {
  const unavailable = [
    item => { item.status.privacyStatus = 'private'; },
    item => { item.status.privacyStatus = 'unlisted'; },
    item => { item.status.uploadStatus = 'deleted'; },
    item => { item.status.uploadStatus = 'failed'; },
    item => { item.status.uploadStatus = 'uploaded'; },
    item => { item.status.publishAt = '2026-11-09T12:00:00Z'; },
    item => { item.snippet.liveBroadcastContent = 'upcoming'; },
    item => { item.snippet.publishedAt = '2026-11-09T12:00:00Z'; },
  ];
  for (const mutate of unavailable) {
    const hidden = video(secondId);
    mutate(hidden);
    const result = await fetchYoutubeVideos(upstream({ playlist: [playlistItem(), playlistItem(secondId)], videos: [video(), hidden] }).fetcher, enabled, now);
    assert.deepEqual(result.videos.map(item => item.videoId), [firstId]);
  }
  const missing = await fetchYoutubeVideos(upstream({ playlist: [playlistItem(), playlistItem(secondId)], videos: [video()] }).fetcher, enabled, now);
  assert.deepEqual(missing.videos.map(item => item.videoId), [firstId]);
});

test('empty, duplicate, oversized and malformed fallback responses fail closed', async () => {
  const noStatus = video();
  delete noStatus.status;
  const privateVideo = video();
  privateVideo.status.privacyStatus = 'private';
  for (const options of [
    { playlist: [] }, { videos: [] }, { videos: [privateVideo] },
    { playlist: [playlistItem(), playlistItem()] }, { videos: [video(), video()] },
    { videos: [noStatus] }, { invalidBody: '{invalid' }, { invalidBody: '{"items":null}' },
    { invalidBody: 'null' }, { playlist: Array.from({ length: 51 }, () => playlistItem()) },
  ]) await assert.rejects(fetchYoutubeVideos(upstream(options).fetcher, enabled, now), /invalid-candidate/);
});

test('fallback is never called when disabled or missing the key', async () => {
  for (const env of [{}, { YOUTUBE_DATA_API_KEY: enabled.YOUTUBE_DATA_API_KEY }, { YOUTUBE_DATA_API_FALLBACK_ENABLED: 'false', YOUTUBE_DATA_API_KEY: enabled.YOUTUBE_DATA_API_KEY }, { YOUTUBE_DATA_API_FALLBACK_ENABLED: 'true' }]) {
    const fixture = upstream();
    await assert.rejects(fetchYoutubeVideos(fixture.fetcher, env, now), /upstream-404/);
    assert.equal(fixture.calls.length, 3);
  }
});

test('API 403, 429 and network errors are bounded and preserve the primary RSS category', async () => {
  for (const [options, category] of [[{ apiStatus: 403 }, 'upstream-403'], [{ apiStatus: 429 }, 'upstream-429'], [{ apiError: enabled.YOUTUBE_DATA_API_KEY }, 'network']]) {
    const fixture = upstream(options);
    await assert.rejects(fetchYoutubeVideos(fixture.fetcher, enabled, now), error => {
      assert.equal(error.message, category);
      assert.equal(error.primaryErrorCategory, 'upstream-404');
      assert.equal(String(error).includes(enabled.YOUTUBE_DATA_API_KEY), false);
      return true;
    });
    assert.equal(fixture.calls.length, 4);
  }
});

test('dual-source failure retains LKG and last successful provider, fallback and RSS recovery reset streaks without content churn', async () => {
  const repo = repository();
  const first = await refreshFeed(repo, 'youtube', enabled, upstream({ rssStatus: 200 }).fetcher);
  const accepted = await repo.read();
  assert.equal(first.provider, 'rss');
  assert.equal(accepted.health.provider, 'rss');
  const failed = await refreshFeed(repo, 'youtube', enabled, upstream({ apiStatus: 429 }).fetcher);
  const retained = await repo.read();
  assert.equal(failed.errorCategory, 'upstream-429');
  assert.equal(retained.source, 'last-known-good');
  assert.equal(retained.version, accepted.version);
  assert.equal(retained.health.provider, 'rss');
  assert.equal(retained.health.primaryErrorCategory, 'upstream-404');
  assert.equal(retained.health.consecutiveFailures, 1);
  const fallback = await refreshFeed(repo, 'youtube', enabled, upstream().fetcher);
  const recovered = await repo.read();
  assert.equal(fallback.provider, 'youtube-data-api');
  assert.equal(recovered.health.provider, 'youtube-data-api');
  assert.equal(recovered.health.primaryErrorCategory, 'upstream-404');
  assert.equal(recovered.health.errorCategory, null);
  assert.equal(recovered.health.consecutiveFailures, 0);
  assert.equal(recovered.source, 'youtube');
  assert.equal(recovered.version, accepted.version);
  assert.equal(recovered.publishedAt, accepted.publishedAt);
  await refreshFeed(repo, 'youtube', enabled, upstream({ rssStatus: 200 }).fetcher);
  const rssRecovered = await repo.read();
  assert.equal(rssRecovered.health.provider, 'rss');
  assert.equal(rssRecovered.health.primaryErrorCategory, null);
  assert.equal(rssRecovered.version, accepted.version);
});

test('invalid and empty fallback candidates preserve LKG and never fabricate success on an empty store', async () => {
  const repo = repository();
  await refreshFeed(repo, 'youtube', enabled, upstream({ rssStatus: 200 }).fetcher);
  const before = await repo.read();
  for (const options of [{ videos: [] }, { invalidBody: '{"items":null}' }]) {
    await refreshFeed(repo, 'youtube', enabled, upstream(options).fetcher);
    const after = await repo.read();
    assert.deepEqual(after.videos, before.videos);
    assert.equal(after.health.lastSuccessAt, before.health.lastSuccessAt);
    assert.equal(after.version, before.version);
    assert.equal(after.source, 'last-known-good');
  }
  const empty = repository();
  await refreshFeed(empty, 'youtube', enabled, upstream({ videos: [] }).fetcher);
  const result = await empty.read();
  assert.equal(result.source, 'unavailable');
  assert.equal(result.health.provider, null);
  assert.equal(result.health.lastSuccessAt, null);
});


test('fallback fills private-video holes from the same batch and publishes only the latest 15 eligible uploads', async () => {
  const videos = Array.from({ length: 20 }, (_value, index) => video(String(index).padStart(11, '0'), `2026-10-${String(28 - index).padStart(2, '0')}T12:00:00Z`));
  videos[0].status.privacyStatus = 'private';
  const fixture = upstream({ playlist: videos.map(item => playlistItem(item.id)), videos });
  const result = await fetchYoutubeVideos(fixture.fetcher, enabled, now);
  assert.equal(result.videos.length, 15);
  assert.deepEqual(result.videos.map(item => item.videoId), videos.slice(1, 16).map(item => item.id));
  assert.equal(fixture.calls.length, 5);
});

test('older YouTube attempts cannot replace accepted provider metadata or current health', async () => {
  const repo = repository();
  const older = await repo.begin('youtube');
  const current = await repo.begin('youtube');
  const { videos } = await fetchYoutubeVideos(upstream({ rssStatus: 200 }).fetcher, enabled, now);
  await repo.acceptYoutube(current.generation, videos, { provider: 'rss', primaryErrorCategory: null });
  const before = await repo.read();
  assert.equal(await repo.acceptYoutube(older.generation, videos, { provider: 'youtube-data-api', primaryErrorCategory: 'upstream-404' }), false);
  assert.equal(await repo.fail('youtube', older.generation, 'upstream-403', { primaryErrorCategory: 'upstream-404' }), false);
  const after = await repo.read();
  assert.deepEqual(after, before);
});
