import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

const channel = 'UCPydZggyK7qQRp4VNUGXNgg';
const video = 'ysb4ulbDmZ0';
const feed = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><yt:channelId>${channel.slice(2)}</yt:channelId><author><name>Dub</name><uri>https://www.youtube.com/channel/${channel}</uri></author><entry><yt:videoId>${video}</yt:videoId><yt:channelId>${channel}</yt:channelId><title>Runtime upload</title><published>2026-11-07T12:00:00Z</published></entry></feed>`;

// These control routes exist only inside this generated local-runtime fixture.
const fixture = `
import worker, { FeedStore as ProductionFeedStore } from './coordinator/index.ts';
import { FeedRepository } from './feeds/store.mjs';
export class FeedStore extends ProductionFeedStore {
  async interruptCommit() {
    const storage = this.ctx.storage;
    const repository = new FeedRepository({
      get: key => storage.get(key),
      transaction: fn => storage.transaction(async transaction => {
        await fn(transaction);
        throw new Error('injected-interruption');
      }),
    }, 'youtube');
    const current = await storage.get('feed-snapshot-v1');
    await repository.acceptYoutube(current.lanes.youtube.generation, [{ ...current.items[0], title: 'Must roll back' }]);
  }
}
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/test-cron') {
      const pending = [];
      await worker.scheduled({ cron: url.searchParams.get('cron') }, env, { waitUntil: value => pending.push(value) });
      await Promise.all(pending);
      return new Response('done');
    }
    if (url.pathname === '/test-interrupt') {
      try { await env.FEED_STORE.getByName('youtube').interruptCommit(); }
      catch { return new Response('rolled back'); }
      return new Response('unexpected commit', { status: 500 });
    }
    return worker.fetch(request, env, ctx);
  },
};`;

test('real SQLite DO runtime persists independent feeds and atomic content/health across failures and restart', { timeout: 30000 }, async () => {
  const bundled = await build({ stdin: { contents: fixture, resolveDir: process.cwd(), sourcefile: 'test-feed-runtime.ts' }, bundle: true, write: false, format: 'esm', platform: 'neutral', external: ['cloudflare:*', 'node:*'] });
  const persist = await mkdtemp(join(tmpdir(), 'dub-feed-runtime-'));
  let failing = false;
  let fallbackAvailable = false;
  let calls = 0;
  let xSources = [];
  const csv = rows => rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const options = {
    modules: true,
    script: bundled.outputFiles[0].text,
    compatibilityDate: '2026-09-12',
    compatibilityFlags: ['nodejs_compat'],
    durableObjects: { FEED_STORE: { className: 'FeedStore', useSQLite: true } },
    resourcePersistencePath: persist,
    bindings: { FEED_REFRESH_ENABLED: 'true', YOUTUBE_DATA_API_FALLBACK_ENABLED: 'true', YOUTUBE_DATA_API_KEY: 'runtime-fixture-header-key' },
    outboundService: async request => {
      const url = new URL(request.url);
      if (url.hostname === 'docs.google.com') {
        const rows = url.searchParams.get('gid') === '672400447'
          ? [['Broadcast date', 'Content type', 'Source broadcast URL', 'Episode key'], ...xSources.map(item => [item.date, item.sourceUrl.includes('/spaces/') ? 'X Audio Space' : 'X Video Broadcast', item.sourceUrl, item.id])]
          : [['Episode key', 'Broadcast title', 'Broadcast date'], ...xSources.map(item => [item.id, item.title, item.date])];
        return new Response(csv(rows));
      }
      if (url.hostname === 'x.com') {
        return url.pathname.endsWith('2onbAgvyKWBPYg')
          ? new Response('https://prod.video.pscp.tv/Transcoding/v1/hls/newest/master.m3u8')
          : new Response('rate limited', { status: 429 });
      }
      if (url.hostname === 'www.googleapis.com') {
        assert.equal(url.href.includes('runtime-fixture-header-key'), false);
        assert.equal(request.headers.get('X-Goog-Api-Key'), 'runtime-fixture-header-key');
        if (!fallbackAvailable) return new Response('', { status: 403 });
        if (url.pathname.endsWith('/playlistItems')) return Response.json({ kind: 'youtube#playlistItemListResponse', items: [{
          kind: 'youtube#playlistItem',
          snippet: { channelId: channel, playlistId: `UU${channel.slice(2)}`, videoOwnerChannelId: channel, resourceId: { kind: 'youtube#video', videoId: video } },
          contentDetails: { videoId: video },
        }] });
        assert.equal(url.pathname, '/youtube/v3/videos');
        return Response.json({ kind: 'youtube#videoListResponse', items: [{
          kind: 'youtube#video', id: video,
          snippet: { channelId: channel, title: 'Runtime upload', publishedAt: '2026-11-07T12:00:00Z' },
          status: { privacyStatus: 'public', uploadStatus: 'processed' },
        }] });
      }
      assert.match(request.url, /^https:\/\/www.youtube.com\/feeds\/videos.xml\?channel_id=/);
      calls += 1;
      return failing ? new Response('unavailable', { status: 503 }) : new Response(feed);
    },
  };
  let runtime = new Miniflare(convertV4MiniflareOptions(options));
  const json = async path => (await runtime.dispatchFetch(`https://internal${path}`)).json();
  const cron = async () => runtime.dispatchFetch('https://internal/test-cron?cron=*/5%20*%20*%20*%20*');
  try {
    const seed = await json('/x');
    assert.ok(seed.broadcasts.length >= 56);
    assert.equal(seed.health.metadata.lastSuccessAt, null);
    xSources = seed.broadcasts.filter(item => item.sourceUrl);
    const additions = [
      { id: '2onbAgvyKWBPYg', date: '2026-11-05', title: 'Verified November episode', sourceUrl: 'https://x.com/i/broadcasts/2onbAgvyKWBPYg' },
      { id: '1oKMvNPnEzDGQ', date: '2026-10-29', title: 'Verified October episode', sourceUrl: 'https://x.com/i/broadcasts/1oKMvNPnEzDGQ' },
    ];
    xSources = [...new Map([...xSources, ...additions].map(item => [item.id, item])).values()];
    await runtime.dispatchFetch('https://internal/test-cron?cron=1-59/10%20*%20*%20*%20*');
    const metadata = await json('/x');
    assert.equal(metadata.broadcasts.filter(item => item.id === additions[0].id).length, 1);
    assert.equal(metadata.broadcasts.filter(item => item.id === additions[1].id).length, 1);
    assert.ok(metadata.health.metadata.lastSuccessAt);
    assert.notEqual(metadata.version, seed.version);
    await runtime.dispatchFetch('https://internal/refresh/playback', { method: 'POST' });
    const playback = await json('/x');
    assert.equal(playback.broadcasts.find(item => item.id === additions[0].id).hlsUrl, '/api/x-media?url=https%3A%2F%2Fprod.video.pscp.tv%2FTranscoding%2Fv1%2Fhls%2Fnewest%2Fmaster.m3u8');
    assert.equal(playback.health.playback.errorCategory, 'upstream-429');
    await cron();
    const accepted = await json('/youtube');
    assert.equal(accepted.videos[0].videoId, video);
    assert.equal(accepted.source, 'youtube');
    assert.equal(accepted.health.provider, 'rss');
    assert.equal(accepted.health.primaryErrorCategory, null);
    assert.match(accepted.version, /^[a-f0-9]{64}$/);
    assert.equal((await json('/x')).version, playback.version);
    assert.equal(await (await runtime.dispatchFetch('https://internal/test-interrupt')).text(), 'rolled back');
    assert.equal((await json('/youtube')).version, accepted.version);
    assert.equal((await json('/youtube')).videos[0].title, 'Runtime upload');
    failing = true;
    await cron();
    const degraded = await json('/youtube');
    assert.equal(degraded.source, 'last-known-good');
    assert.equal(degraded.version, accepted.version);
    assert.equal(degraded.health.lastSuccessAt, accepted.health.lastSuccessAt);
    assert.equal(degraded.health.consecutiveFailures, 1);
    assert.equal(degraded.health.provider, 'rss');
    assert.equal(degraded.health.primaryErrorCategory, 'upstream-503');
    assert.equal(calls, 4);
    await runtime.dispose();
    runtime = new Miniflare(convertV4MiniflareOptions(options));
    const restored = await json('/youtube');
    assert.equal(restored.version, accepted.version);
    assert.equal(restored.source, 'last-known-good');
    assert.equal(restored.health.provider, 'rss');
    assert.equal((await json('/x')).version, playback.version);
    fallbackAvailable = true;
    await cron();
    const fallback = await json('/youtube');
    assert.equal(fallback.source, 'youtube');
    assert.equal(fallback.health.provider, 'youtube-data-api');
    assert.equal(fallback.health.primaryErrorCategory, 'upstream-503');
    assert.equal(fallback.health.consecutiveFailures, 0);
    assert.equal(fallback.version, accepted.version);
    assert.equal(fallback.publishedAt, accepted.publishedAt);
    await runtime.dispose();
    runtime = new Miniflare(convertV4MiniflareOptions(options));
    assert.equal((await json('/youtube')).health.provider, 'youtube-data-api');
    failing = false;
    await cron();
    const recovered = await json('/youtube');
    assert.equal(recovered.source, 'youtube');
    assert.equal(recovered.health.errorCategory, null);
    assert.equal(recovered.health.consecutiveFailures, 0);
    assert.equal(recovered.health.provider, 'rss');
    assert.equal(recovered.health.primaryErrorCategory, null);
    assert.equal(recovered.version, accepted.version);
  } finally {
    await runtime.dispose();
    await rm(persist, { recursive: true, force: true });
  }
});
