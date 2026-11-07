import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const source = await readFile(new URL('../app/lib/playable-broadcasts.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { runtimeBroadcasts } = await import(`data:text/javascript;base64,${Buffer.from(outputText.replace('"../../feeds/replay-url.mjs"', JSON.stringify(new URL("../feeds/replay-url.mjs", import.meta.url).href))).toString('base64')}`);
const replay = { id: '2onbAgvyKWBPYg', title: 'Verified newest replay', date: '2026-11-05', sourceUrl: 'https://x.com/i/broadcasts/2onbAgvyKWBPYg', poster: '/broadcasts/replay-card.svg', hlsUrl: '/api/x-media?url=https%3A%2F%2Fprod.video.pscp.tv%2FTranscoding%2Fv1%2Fhls%2Fmaster.m3u8' };
const space = { id: '1OxwbnMOjzEJB', title: 'Verified Space', date: '2026-10-15', sourceUrl: 'https://x.com/i/spaces/1OxwbnMOjzEJB', poster: '/broadcasts/replay-card.svg', hlsUrl: null };

test('accepts newly published runtime identities and metadata in newest-first order', () => {
  assert.equal(typeof runtimeBroadcasts, 'function');
  assert.deepEqual(runtimeBroadcasts({ broadcasts: [space, replay] }), [replay, space]);
});
test('retains external-only Spaces and archived records', () => {
  assert.equal(typeof runtimeBroadcasts, 'function');
  const archive = { ...space, id: 'audio-space-2026-07-30-01', sourceUrl: null };
  assert.deepEqual(runtimeBroadcasts({ broadcasts: [space, archive] }), [space, archive]);
});
test('rejects conflicting or malformed data before replacing client state', () => {
  assert.equal(typeof runtimeBroadcasts, 'function');
  for (const payload of [{}, { broadcasts: null }, { broadcasts: [replay, { ...replay, title: 'Conflicting' }] }, { broadcasts: [{ ...replay, sourceUrl: 'https://evil.example/i/broadcasts/2onbAgvyKWBPYg' }] }, { broadcasts: [{ ...replay, hlsUrl: 'https://evil.example/media' }] }, { broadcasts: [{ ...replay, title: '' }] }]) assert.throws(() => runtimeBroadcasts(payload));
  assert.deepEqual(runtimeBroadcasts({ broadcasts: [] }), []);
});
