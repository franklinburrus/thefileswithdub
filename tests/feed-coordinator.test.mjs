import test from 'node:test';
import assert from 'node:assert/strict';
import { coordinatorFetch, coordinatorScheduled } from '../feeds/coordinator.mjs';

function environment() {
  const calls = [];
  const env = {
    FEED_REFRESH_ENABLED: 'false',
    FEED_STORE: { getByName: name => ({
      read: async () => { calls.push(['read', name]); return { health: { state: 'uninitialized' }, [name === 'x' ? 'broadcasts' : 'videos']: [], version: 'digest', publishedAt: null }; },
      refresh: async (_feed, lane) => { calls.push(['refresh', name, lane]); return { accepted: true }; },
    }) },
  };
  return { env, calls };
}

test('private coordinator routes read-only snapshots and health to independent objects', async () => {
  const { env, calls } = environment();
  const response = await coordinatorFetch(new Request('https://internal/health'), env);
  assert.deepEqual(await response.json(), { x: { state: 'uninitialized' }, youtube: { state: 'uninitialized' } });
  assert.deepEqual(calls, [['read', 'x'], ['read', 'youtube']]);
  assert.equal((await coordinatorFetch(new Request('https://internal/x'), env)).status, 200);
});

test('private warming requires POST and works while scheduled jobs remain paused', async () => {
  const { env, calls } = environment();
  assert.equal((await coordinatorFetch(new Request('https://internal/refresh/playback'), env)).status, 405);
  for (const lane of ['metadata', 'youtube', 'playback']) {
    assert.equal((await coordinatorFetch(new Request(`https://internal/refresh/${lane}`, { method: 'POST' }), env)).status, 200);
  }
  assert.deepEqual(calls, [['refresh', 'x', 'metadata'], ['refresh', 'youtube', 'youtube'], ['refresh', 'x', 'playback']]);
  assert.equal((await coordinatorFetch(new Request('https://internal/x', { method: 'POST' }), env)).status, 405);
});

test('independent scheduled lanes remain disabled until release gates pass', async () => {
  const { env, calls } = environment();
  await coordinatorScheduled({ cron: '*/5 * * * *' }, env);
  assert.equal(calls.length, 0);
  env.FEED_REFRESH_ENABLED = 'true';
  await coordinatorScheduled({ cron: '*/5 * * * *' }, env);
  await coordinatorScheduled({ cron: '1-59/10 * * * *' }, env);
  assert.deepEqual(calls, [['refresh', 'youtube', 'youtube'], ['refresh', 'x', 'metadata']]);
});
