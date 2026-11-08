import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions, Log, LogLevel } from 'miniflare';

test('monitor configuration keeps both environments private and stateless', async () => {
  const config = JSON.parse(await readFile(new URL('../wrangler.monitor.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.account_id, 'ea7a77735549fff1fba3e54e742e6e7b');
  assert.equal(config.compatibility_date, '2026-09-12');
  assert.deepEqual(config.secrets.required, ['UPPTIME_DISPATCH_TOKEN']);
  for (const [name, enabled] of [['preview', 'false'], ['production', 'true']]) {
    const environment = config.env[name];
    assert.equal(environment.vars.MONITOR_MODE, name);
    assert.equal(environment.vars.MONITOR_ENABLED, enabled);
    assert.deepEqual(environment.secrets.required, ['UPPTIME_DISPATCH_TOKEN']);
    assert.equal(environment.name, `thefileswithdub-monitor-trigger${name === 'preview' ? '-preview' : ''}`);
    assert.deepEqual(environment.triggers.crons, ['2-59/5 * * * *']);
    for (const target of [config, environment]) {
      assert.equal(target.workers_dev, false);
      assert.equal(target.preview_urls, false);
      assert.deepEqual(target.routes, []);
      for (const binding of ['kv_namespaces', 'durable_objects', 'migrations', 'services']) assert.equal(target[binding], undefined);
    }
  }
});

test('real local Workers scheduled event dispatches only the smoke workflow and rejects HTTP invocation', { timeout: 30000 }, async () => {
  const bundle = await build({ entryPoints: ['monitor/index.ts'], bundle: true, write: false, format: 'esm', platform: 'neutral' });
  const calls = [];
  const runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-09-12',
    log: new Log(LogLevel.NONE),
    bindings: { MONITOR_MODE: 'preview', MONITOR_ENABLED: 'true', UPPTIME_DISPATCH_TOKEN: 'local-runtime-test-token' },
    outboundService: async request => {
      const url = new URL(request.url);
      calls.push({ origin: url.origin, method: request.method, path: url.pathname, authorization: request.headers.get('authorization'), body: request.method === 'POST' ? await request.json() : null });
      return request.method === 'POST' ? new Response(null, { status: 204 }) : Response.json({ workflow_runs: [] });
    },
  }));
  try {
    assert.equal((await runtime.dispatchFetch('https://internal/refresh', { method: 'POST' })).status, 404);
    assert.equal(calls.length, 0);
    const worker = await runtime.getWorker();
    await worker.scheduled({ scheduledTime: Date.now(), cron: '2-59/5 * * * *' });
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.equal(call.origin, 'https://api.github.com');
      assert.ok(call.path.startsWith('/repos/franklinburrus/thefileswithdub-status/actions/workflows/trigger-smoke.yml/'));
      assert.equal(call.authorization, 'Bearer local-runtime-test-token');
    }
    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[0].body.ref, 'main');
    assert.equal(calls[0].body.inputs.delivery_test, 'none');
    assert.match(calls[0].body.inputs.trigger_id, /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/);
    assert.equal(calls[1].method, 'GET');
  } finally {
    await runtime.dispose();
  }
});
