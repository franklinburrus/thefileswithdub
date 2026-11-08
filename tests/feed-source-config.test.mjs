import test from 'node:test';
import assert from 'node:assert/strict';
import { FeedRepository } from '../feeds/store.mjs';
import { refreshFeed } from '../feeds/jobs.mjs';
import { coordinatorScheduled } from '../feeds/coordinator.mjs';
import { readFile } from 'node:fs/promises';

const baseline = {
  id: '1oKMvNPnEzDGQ',
  title: 'Verified source',
  date: '2026-10-29',
  poster: '/broadcasts/replay-card.svg',
  sourceUrl: 'https://x.com/i/broadcasts/1oKMvNPnEzDGQ',
};
const fixtureId = '1FixtureOnlyWorksheet123456789';

function repository() {
  const values = new Map();
  const storage = {
    get: async key => structuredClone(values.get(key)),
    put: async (key, value) => { values.set(key, structuredClone(value)); },
    transaction: async callback => callback(storage),
  };
  return new FeedRepository(storage, 'x', [baseline]);
}

const csv = rows => rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');

test('isolated preview can ingest its own worksheet without changing the production default', async () => {
  const urls = [];
  const result = await refreshFeed(repository(), 'metadata', { CLIP_LIBRARY_SHEET_ID: fixtureId }, async input => {
    const url = new URL(input);
    urls.push(url);
    const rows = url.searchParams.get('gid') === '672400447'
      ? [['Broadcast date', 'Content type', 'Source broadcast URL', 'Episode key'], [baseline.date, 'X Video Broadcast', baseline.sourceUrl, baseline.id]]
      : [['Episode key', 'Broadcast title', 'Broadcast date'], [baseline.id, baseline.title, baseline.date]];
    return new Response(csv(rows));
  });
  assert.equal(result.accepted, true);
  assert.equal(urls.length, 2);
  assert.ok(urls.every(url => url.origin === 'https://docs.google.com' && url.pathname === `/spreadsheets/d/${fixtureId}/export`));
});

test('invalid configured worksheet identity fails closed before network access', async () => {
  let calls = 0;
  const repo = repository();
  const before = await repo.read();
  const result = await refreshFeed(repo, 'metadata', { CLIP_LIBRARY_SHEET_ID: '../escape?credential=private' }, async () => {
    calls++;
    throw new Error('must not fetch');
  });
  assert.equal(result.accepted, false);
  assert.equal(calls, 0);
  assert.equal((await repo.read()).version, before.version);
});

test('committed production schedules dispatch both feed owners while preview stays paused', async () => {
  const config = JSON.parse(await readFile(new URL('../wrangler.feeds.jsonc', import.meta.url), 'utf8'));
  for (const name of ['preview', 'production']) {
    const selected = config.env[name];
    const calls = [];
    const env = { ...selected.vars, FEED_STORE: { getByName: feed => ({
      refresh: async (_feed, lane) => { calls.push([feed, lane]); return { accepted: true }; },
    }) } };
    for (const cron of selected.triggers.crons) await coordinatorScheduled({ cron }, env);
    assert.deepEqual(calls, name === 'production' ? [['x', 'metadata'], ['youtube', 'youtube']] : []);
  }
});
