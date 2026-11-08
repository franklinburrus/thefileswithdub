import test from 'node:test';
import assert from 'node:assert/strict';
import { parseYoutubeFeed, fetchYoutubeVideos, CHANNEL_ID } from '../feeds/youtube.mjs';
import { extractPlaybackUrl, resolvePlayback } from '../feeds/playback.mjs';
import { readUpstreamText } from '../feeds/upstream.mjs';

const entry = (id = 'ysb4ulbDmZ0', date = '2026-11-07T12:00:00+00:00', channel = CHANNEL_ID) => `<entry><yt:videoId>${id}</yt:videoId><yt:channelId>${channel}</yt:channelId><title>Public &amp; Shorts</title><published>${date}</published></entry>`;
const rss = entries => `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><yt:channelId>${CHANNEL_ID.slice(2)}</yt:channelId><author><name>Dub</name><uri>https://www.youtube.com/channel/${CHANNEL_ID}</uri></author>${entries}</feed>`;

test('YouTube validates canonical author and entries while accepting shortened top-level channel ID', () => {
  const videos = parseYoutubeFeed(rss(entry('aaaaaaaaaaa', '2026-11-06T12:00:00+00:00') + entry()));
  assert.equal(videos.length, 2);
  assert.equal(videos[0].videoId, 'ysb4ulbDmZ0');
  assert.equal(videos[0].title, 'Public & Shorts');
  assert.equal(videos[0].publishedAt, '2026-11-07T12:00:00.000Z');
  assert.equal(videos[0].id, 1);
});

test('YouTube rejects wrong-channel, empty, malformed and duplicate candidates', () => {
  for (const bad of [rss(''), rss(entry('bad')), rss(entry() + entry()), rss(entry('ysb4ulbDmZ0', 'wrong')), rss(entry('ysb4ulbDmZ0', '2026-11-07T12:00:00Z', 'UCwrong')), rss(entry()).replace(`/channel/${CHANNEL_ID}`, '/channel/UCwrong'), rss(entry()).replace('</feed>', ''), rss(entry()).replace('</entry>', ''), rss(entry()).replace('<title>', '<title></title><title>')]) {
    assert.throws(() => parseYoutubeFeed(bad), /invalid|empty|channel|duplicate/);
  }
});

test('YouTube retries thrown network errors as well as HTTP errors', async () => {
  let count = 0;
  const { videos } = await fetchYoutubeVideos(async () => {
    count += 1;
    if (count === 1) throw new TypeError('Network failed');
    if (count === 2) return new Response('', { status: 404 });
    return new Response(rss(entry()));
  });
  assert.equal(count, 3);
  assert.equal(videos[0].videoId, 'ysb4ulbDmZ0');
});

test('YouTube bounds repeated network failures and keeps API fallback disabled by default', async () => {
  let count = 0;
  await assert.rejects(fetchYoutubeVideos(async () => { count += 1; throw new Error('secret upstream text'); }, { YOUTUBE_DATA_API_KEY: 'should-not-activate' }), /network/);
  assert.equal(count, 3);
});

test('bounded response reader rejects declared and streamed oversized bodies', async () => {
  await assert.rejects(readUpstreamText('https://fixed.example', { maxBytes: 4, fetcher: async () => new Response('hello') }), /response-too-large/);
  await assert.rejects(readUpstreamText('https://fixed.example', { maxBytes: 4, fetcher: async () => new Response('hi', { headers: { 'Content-Length': '50' } }) }), /response-too-large/);
});

test('playback extracts encoded HTTPS manifests only from approved Periscope subdomains', () => {
  const good = 'https://prod.video.pscp.tv/Transcoding/v1/hls/replay/master.m3u8?token=abc&foo=bar';
  assert.equal(extractPlaybackUrl(JSON.stringify({ url: good })), good);
  assert.equal(extractPlaybackUrl(JSON.stringify({ url: good }).replaceAll('/', '\\/')), good);
  assert.equal(extractPlaybackUrl(`<x>${good.replaceAll('&', '&amp;')}</x>`), good);
  assert.equal(extractPlaybackUrl('https://evilvideo.pscp.tv/path.m3u8'), null);
  assert.equal(extractPlaybackUrl('https://prod.video.pscp.tv.evil.com/path.m3u8'), null);
  assert.equal(extractPlaybackUrl('http://prod.video.pscp.tv/path.m3u8'), null);
  assert.equal(extractPlaybackUrl('https://user:pass@prod.video.pscp.tv/path.m3u8'), null);
});

test('playback fetches metadata source URL and returns categorized failure per identity', async () => {
  const item = { id: '1DxLdZjlmrQxm', sourceUrl: 'https://x.com/i/broadcasts/1DxLdZjlmrQxm' };
  let requested;
  const [result] = await resolvePlayback([item], async url => { requested = url; return new Response('', { status: 429 }); });
  assert.equal(requested, item.sourceUrl);
  assert.equal(result.id, item.id);
  assert.equal(result.sourceUrl, item.sourceUrl);
  assert.equal(result.errorCategory, 'upstream-429');
});

test('bounded upstream reader follows only explicitly allowed HTTPS redirect hosts', async () => {
  const requested = [];
  const body = await readUpstreamText('https://docs.google.com/export', { allowedRedirectHosts: ['docs.google.com', '.googleusercontent.com'], fetcher: async url => {
    requested.push(url);
    return requested.length === 1 ? new Response(null, { status: 302, headers: { Location: 'https://doc-123.googleusercontent.com/export.csv' } }) : new Response('csv');
  } });
  assert.equal(body, 'csv');
  assert.equal(requested.length, 2);
  await assert.rejects(readUpstreamText('https://docs.google.com/export', { allowedRedirectHosts: ['docs.google.com', '.googleusercontent.com'], fetcher: async () => new Response(null, { status: 302, headers: { Location: 'https://attacker.example/data' } }) }), /invalid-source/);
});

test('YouTube rejects mismatched XML wrapper tags', () => {
  assert.throws(() => parseYoutubeFeed(rss(entry()).replace('<name>Dub</name>', '<name>Dub</wrong>')), /invalid/);
});

test('playback extracts HTML-quoted manifests without retaining quote entities', () => {
  const good = 'https://prod.video.pscp.tv/Transcoding/v1/hls/replay/master.m3u8?token=abc&foo=bar';
  assert.equal(extractPlaybackUrl(`&quot;${good.replaceAll('&', '&amp;')}&quot;`), good);
});

test('external-only Spaces do not count as failed video playback refreshes', async () => {
  let calls = 0;
  const results = await resolvePlayback([{ id: '1OxwbnMOjzEJB', sourceUrl: 'https://x.com/i/spaces/1OxwbnMOjzEJB' }], async () => { calls++; return new Response('', { status: 302, headers: { Location: '/i/spaces/1OxwbnMOjzEJB/peek' } }); });
  assert.deepEqual(results, []);
  assert.equal(calls, 0);
});

test('resolved HLS URLs must satisfy the website proxy path and origin boundary', () => {
  assert.equal(extractPlaybackUrl('https://prod.video.pscp.tv/outside/master.m3u8'), null);
  assert.equal(extractPlaybackUrl('https://nested.prod.video.pscp.tv/Transcoding/v1/hls/master.m3u8'), null);
});

test('opt-in Data API fallback sends the key in a header without URL or error disclosure', async () => {
  const secret = 'fixture-key-keep-out-of-urls';
  let apiCalls = 0;
  const { videos } = await fetchYoutubeVideos(async (input, init) => {
    const url = new URL(input);
    assert.equal(url.href.includes(secret), false);
    if (url.hostname === 'www.youtube.com') return new Response('unavailable', { status: 404 });
    apiCalls++;
    assert.equal(new Headers(init.headers).get('X-Goog-Api-Key'), secret);
    if (url.pathname.endsWith('/playlistItems')) return Response.json({ kind: 'youtube#playlistItemListResponse', items: [{
      kind: 'youtube#playlistItem',
      snippet: { channelId: CHANNEL_ID, playlistId: `UU${CHANNEL_ID.slice(2)}`, videoOwnerChannelId: CHANNEL_ID, resourceId: { kind: 'youtube#video', videoId: 'ysb4ulbDmZ0' } },
      contentDetails: { videoId: 'ysb4ulbDmZ0' },
    }] });
    return Response.json({ kind: 'youtube#videoListResponse', items: [{
      kind: 'youtube#video', id: 'ysb4ulbDmZ0',
      snippet: { channelId: CHANNEL_ID, title: 'API upload', publishedAt: '2026-11-06T20:30:28Z' },
      status: { privacyStatus: 'public', uploadStatus: 'processed' },
    }] });
  }, { YOUTUBE_DATA_API_FALLBACK_ENABLED: 'true', YOUTUBE_DATA_API_KEY: secret });
  assert.equal(apiCalls, 2);
  assert.equal(videos[0].videoId, 'ysb4ulbDmZ0');
});
