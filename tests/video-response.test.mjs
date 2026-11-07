import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import ts from 'typescript';
const path = new URL('../app/lib/video-response.ts', import.meta.url);
const { outputText } = ts.transpileModule(existsSync(path) ? readFileSync(path, 'utf8') : '', { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { videosFromResponse } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const video = { id: 1, title: 'Latest verified upload', runtime: 'New upload', date: 'Nov 6, 2026', videoId: 'ysb4ulbDmZ0', image: 'https://i.ytimg.com/vi/ysb4ulbDmZ0/hqdefault.jpg' };
test('accepts the current verified feed including last-known-good source state', () => {
  assert.equal(typeof videosFromResponse, 'function');
  assert.deepEqual(videosFromResponse({ videos: [video], source: 'last-known-good' }), [video]);
});
test('rejects duplicate and malformed YouTube entries as a whole snapshot', () => {
  assert.equal(typeof videosFromResponse, 'function');
  for (const videos of [[video, video], [{ ...video, videoId: 'bad' }], [{ ...video, title: '' }], [{ ...video, image: 'https://evil.example/track' }]]) assert.throws(() => videosFromResponse({ videos }));
});
