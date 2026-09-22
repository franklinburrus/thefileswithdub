import assert from "node:assert/strict";
import test from "node:test";

const KV_KEY = "x-broadcasts:hls-v1";

// Vinext captures globalThis.fetch the first time the worker module is
// evaluated and routes every route-handler fetch through that captured
// reference (its patched fetch delegates to it and even overwrites
// globalThis.fetch on the first request). A per-test stub assigned after
// import is therefore invisible to the route. The seam that works: install
// ONE delegating stub before any import, and point it at a mutable handler
// per test.
const defaultFetchHandler = () => {
  throw new Error("unexpected upstream fetch (no handler set for this test)");
};
let fetchHandler = defaultFetchHandler;
globalThis.fetch = (...args) => fetchHandler(...args);

async function worker() {
  const url = new URL("../dist/server/index.js", import.meta.url);
  url.searchParams.set("kv-test", `${process.pid}-${Date.now()}`);
  return (await import(url.href)).default;
}

/** In-memory KVNamespace stand-in. get(key, "json") parses like the real binding. */
function fakeKv(initial = {}) {
  const store = new Map(Object.entries(initial));
  const calls = { gets: [], puts: [] };
  const binding = {
    get: async (key, type) => {
      calls.gets.push([key, type]);
      const raw = store.has(key) ? store.get(key) : null;
      if (raw === null) return null;
      return type === "json" ? JSON.parse(raw) : raw;
    },
    put: async (key, value) => {
      calls.puts.push([key, value]);
      store.set(key, value);
    },
  };
  return { calls, binding };
}

function execution() {
  const pending = [];
  return {
    pending,
    ctx: {
      waitUntil(promise) { pending.push(promise); },
      passThroughOnException() {},
    },
    async settle() { await Promise.allSettled(pending); },
  };
}

const baseEnv = (kv) => ({
  ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  BROADCASTS_KV: kv,
});

const catalogOf = (urls, resolvedAt = Date.now()) =>
  JSON.stringify({ resolvedAt, urls });

const X_HTML = (m3u8) =>
  `<html><body>window.__data = "${m3u8}";</body></html>`;

test("serves the broadcasts catalog from KV without fetching x.com", async (t) => {
  const instance = await worker();
  const m3u8 = "https://video.twimg.com/periscope-replay/v1/replay123.m3u8?token=abc";
  const { calls, binding } = fakeKv({
    [KV_KEY]: catalogOf({ "1DxLdZjlmrQxm": m3u8, "1DxLdZjQNOaxm": null }),
  });
  const exec = execution();

  t.after(() => { fetchHandler = defaultFetchHandler; });
  fetchHandler = async (input) => {
    throw new Error(`unexpected upstream fetch: ${input}`);
  };

  const response = await instance.fetch(
    new Request("https://www.thefileswithdub.com/api/x-broadcasts"),
    baseEnv(binding),
    exec.ctx,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("X-Broadcasts-Source"), "kv");
  const body = await response.json();
  assert.ok(Array.isArray(body.broadcasts) && body.broadcasts.length > 0);
  const entry = body.broadcasts.find((b) => b.id === "1DxLdZjlmrQxm");
  assert.ok(entry, "expected the KV-seeded broadcast in the response");
  assert.equal(entry.hlsUrl, `/api/x-media?url=${encodeURIComponent(m3u8)}`);
  const nulled = body.broadcasts.find((b) => b.id === "1DxLdZjQNOaxm");
  assert.equal(nulled?.hlsUrl, null);
  assert.equal(calls.gets.length, 1, "exactly one KV read per request");
});

test("falls back to live resolution when KV is empty, then populates KV", async (t) => {
  const instance = await worker();
  const { calls, binding } = fakeKv();
  const exec = execution();

  const m3u8 = "https://video.twimg.com/periscope-replay/v1/live456.m3u8";
  t.after(() => { fetchHandler = defaultFetchHandler; });
  fetchHandler = async () => new Response(X_HTML(m3u8), { status: 200 });

  const response = await instance.fetch(
    new Request("https://www.thefileswithdub.com/api/x-broadcasts"),
    baseEnv(binding),
    exec.ctx,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("X-Broadcasts-Source"), "origin");
  const body = await response.json();
  assert.ok(body.broadcasts.every((b) => b.hlsUrl === `/api/x-media?url=${encodeURIComponent(m3u8)}`));

  await exec.settle();
  assert.equal(calls.puts.length, 1, "lazy KV population after a live resolution");
  const [key, value] = calls.puts[0];
  assert.equal(key, KV_KEY);
  const stored = JSON.parse(value);
  assert.ok(stored.resolvedAt > 0);
  assert.equal(stored.urls["1DxLdZjlmrQxm"], m3u8);
});

test("treats a corrupt KV value as a miss instead of crashing", async (t) => {
  const instance = await worker();
  const { binding } = fakeKv({ [KV_KEY]: "this is not json {{{" });
  const exec = execution();

  const m3u8 = "https://video.twimg.com/periscope-replay/v1/ok789.m3u8";
  t.after(() => { fetchHandler = defaultFetchHandler; });
  fetchHandler = async () => new Response(X_HTML(m3u8), { status: 200 });

  const response = await instance.fetch(
    new Request("https://www.thefileswithdub.com/api/x-broadcasts"),
    baseEnv(binding),
    exec.ctx,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("X-Broadcasts-Source"), "origin");
});

test("serves stale KV data immediately and refreshes it in the background", async (t) => {
  const instance = await worker();
  const oldUrl = "https://video.twimg.com/periscope-replay/v1/old.m3u8";
  const newUrl = "https://video.twimg.com/periscope-replay/v1/fresh.m3u8";
  const { calls, binding } = fakeKv({
    [KV_KEY]: catalogOf({ "1DxLdZjlmrQxm": oldUrl }, Date.now() - 12 * 60 * 60 * 1000),
  });
  const exec = execution();

  t.after(() => { fetchHandler = defaultFetchHandler; });
  fetchHandler = async () => new Response(X_HTML(newUrl), { status: 200 });

  const response = await instance.fetch(
    new Request("https://www.thefileswithdub.com/api/x-broadcasts"),
    baseEnv(binding),
    exec.ctx,
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  const entry = body.broadcasts.find((b) => b.id === "1DxLdZjlmrQxm");
  assert.equal(entry.hlsUrl, `/api/x-media?url=${encodeURIComponent(oldUrl)}`, "stale data served, not waited on");

  await exec.settle();
  assert.ok(calls.puts.length >= 1, "background refresh wrote a fresh catalog");
  const stored = JSON.parse(calls.puts.at(-1)[1]);
  assert.equal(stored.urls["1DxLdZjlmrQxm"], newUrl);
  assert.ok(Date.now() - stored.resolvedAt < 60_000);
});

test("scheduled refresh resolves every broadcast and rewrites the KV catalog", async (t) => {
  const instance = await worker();
  assert.equal(typeof instance.scheduled, "function", "worker exposes a scheduled handler");
  const { calls, binding } = fakeKv();
  const exec = execution();

  const m3u8 = "https://video.pscp.tv/periscope-replay/v1/cron.m3u8?type=replay";
  t.after(() => { fetchHandler = defaultFetchHandler; });
  fetchHandler = async () => new Response(X_HTML(m3u8), { status: 200 });

  await instance.scheduled({ cron: "*/10 * * * *" }, baseEnv(binding), exec.ctx);
  await exec.settle();

  assert.equal(calls.puts.length, 1);
  const [key, value] = calls.puts[0];
  assert.equal(key, KV_KEY);
  const stored = JSON.parse(value);
  const ids = Object.keys(stored.urls);
  assert.ok(ids.length > 40, `expected the full catalog, got ${ids.length} entries`);
  assert.ok(ids.every((id) => stored.urls[id] === m3u8));
});

test("scheduled refresh over hostile HTML persists only https URLs or null", async (t) => {
  const instance = await worker();
  const { calls, binding } = fakeKv();
  const exec = execution();

  t.after(() => { fetchHandler = defaultFetchHandler; });
  fetchHandler = async () => new Response(
    `<html><body>
       <a href="javascript:alert('https://evil.example/pwn.m3u8')">x</a>
       <img src="data:text/html;base64,PGI+bG9iPC9iPg==">
       <video src="http://insecure.example/vid.m3u8"></video>
     </body></html>`,
    { status: 200 },
  );

  await instance.scheduled({ cron: "*/10 * * * *" }, baseEnv(binding), exec.ctx);
  await exec.settle();

  assert.equal(calls.puts.length, 1);
  const stored = JSON.parse(calls.puts[0][1]);
  for (const url of Object.values(stored.urls)) {
    assert.ok(url === null || url.startsWith("https://"), `unexpected URL persisted: ${url}`);
  }
});

test("scheduled refresh with a fresh catalog only resolves missing broadcasts", async (t) => {
  const instance = await worker();
  const m3u8 = "https://video.twimg.com/periscope-replay/v1/seed.m3u8";
  const { calls, binding } = fakeKv();
  const exec = execution();
  t.after(() => { fetchHandler = defaultFetchHandler; });
  fetchHandler = async () => new Response(X_HTML(m3u8), { status: 200 });

  // Full refresh once to learn every broadcast id.
  await instance.scheduled({ cron: "*/10 * * * *" }, baseEnv(binding), exec.ctx);
  await exec.settle();
  const full = JSON.parse(calls.puts.at(-1)[1]);
  const ids = Object.keys(full.urls);
  assert.ok(ids.length > 40, `expected the full catalog, got ${ids.length} entries`);

  // Re-seed KV with a FRESH catalog that is missing two broadcasts.
  const dropped = ids.slice(0, 2);
  const partial = {};
  for (const id of ids.slice(2)) partial[id] = full.urls[id];
  await binding.put(KV_KEY, catalogOf(partial));
  calls.puts.length = 0;

  let fetches = 0;
  fetchHandler = async () => {
    fetches++;
    return new Response(X_HTML(m3u8), { status: 200 });
  };

  await instance.scheduled({ cron: "*/10 * * * *" }, baseEnv(binding), exec.ctx);
  await exec.settle();

  assert.equal(fetches, 2, `expected only the 2 missing broadcasts to be fetched, got ${fetches}`);
  const stored = JSON.parse(calls.puts.at(-1)[1]);
  assert.equal(Object.keys(stored.urls).length, ids.length, "catalog covers every broadcast again");
  for (const id of dropped) assert.equal(stored.urls[id], m3u8, "missing broadcast resolved");
  for (const id of ids.slice(2)) {
    assert.equal(stored.urls[id], full.urls[id], "known URLs preserved, not re-fetched");
  }
});

test("scheduled refresh fully re-resolves a stale catalog", async (t) => {
  const instance = await worker();
  const oldUrl = "https://video.twimg.com/periscope-replay/v1/old.m3u8";
  const newUrl = "https://video.twimg.com/periscope-replay/v1/fresh.m3u8";
  const { calls, binding } = fakeKv({
    [KV_KEY]: catalogOf({ "1DxLdZjlmrQxm": oldUrl }, Date.now() - 12 * 60 * 60 * 1000),
  });
  const exec = execution();
  t.after(() => { fetchHandler = defaultFetchHandler; });
  fetchHandler = async () => new Response(X_HTML(newUrl), { status: 200 });

  await instance.scheduled({ cron: "*/10 * * * *" }, baseEnv(binding), exec.ctx);
  await exec.settle();

  const stored = JSON.parse(calls.puts.at(-1)[1]);
  assert.equal(stored.urls["1DxLdZjlmrQxm"], newUrl, "stale catalog gets a full re-resolution");
});

test("cold resolution fans out at 16 concurrent upstream fetches", async (t) => {
  const instance = await worker();
  const { binding } = fakeKv();
  const exec = execution();
  t.after(() => { fetchHandler = defaultFetchHandler; });

  let inFlight = 0;
  let maxInFlight = 0;
  fetchHandler = async () => {
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    try {
      // Yield so concurrently-started fetches overlap in flight; a
      // synchronous stub body would serialize them and measure nothing.
      await new Promise((resolve) => setTimeout(resolve, 5));
      return new Response(X_HTML("https://video.twimg.com/periscope-replay/v1/x.m3u8"), { status: 200 });
    } finally {
      inFlight--;
    }
  };

  await instance.scheduled({ cron: "*/10 * * * *" }, baseEnv(binding), exec.ctx);
  await exec.settle();

  assert.equal(maxInFlight, 16, `expected 16-way fan-out, observed ${maxInFlight}`);
});
