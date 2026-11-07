import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const file = new URL('../worker/feed-gateway.ts', import.meta.url);
const source = existsSync(file) ? readFileSync(file, 'utf8') : '';
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { runtimeFeedResponse } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const request = (path = '/api/x-broadcasts', method = 'GET') => new Request(`https://example.com${path}`, { method });
function cacheFixture() {
  const values = new Map();
  return { values, match: async key => values.get(key.url)?.clone(), put: async (key, value) => { values.set(key.url, value.clone()); } };
}
function context() {
  const pending = [];
  return { waitUntil: promise => pending.push(promise), settle: () => Promise.all(pending) };
}

test('runtime publication changes cache identity without a Worker redeploy', async () => {
  assert.equal(typeof runtimeFeedResponse, 'function');
  let snapshot = { broadcasts: [{ id: 'one' }], version: 'one', health: { state: 'healthy' } };
  const calls = [];
  const service = { fetch: async input => { calls.push(input.url ?? String(input)); return Response.json(snapshot); } };
  const cache = cacheFixture(), ctx = context();
  const first = await runtimeFeedResponse(request('/api/x-broadcasts?ignored=yes'), service, ctx, cache);
  assert.equal(first.headers.get('cache-control'), 'no-store');
  await ctx.settle();
  snapshot = { broadcasts: [{ id: 'one' }, { id: 'two' }], version: 'two', health: { state: 'healthy' } };
  const second = await runtimeFeedResponse(request(), service, ctx, cache);
  assert.equal((await second.json()).broadcasts.length, 2);
  await ctx.settle();
  assert.equal(cache.values.size, 2);
  assert.deepEqual(calls, ['https://feeds/x', 'https://feeds/x']);
});

test('cached content receives current failure and recovery health', async () => {
  assert.equal(typeof runtimeFeedResponse, 'function');
  let health = { state: 'healthy', lastAttemptAt: 1 };
  const service = { fetch: async () => Response.json({ videos: [{ videoId: 'ysb4ulbDmZ0' }], version: 'same', source: health.state === 'healthy' ? 'youtube' : 'last-known-good', health }) };
  const cache = cacheFixture(), ctx = context();
  await runtimeFeedResponse(request('/api/videos'), service, ctx, cache);
  await ctx.settle();
  health = { state: 'degraded', lastAttemptAt: 2 };
  const degraded = await runtimeFeedResponse(request('/api/videos'), service, ctx, cache);
  assert.equal(degraded.headers.get('x-data-status'), 'degraded');
  assert.equal((await degraded.json()).source, 'last-known-good');
  health = { state: 'healthy', lastAttemptAt: 3 };
  assert.equal((await (await runtimeFeedResponse(request('/api/videos'), service, ctx, cache)).json()).health.lastAttemptAt, 3);
});

test('public feed paths cannot invoke private refresh operations', async () => {
  assert.equal(typeof runtimeFeedResponse, 'function');
  let calls = 0;
  const service = { fetch: async () => { calls++; return Response.json({}); } };
  assert.equal((await runtimeFeedResponse(request('/api/videos', 'POST'), service, context())).status, 405);
  assert.equal((await runtimeFeedResponse(request('/api/feed-health?path=/refresh/playback'), service, context())).status, 200);
  assert.equal(calls, 1);
});

test('coordinator failures and malformed snapshots produce uncached errors', async () => {
  assert.equal(typeof runtimeFeedResponse, 'function');
  for (const fetch of [async () => { throw new Error('unavailable'); }, async () => Response.json({ videos: [], version: null }), async () => new Response('bad', { status: 502 })]) {
    const response = await runtimeFeedResponse(request('/api/videos'), { fetch }, context());
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
});
