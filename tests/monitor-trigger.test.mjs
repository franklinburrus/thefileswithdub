import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const source = new URL('../monitor/trigger.mjs', import.meta.url);
const { runMonitorTrigger } = existsSync(source) ? await import(source.href) : {};
const attemptId = '5d783392-290c-4ad6-8adb-127201884aed';
const now = Date.parse('2026-11-08T01:00:00Z');
const event = { scheduledTime: now, cron: '2-59/5 * * * *' };
const env = { MONITOR_MODE: 'production', MONITOR_ENABLED: 'true', UPPTIME_DISPATCH_TOKEN: 'unit-test-credential' };
const base = 'https://api.github.com/repos/franklinburrus/thefileswithdub-status/actions/workflows/';
function run(id, status = 'completed', conclusion = 'success', age = 60_000, title = 'Feed health') {
  return { id, status, conclusion, updated_at: new Date(now - age).toISOString(), display_title: title, path: '.github/workflows/uptime.yml', head_branch: 'main', event: 'workflow_dispatch' };
}
function setup(responder = async (url, init) => init.method === 'POST' ? new Response(null, { status: 204 }) : Response.json({ workflow_runs: [run(7)] })) {
  const calls = [];
  const logs = [];
  const delays = [];
  return {
    calls, logs, delays,
    options: {
      now: () => now, uuid: () => attemptId, timeoutMs: 20,
      sleep: async delay => { delays.push(delay); },
      log: record => logs.push(record),
      fetcher: async (url, init) => { calls.push({ url, init }); return responder(url, init, calls.length); },
    },
  };
}

test('disabled trigger and absent credential never contact GitHub', async () => {
  assert.equal(typeof runMonitorTrigger, 'function');
  const fixture = setup();
  assert.equal((await runMonitorTrigger(event, { ...env, MONITOR_ENABLED: 'false' }, fixture.options)).dispatch.status, 'disabled');
  assert.equal((await runMonitorTrigger(event, { ...env, UPPTIME_DISPATCH_TOKEN: undefined }, fixture.options)).dispatch.status, 'blocked');
  assert.equal(fixture.calls.length, 0);
  assert.equal(fixture.logs.length, 2);
});

test('only validated modes and the approved cron are accepted', async () => {
  assert.equal(typeof runMonitorTrigger, 'function');
  for (const configured of [{ ...env, MONITOR_MODE: '../other' }, { ...env, MONITOR_ENABLED: 'yes' }]) {
    const fixture = setup();
    const result = await runMonitorTrigger(event, configured, fixture.options);
    assert.equal(result.dispatch.errorCategory, 'invalid-config');
    assert.equal(fixture.calls.length, 0);
  }
  const fixture = setup();
  await runMonitorTrigger({ ...event, cron: '* * * * *' }, env, fixture.options);
  assert.equal(fixture.calls.length, 0);
});

test('production dispatch uses fixed destination, ref, inputs and header-only authentication', async () => {
  assert.equal(typeof runMonitorTrigger, 'function');
  const fixture = setup();
  const result = await runMonitorTrigger(event, { ...env, REPOSITORY: 'attacker/other', WORKFLOW: 'evil.yml', API_URL: 'https://evil.example' }, fixture.options);
  const dispatch = fixture.calls[0];
  assert.equal(dispatch.url, `${base}uptime.yml/dispatches`);
  assert.equal(dispatch.init.method, 'POST');
  assert.equal(dispatch.init.redirect, 'manual');
  assert.equal(dispatch.init.headers.Authorization, `Bearer ${env.UPPTIME_DISPATCH_TOKEN}`);
  assert.deepEqual(JSON.parse(dispatch.init.body), { ref: 'main', inputs: { delivery_test: 'none', trigger_id: attemptId } });
  assert.equal(result.dispatch.status, 'accepted');
  assert.equal(result.dispatch.httpStatus, 204);
  assert.equal(result.attemptId, attemptId);
  assert.equal(result.scheduledTime, now);
  assert.equal(result.runInspection.latestCompleted.id, 7);
  assert.equal(result.runInspection.correlatedRun, null, 'dispatch acceptance does not fabricate a completed correlated run');
  assert.equal(fixture.logs.length, 1);
  assert.ok(!JSON.stringify(fixture.logs).includes(env.UPPTIME_DISPATCH_TOKEN));
  assert.ok(!dispatch.init.body.includes(env.UPPTIME_DISPATCH_TOKEN));
});

test('preview can only dispatch and inspect the smoke workflow', async () => {
  assert.equal(typeof runMonitorTrigger, 'function');
  const fixture = setup(async (url, init) => init.method === 'POST' ? new Response(null, { status: 204 }) : Response.json({ workflow_runs: [] }));
  await runMonitorTrigger(event, { ...env, MONITOR_MODE: 'preview' }, fixture.options);
  assert.ok(fixture.calls.every(call => call.url.startsWith(`${base}trigger-smoke.yml/`)));
});

test('transient network, rate limit and server failures use bounded retries', async () => {
  assert.equal(typeof runMonitorTrigger, 'function');
  for (const status of [429, 500, 503]) {
    const fixture = setup(async () => new Response('private upstream response', { status }));
    const result = await runMonitorTrigger(event, env, fixture.options);
    assert.equal(result.dispatch.status, 'failed');
    assert.equal(result.dispatch.attempts, 3);
    assert.equal(fixture.calls.length, 3);
    assert.equal(fixture.delays.length, 2);
    assert.ok(!JSON.stringify(fixture.logs).includes('private upstream response'));
  }
  const fixture = setup(async (url, init, count) => {
    if (count === 1) throw new Error(`network failure ${env.UPPTIME_DISPATCH_TOKEN}`);
    return init.method === 'POST' ? new Response(null, { status: 204 }) : Response.json({ workflow_runs: [] });
  });
  assert.equal((await runMonitorTrigger(event, env, fixture.options)).dispatch.attempts, 2);
  assert.ok(!JSON.stringify(fixture.logs).includes(env.UPPTIME_DISPATCH_TOKEN));
});

test('non-204 success codes, redirects and authorization failures are never accepted or followed', async () => {
  assert.equal(typeof runMonitorTrigger, 'function');
  for (const status of [200, 201, 202, 301, 302, 400, 401, 403, 404, 422]) {
    const fixture = setup(async () => new Response('private error', { status, headers: { Location: 'https://evil.example' } }));
    const result = await runMonitorTrigger(event, env, fixture.options);
    assert.equal(result.dispatch.status, 'failed');
    assert.equal(result.dispatch.httpStatus, status);
    assert.equal(fixture.calls.length, 1);
  }
});

test('timeouts abort requests and stop at the retry bound even for an unresponsive fetcher', async () => {
  assert.equal(typeof runMonitorTrigger, 'function');
  const fixture = setup(() => new Promise(() => {}));
  const result = await runMonitorTrigger(event, env, fixture.options);
  assert.equal(result.dispatch.errorCategory, 'timeout');
  assert.equal(fixture.calls.length, 3);
  assert.ok(fixture.calls.every(call => call.init.signal.aborted));
});

test('inspection failure cannot change an accepted dispatch or leak upstream content', async () => {
  assert.equal(typeof runMonitorTrigger, 'function');
  const fixture = setup(async (url, init) => init.method === 'POST' ? new Response(null, { status: 204 }) : new Response('secret error response', { status: 403 }));
  const result = await runMonitorTrigger(event, env, fixture.options);
  assert.equal(result.dispatch.status, 'accepted');
  assert.equal(result.runInspection.status, 'failed');
  assert.equal(result.runInspection.errorCategory, 'http-403');
  assert.ok(!JSON.stringify(fixture.logs).includes('secret error response'));
});

test('malformed, wrong-workflow and oversized inspection bodies fail closed', async () => {
  assert.equal(typeof runMonitorTrigger, 'function');
  const bodies = [
    () => new Response('{malformed'),
    () => Response.json({ workflow_runs: 'wrong' }),
    () => Response.json({ workflow_runs: [{ ...run(1), path: '.github/workflows/other.yml' }] }),
    () => new Response('x', { headers: { 'Content-Length': '131073' } }),
    () => new Response('x'.repeat(131073)),
  ];
  for (const body of bodies) {
    const fixture = setup(async (url, init) => init.method === 'POST' ? new Response(null, { status: 204 }) : body());
    const result = await runMonitorTrigger(event, env, fixture.options);
    assert.equal(result.dispatch.status, 'accepted');
    assert.equal(result.runInspection.status, 'failed');
    assert.equal(fixture.calls.length, 2);
  }
});

test('inspection reports newest completion, success age, failures and exact attempt correlation', async () => {
  assert.equal(typeof runMonitorTrigger, 'function');
  const runs = [run(4, 'completed', 'success', 60_000), run(9, 'completed', 'failure', 10_000), run(10, 'queued', null, 0, `Feed health ${attemptId}`)];
  const fixture = setup(async (url, init) => init.method === 'POST' ? new Response(null, { status: 204 }) : Response.json({ workflow_runs: runs }));
  const inspection = (await runMonitorTrigger(event, env, fixture.options)).runInspection;
  assert.equal(inspection.latestCompleted.id, 9);
  assert.equal(inspection.latestCompleted.conclusion, 'failure');
  assert.equal(inspection.latestSuccess.id, 4);
  assert.equal(inspection.successAgeMs, 60_000);
  assert.equal(inspection.stale, false);
  assert.equal(inspection.correlatedRun.id, 10);
  assert.equal(inspection.correlatedRun.status, 'queued');
  assert.equal(inspection.errorCategory, 'run-failed');
  assert.equal(inspection.latestCompleted.url, 'https://github.com/franklinburrus/thefileswithdub-status/actions/runs/9');
});

test('missing success or success older than fifteen minutes is reported stale', async () => {
  assert.equal(typeof runMonitorTrigger, 'function');
  for (const runs of [[], [run(1, 'completed', 'success', 900_001)], [run(2, 'completed', 'failure')]]) {
    const fixture = setup(async (url, init) => init.method === 'POST' ? new Response(null, { status: 204 }) : Response.json({ workflow_runs: runs }));
    const inspection = (await runMonitorTrigger(event, env, fixture.options)).runInspection;
    assert.equal(inspection.stale, true);
    assert.equal(inspection.status, 'observed');
  }
});

test('inspection body timeout preserves accepted dispatch and remains bounded', async () => {
  const fixture = setup(async (url, init) => init.method === 'POST'
    ? new Response(null, { status: 204 })
    : new Response(new ReadableStream({ start() {} })));
  const result = await runMonitorTrigger(event, env, fixture.options);
  assert.equal(result.dispatch.status, 'accepted');
  assert.equal(result.runInspection.errorCategory, 'timeout');
  assert.equal(fixture.calls.length, 4);
});

test('invalid credentials and response-supplied status text cannot leak into structured logs', async () => {
  const blocked = setup();
  await runMonitorTrigger(event, { ...env, UPPTIME_DISPATCH_TOKEN: 'token\nheader' }, blocked.options);
  assert.equal(blocked.calls.length, 0);
  const fixture = setup(async (url, init) => init.method === 'POST' ? new Response(null, { status: 204 }) : Response.json({ workflow_runs: [{ ...run(1), conclusion: env.UPPTIME_DISPATCH_TOKEN }] }));
  const result = await runMonitorTrigger(event, env, fixture.options);
  assert.equal(result.runInspection.status, 'failed');
  assert.ok(!JSON.stringify(fixture.logs).includes(env.UPPTIME_DISPATCH_TOKEN));
});

test('fixed five-run inspection accepts realistic GitHub metadata within the unchanged body budget', async () => {
  const runs = Array.from({ length: 5 }, (_, index) => ({
    ...run(index + 1, 'completed', 'success', index * 60_000),
    repository: { description: 'r'.repeat(14_100) },
  }));
  const responseBody = JSON.stringify({ workflow_runs: runs });
  assert.ok(Buffer.byteLength(responseBody) > 70_000);
  assert.ok(Buffer.byteLength(responseBody) < 131_072);
  const fixture = setup(async (url, init) => {
    if (init.method === 'POST') return new Response(null, { status: 204 });
    assert.equal(new URL(url).searchParams.get('per_page'), '5');
    return new Response(responseBody);
  });
  const result = await runMonitorTrigger(event, env, fixture.options);
  assert.equal(result.dispatch.status, 'accepted');
  assert.equal(result.runInspection.status, 'observed');
  assert.equal(result.runInspection.latestSuccess.id, 1);
  assert.equal(result.runInspection.stale, false);
  assert.equal(fixture.calls.length, 2);
});

test('inspection rejects responses exceeding its five-run page bound without changing accepted dispatch', async () => {
  const runs = Array.from({ length: 6 }, (_, index) => run(index + 1));
  const fixture = setup(async (url, init) => init.method === 'POST' ? new Response(null, { status: 204 }) : Response.json({ workflow_runs: runs }));
  const result = await runMonitorTrigger(event, env, fixture.options);
  assert.equal(result.dispatch.status, 'accepted');
  assert.equal(result.runInspection.status, 'failed');
  assert.equal(result.runInspection.errorCategory, 'invalid-response');
  assert.equal(fixture.calls.length, 2);
});
