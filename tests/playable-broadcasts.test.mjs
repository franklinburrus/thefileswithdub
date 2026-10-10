import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/lib/playable-broadcasts.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const { playableBroadcasts } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

const catalog = [
  { id: "newest", title: "Current newest title", date: "2026-10-10", sourceUrl: "https://x.com/i/broadcasts/newest", poster: "/newest.jpg" },
  { id: "older", title: "Current older title", date: "2026-10-09", sourceUrl: "https://x.com/i/spaces/older", poster: "/older.jpg" },
  { id: "archive", title: "Archive only", date: "2026-10-08", sourceUrl: null, poster: "/archive.jpg" },
];

test("keeps compiled metadata and newest-first order when replay metadata is stale", () => {
  assert.deepEqual(playableBroadcasts(catalog, {
    broadcasts: [
      { id: "older", title: "Stale title", date: "2030-01-01", sourceUrl: "https://example.com/wrong", poster: "/wrong.jpg", hlsUrl: "/api/x-media?url=older" },
      { id: "newest", title: "Other stale title", date: "2020-01-01", sourceUrl: null, poster: "/stale.jpg", hlsUrl: "/api/x-media?url=newest" },
    ],
  }), [
    { id: "newest", title: "Current newest title", date: "2026-10-10", sourceUrl: "https://x.com/i/broadcasts/newest", poster: "/newest.jpg", hlsUrl: "/api/x-media?url=newest" },
    { id: "older", title: "Current older title", date: "2026-10-09", sourceUrl: "https://x.com/i/spaces/older", poster: "/older.jpg", hlsUrl: "/api/x-media?url=older" },
  ]);
});

test("excludes unknown and archive-only identities even when the response supplies media", () => {
  assert.deepEqual(playableBroadcasts(catalog, {
    broadcasts: [
      { id: "newest", hlsUrl: "/api/x-media?url=newest" },
      { id: "unknown", hlsUrl: "/api/x-media?url=unknown" },
      { id: "archive", sourceUrl: "https://x.com/i/broadcasts/archive", hlsUrl: "/api/x-media?url=archive" },
    ],
  }), [
    { id: "newest", title: "Current newest title", date: "2026-10-10", sourceUrl: "https://x.com/i/broadcasts/newest", poster: "/newest.jpg", hlsUrl: "/api/x-media?url=newest" },
  ]);
});

test("excludes missing, null, blank, and non-string replay URLs", () => {
  for (const hlsUrl of [undefined, null, "", "   ", 42, {}]) {
    assert.deepEqual(playableBroadcasts(catalog, {
      broadcasts: [{ id: "newest", hlsUrl }, { id: "older", hlsUrl: "/api/x-media?url=older" }],
    }), [
      { id: "older", title: "Current older title", date: "2026-10-09", sourceUrl: "https://x.com/i/spaces/older", poster: "/older.jpg", hlsUrl: "/api/x-media?url=older" },
    ]);
  }
  assert.deepEqual(playableBroadcasts(catalog, {
    broadcasts: [null, false, "newest", {}, { id: "older", hlsUrl: "/api/x-media?url=older" }],
  }), [
    { id: "older", title: "Current older title", date: "2026-10-09", sourceUrl: "https://x.com/i/spaces/older", poster: "/older.jpg", hlsUrl: "/api/x-media?url=older" },
  ]);
});

test("accepts an empty replay array but rejects malformed response shapes", () => {
  assert.deepEqual(playableBroadcasts(catalog, { broadcasts: [] }), []);
  for (const payload of [undefined, null, [], {}, { broadcasts: null }, { broadcasts: {} }]) {
    assert.throws(() => playableBroadcasts(catalog, payload));
  }
});
