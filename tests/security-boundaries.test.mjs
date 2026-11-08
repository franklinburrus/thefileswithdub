import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { handleImageOptimization } from '../node_modules/vinext/dist/server/image-optimization.js';
import { default as worker } from '../dist/server/index.js';

function imageRequest(source, endpoint = '/_next/image') {
  const url = new URL(endpoint, 'https://localhost');
  url.search = new URLSearchParams({ url: source, w: '640', q: '75' });
  return new Request(url);
}

const context = { waitUntil() {}, passThroughOnException() {} };
const environment = { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } };

test('image optimizer rejects SVG content before invoking a transform', async () => {
  let transforms = 0;
  const response = await handleImageOptimization(imageRequest('/untrusted.svg'), {
    fetchAsset: async () => new Response('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', {
      headers: { 'Content-Type': 'image/svg+xml' },
    }),
    transformImage: async () => { transforms++; throw new Error('SVG reached the transformer'); },
  });
  assert.equal(response.status, 400);
  assert.equal(transforms, 0);
});

test('deployed image handlers reject remote and recursive sources', async () => {
  for (const endpoint of ['/_next/image', '/_vinext/image']) {
    for (const source of ['http://127.0.0.1/private', 'https://untrusted.example/a.png', '//untrusted.example/a.png', '/_next/image?url=/a.png']) {
      const response = await worker.fetch(imageRequest(source, endpoint), environment, context);
      assert.equal(response.status, 400, `${endpoint} accepted ${source}`);
    }
  }
});

test('unknown Server Actions cannot invoke application code', async () => {
  const response = await worker.fetch(new Request('http://localhost/', {
    method: 'POST', headers: { 'Next-Action': 'security-nonexistent-action', Origin: 'https://untrusted.example' }, body: '[]',
  }), environment, context);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /Server action not found/);
  const subsequent = await worker.fetch(new Request('http://localhost/'), environment, context);
  assert.equal(subsequent.status, 200);
  assert.match(await subsequent.text(), /THE CULTURE/);
});

test('parser-scoped minimatch preserves dot-file and TypeScript glob behavior', () => {
  const estreeRequire = createRequire(import.meta.resolve('@typescript-eslint/typescript-estree'));
  const { minimatch } = estreeRequire('minimatch');
  assert.equal(minimatch('.config.ts', '*.ts', { dot: true }), true);
  assert.equal(minimatch('src/feed.ts', '*.ts', { dot: true }), false);
  assert.equal(minimatch('src/feed.ts', 'src/**/*.ts', { dot: true }), true);
  assert.equal(minimatch('src/feed.js', 'src/**/*.ts', { dot: true }), false);
  const { parse } = estreeRequire('@typescript-eslint/typescript-estree');
  assert.equal(parse('const count: number = 77;', { loc: true }).body[0].type, 'VariableDeclaration');
});

test('Satori uses the patched ZIP codec without changing round-trip content', () => {
  const satoriRequire = createRequire(import.meta.resolve('satori'));
  const { zipSync, unzipSync, strToU8, strFromU8 } = satoriRequire('fflate');
  const archive = zipSync({ 'font-metadata.txt': strToU8('The Files with Dub') });
  assert.equal(strFromU8(unzipSync(archive)['font-metadata.txt']), 'The Files with Dub');
});

test('patched OG renderer escapes untrusted text in generated SVG', async () => {
  const { readFile } = await import('node:fs/promises');
  const { default: satori } = await import('satori');
  const font = await readFile(new URL('../node_modules/@vercel/og/dist/Geist-Regular.ttf', import.meta.url));
  const svg = await satori({ type: 'div', props: { children: '<script>alert(1)</script>', style: { display: 'flex', fontFamily: 'Geist' } } }, {
    width: 600, height: 200, embedFont: false,
    fonts: [{ name: 'Geist', data: font, weight: 400, style: 'normal' }],
  });
  assert.doesNotMatch(svg, /<script>/);
  const renderedText = [...svg.matchAll(/<text\b[^>]*>(.*?)<\/text>/gs)].map(match => match[1]).join('');
  assert.equal(renderedText, '&lt;script&gt;alert(1)&lt;/script&gt;');
});
