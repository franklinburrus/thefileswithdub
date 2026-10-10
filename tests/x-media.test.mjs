import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

let upstream;
globalThis.fetch = (...args) => upstream(...args);
// Execute the route source so protocol regressions cannot pass against a stale build.
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const httpUrl = moduleUrl(stripTypeScriptTypes(await readFile(new URL("../app/lib/http.ts", import.meta.url), "utf8")));
const routeSource = stripTypeScriptTypes(await readFile(new URL("../app/api/x-media/route.ts", import.meta.url), "utf8"))
  .replace('from "../../lib/http"', `from ${JSON.stringify(httpUrl)}`);
const { GET } = await import(moduleUrl(routeSource));
const root = "https://prod-fastly-us-east-1.video.pscp.tv/Transcoding/v1/hls/native-test/";
const manifest = "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=100000\nrendition/playlist.m3u8\n";

function sourceResponse(url, body, status, headers) {
  const response = new Response(body, { status, headers });
  Object.defineProperty(response, "url", { value: String(url) });
  return response;
}

function request(path, headers = {}) {
  return GET(new Request(`https://www.thefileswithdub.com/api/x-media?url=${encodeURIComponent(root + path)}`, { headers }));
}

test("HLS playlists have the canonical MIME type after rewriting", async () => {
  upstream = async url => sourceResponse(url, manifest, 200, { "content-type": "application/octet-stream" });
  const response = await request("master.m3u8");
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^application\/vnd\.apple\.mpegurl\b/i);
  assert.equal(Number(response.headers.get("content-length")), Buffer.byteLength(body));
  assert.match(body, /\/api\/x-media\?url=/);
});

test("manifest byte probes return a complete rewritten representation without stale range offsets", async () => {
  let forwardedRange;
  upstream = async (url, init) => {
    forwardedRange = new Headers(init.headers).get("range");
    return sourceResponse(url, manifest, forwardedRange ? 206 : 200, {
      "content-type": "application/vnd.apple.mpegurl",
      "accept-ranges": "bytes",
      ...(forwardedRange ? { "content-range": `bytes 0-${manifest.length - 1}/${manifest.length}` } : {}),
    });
  };
  const response = await request("master.m3u8", { range: `bytes=0-${manifest.length - 1}` });
  const body = await response.text();
  assert.equal(forwardedRange, null);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-range"), null);
  assert.equal(response.headers.get("accept-ranges"), "none");
  assert.equal(Number(response.headers.get("content-length")), Buffer.byteLength(body));
  assert.ok(body.startsWith("#EXTM3U\n"));
});

test("binary segment byte ranges retain their exact lengths and range metadata", async () => {
  let forwardedRange;
  upstream = async (url, init) => {
    forwardedRange = new Headers(init.headers).get("range");
    return sourceResponse(url, new Uint8Array([0x47, 0x40]), 206, {
      "content-type": "video/mp2t",
      "content-length": "2",
      "content-range": "bytes 0-1/188",
      "accept-ranges": "bytes",
    });
  };
  const response = await request("segment.ts", { range: "bytes=0-1" });
  assert.equal(forwardedRange, "bytes=0-1");
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), "bytes 0-1/188");
  assert.equal(response.headers.get("content-length"), "2");
  assert.equal(response.headers.get("accept-ranges"), "bytes");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array([0x47, 0x40]));
});

test("a ranged extensionless playlist is fetched whole before rewriting", async () => {
  const calls = [];
  upstream = async (url, init) => {
    const range = new Headers(init.headers).get("range");
    calls.push(range);
    return sourceResponse(url, manifest, range ? 206 : 200, {
      "content-type": "application/x-mpegurl",
      ...(range ? { "content-range": "bytes 0-66/67" } : {}),
    });
  };
  const response = await request("playlist", { range: "bytes=0-66" });
  const body = await response.text();
  assert.deepEqual(calls, ["bytes=0-66", null]);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-range"), null);
  assert.equal(Number(response.headers.get("content-length")), Buffer.byteLength(body));
  assert.match(body, /\/api\/x-media\?url=/);
});

test("encoded segment bodies do not retain a possibly compressed content length", async () => {
  upstream = async url => sourceResponse(url, new Uint8Array([0x47, 0x40]), 200, {
    "content-type": "video/mp2t", "content-length": "100", "content-encoding": "gzip",
  });
  const response = await request("segment.ts");
  assert.equal(response.headers.get("content-length"), null);
  assert.equal(response.headers.get("content-encoding"), null);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array([0x47, 0x40]));
});

test("playlist retries still reject redirects outside the approved media hosts", async () => {
  let calls = 0;
  upstream = async url => sourceResponse(++calls === 1 ? url : "https://example.com/playlist.m3u8", manifest, calls === 1 ? 206 : 200, {
    "content-type": "application/vnd.apple.mpegurl",
  });
  const response = await request("playlist", { range: "bytes=0-66" });
  assert.equal(calls, 2);
  assert.equal(response.status, 400);
  assert.equal(response.headers.get("cache-control"), "no-store");
});
