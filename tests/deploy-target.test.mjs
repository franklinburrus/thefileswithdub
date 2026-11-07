import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
const path = new URL('../scripts/deploy-website.mjs', import.meta.url);
const helper = existsSync(path) ? await import(path.href) : {};
const account = 'ea7a77735549fff1fba3e54e742e6e7b';
const preview = { account_id: account, name: 'thefileswithdub-preview', workers_dev: true, routes: [], kv_namespaces: [], services: [{ binding: 'FEED_COORDINATOR', service: 'thefileswithdub-feeds-preview' }] };
const production = { account_id: account, name: 'thefileswithdub', workers_dev: false, routes: [{ pattern: 'www.thefileswithdub.com/*' }], kv_namespaces: [{ binding: 'BROADCASTS_KV', id: 'b6d04834005e47f09602c7a671915747' }], services: [{ binding: 'FEED_COORDINATOR', service: 'thefileswithdub-feeds' }] };

test('preview deploy rejects the default production-named generated artifact', () => {
  assert.equal(typeof helper.assertWebsiteTarget, 'function');
  assert.throws(() => helper.assertWebsiteTarget({ account_id: account, name: 'thefileswithdub', routes: [], services: [] }, 'preview'), /target|worker|binding/i);
});
test('preview deploy requires isolated service and excludes production bindings/routes', () => {
  assert.equal(typeof helper.assertWebsiteTarget, 'function');
  assert.doesNotThrow(() => helper.assertWebsiteTarget(preview, 'preview'));
  for (const invalid of [{ ...preview, account_id: 'wrong' }, { ...preview, services: production.services }, { ...preview, kv_namespaces: production.kv_namespaces }, { ...preview, routes: production.routes }]) assert.throws(() => helper.assertWebsiteTarget(invalid, 'preview'));
});
test('production target requires exact original KV route and production service', () => {
  assert.equal(typeof helper.assertWebsiteTarget, 'function');
  assert.doesNotThrow(() => helper.assertWebsiteTarget(production, 'production'));
  for (const invalid of [{ ...production, services: [] }, { ...production, kv_namespaces: [] }, { ...production, routes: [] }, { ...production, durable_objects: { bindings: [{ name: 'DB' }] } }, { ...production, exports: { FeedStore: { type: 'durable-object' } } }]) assert.throws(() => helper.assertWebsiteTarget(invalid, 'production'));
});
test('production upload requires the existing native-mobile acceptance record', () => {
  assert.equal(typeof helper.assertReleaseGates, 'function');
  assert.throws(() => helper.assertReleaseGates({ playback: { nativeMobile: 'PENDING' } }, 'production'), /native.mobile/i);
  assert.doesNotThrow(() => helper.assertReleaseGates({ nativeMobileAcceptance: { status: 'PASS', device: 'iPhone', browser: 'Safari', candidateCommit: 'candidate-a', previewWebsiteVersion: 'preview-a' } }, 'production', 'candidate-a'));
  assert.doesNotThrow(() => helper.assertReleaseGates({}, 'preview'));
});


test('native acceptance cannot authorize a different candidate or omit preview identity', () => {
  const receipt = { nativeMobileAcceptance: { status: 'PASS', device: 'iPhone', browser: 'Safari', candidateCommit: 'candidate-a', previewWebsiteVersion: 'preview-a' } };
  assert.throws(() => helper.assertReleaseGates(receipt, 'production', 'candidate-b'), /candidate/i);
  delete receipt.nativeMobileAcceptance.previewWebsiteVersion;
  assert.throws(() => helper.assertReleaseGates(receipt, 'production', 'candidate-a'), /preview/i);
});

test('deployment snapshot stays independent after generated dist is overwritten', async t => {
  assert.equal(typeof helper.freezeWebsiteArtifact, 'function');
  const fs = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join, dirname } = await import('node:path');
  const root = await fs.mkdtemp(join(tmpdir(), 'dub-deploy-freeze-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const dist = join(root, 'dist');
  await fs.mkdir(join(dist, 'server'), { recursive: true });
  await fs.mkdir(join(dist, 'client'), { recursive: true });
  await fs.writeFile(join(dist, 'server/index.js'), 'export default "verified";');
  await fs.writeFile(join(dist, 'client/page.js'), 'verified client');
  await fs.writeFile(join(dist, 'server/wrangler.json'), JSON.stringify({ ...preview, main: 'index.js', assets: { directory: '../client', binding: 'ASSETS' } }));
  const frozen = helper.freezeWebsiteArtifact(dist, join(root, 'artifacts'));
  await fs.writeFile(join(dist, 'server/index.js'), 'wrong later build');
  await fs.writeFile(join(dist, 'server/wrangler.json'), JSON.stringify(production));
  const config = JSON.parse(await fs.readFile(frozen, 'utf8'));
  assert.doesNotThrow(() => helper.assertWebsiteTarget(config, 'preview'));
  assert.equal(await fs.readFile(join(dirname(frozen), config.main), 'utf8'), 'export default "verified";');
});
