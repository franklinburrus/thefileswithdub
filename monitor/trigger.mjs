const CRON = '2-59/5 * * * *';
const WORKFLOWS = { preview: 'trigger-smoke.yml', production: 'uptime.yml' };
const REPOSITORY = 'franklinburrus/thefileswithdub-status';
const API = `https://api.github.com/repos/${REPOSITORY}/actions/workflows/`;
const MAX_INSPECTION_BYTES = 131_072;
const MAX_INSPECTION_RUNS = 5;
const STALE_MS = 15 * 60_000;
const RUN_STATES = new Set(['queued', 'in_progress', 'completed', 'requested', 'waiting', 'pending']);
const CONCLUSIONS = new Set(['success', 'failure', 'neutral', 'cancelled', 'skipped', 'timed_out', 'action_required', 'startup_failure', 'stale']);

class RequestFailure extends Error {
  constructor(category, retryable = false, httpStatus = null) {
    super(category);
    this.category = category;
    this.retryable = retryable;
    this.httpStatus = httpStatus;
  }
}

async function boundedJson(response, setReader) {
  if (Number(response.headers.get('Content-Length')) > MAX_INSPECTION_BYTES) throw new RequestFailure('response-too-large');
  if (!response.body) throw new RequestFailure('invalid-response');
  const reader = response.body.getReader();
  setReader(reader);
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) return JSON.parse(text + decoder.decode());
    bytes += value.byteLength;
    if (bytes > MAX_INSPECTION_BYTES) throw new RequestFailure('response-too-large');
    text += decoder.decode(value, { stream: true });
  }
}

/** Only fixed caller-owned paths reach this helper. Never log request/response bodies. */
async function githubRequest(url, init, expectedStatus, options) {
  const fetcher = options.fetcher;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    let reader;
    let deadline;
    try {
      const timeout = new Promise((resolve, reject) => {
        deadline = setTimeout(() => {
          controller.abort();
          reject(new RequestFailure('timeout', true));
        }, options.timeoutMs);
      });
      const work = (async () => {
        let response;
        try {
          response = await fetcher(url, { ...init, redirect: 'manual', signal: controller.signal });
        } catch {
          throw new RequestFailure(controller.signal.aborted ? 'timeout' : 'network', true);
        }
        if (response.status !== expectedStatus) {
          void response.body?.cancel().catch(() => {});
          throw new RequestFailure(`http-${response.status}`, response.status === 429 || response.status >= 500, response.status);
        }
        if (expectedStatus === 204) {
          void response.body?.cancel().catch(() => {});
          return null;
        }
        return boundedJson(response, value => { reader = value; });
      })();
      const value = await Promise.race([work, timeout]);
      return { ok: true, httpStatus: expectedStatus, attempts: attempt, value };
    } catch (error) {
      const failure = error instanceof RequestFailure ? error : new RequestFailure('invalid-response');
      if (!failure.retryable || attempt === 3) return { ok: false, httpStatus: failure.httpStatus, attempts: attempt, errorCategory: failure.category };
    } finally {
      clearTimeout(deadline);
      controller.abort();
      void reader?.cancel().catch(() => {});
    }
    await options.sleep(attempt === 1 ? 500 : 1500);
  }
}

function inspectRuns(body, workflow, attemptId, now) {
  if (!body || !Array.isArray(body.workflow_runs) || body.workflow_runs.length > MAX_INSPECTION_RUNS) throw new RequestFailure('invalid-response');
  const runs = body.workflow_runs.map(run => {
    const updated = Date.parse(run.updated_at);
    if (!Number.isSafeInteger(run.id) || run.id <= 0 || !RUN_STATES.has(run.status)
      || (run.conclusion !== null && !CONCLUSIONS.has(run.conclusion))
      || (run.status === 'completed' && run.conclusion === null)
      || run.path !== `.github/workflows/${workflow}` || run.head_branch !== 'main' || run.event !== 'workflow_dispatch'
      || !Number.isFinite(updated) || updated > now + 60_000 || typeof run.display_title !== 'string') throw new RequestFailure('invalid-response');
    return {
      id: run.id, url: `https://github.com/${REPOSITORY}/actions/runs/${run.id}`,
      status: run.status, conclusion: run.conclusion,
      updatedAt: new Date(updated).toISOString(),
      correlated: run.display_title.includes(attemptId),
    };
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id);
  const latestCompleted = runs.find(run => run.status === 'completed') ?? null;
  const latestSuccess = runs.find(run => run.status === 'completed' && run.conclusion === 'success') ?? null;
  const successAgeMs = latestSuccess ? Math.max(0, now - Date.parse(latestSuccess.updatedAt)) : null;
  const stale = successAgeMs === null || successAgeMs > STALE_MS;
  return {
    status: 'observed', latestRun: runs[0] ?? null, latestCompleted, latestSuccess,
    correlatedRun: runs.find(run => run.correlated) ?? null,
    successAgeMs, stale,
    errorCategory: latestCompleted && latestCompleted.conclusion !== 'success' ? 'run-failed' : stale ? 'stale-success' : null,
  };
}

/** Scheduled dispatch acceptance and observed GitHub execution are distinct evidence. */
export async function runMonitorTrigger(event, env, dependencies = {}) {
  const options = {
    fetcher: fetch, now: Date.now, uuid: () => crypto.randomUUID(),
    sleep: delay => new Promise(resolve => setTimeout(resolve, delay)),
    timeoutMs: 10_000, log: record => console.log(JSON.stringify(record)),
    ...dependencies,
  };
  const mode = Object.hasOwn(WORKFLOWS, env.MONITOR_MODE) ? env.MONITOR_MODE : null;
  const workflow = mode ? WORKFLOWS[mode] : null;
  const result = {
    event: 'monitor-trigger', scheduledTime: Number.isFinite(event.scheduledTime) ? event.scheduledTime : null,
    attemptId: options.uuid(), mode, workflow,
    dispatch: { status: 'blocked', httpStatus: null, attempts: 0, errorCategory: null },
    runInspection: { status: 'not-inspected' },
  };
  if (!mode || !['true', 'false'].includes(env.MONITOR_ENABLED) || event.cron !== CRON || result.scheduledTime === null) {
    result.dispatch.errorCategory = 'invalid-config';
  } else if (env.MONITOR_ENABLED === 'false') {
    result.dispatch.status = 'disabled';
  } else if (typeof env.UPPTIME_DISPATCH_TOKEN !== 'string' || !env.UPPTIME_DISPATCH_TOKEN.trim()) {
    result.dispatch.errorCategory = 'missing-credential';
  } else if (/[\s\u0000-\u001f\u007f]/.test(env.UPPTIME_DISPATCH_TOKEN)) {
    result.dispatch.errorCategory = 'invalid-credential';
  } else {
    const headers = {
      Authorization: `Bearer ${env.UPPTIME_DISPATCH_TOKEN}`, Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'TheFilesWithDub-Monitor-Trigger',
    };
    const dispatch = await githubRequest(`${API}${workflow}/dispatches`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main', inputs: { delivery_test: 'none', trigger_id: result.attemptId } }),
    }, 204, options);
    result.dispatch = { status: dispatch.ok ? 'accepted' : 'failed', httpStatus: dispatch.httpStatus, attempts: dispatch.attempts, errorCategory: dispatch.errorCategory ?? null };
    if (dispatch.ok) {
      const inspection = await githubRequest(`${API}${workflow}/runs?branch=main&event=workflow_dispatch&per_page=${MAX_INSPECTION_RUNS}`, { method: 'GET', headers }, 200, options);
      if (inspection.ok) {
        try { result.runInspection = inspectRuns(inspection.value, workflow, result.attemptId, options.now()); }
        catch { result.runInspection = { status: 'failed', errorCategory: 'invalid-response' }; }
      } else result.runInspection = { status: 'failed', errorCategory: inspection.errorCategory };
    }
  }
  options.log(result);
  return result;
}
