import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("source sync preserves Space URLs, archives unverified identities, and excludes unrelated videos", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "broadcast-sync-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ["scripts", "app/lib", "public/broadcasts"]) await mkdir(join(root, dir), { recursive: true });
  await writeFile(join(root, "scripts/broadcasts-sync.mjs"), await readFile(new URL("../scripts/broadcasts-sync.mjs", import.meta.url)));
  await writeFile(join(root, "app/lib/x-broadcasts.ts"), 'export const xBroadcasts: XBroadcast[] = [];\n');
  const row = (key, type, url) => ["2026-09-14", "", "", "", "", "", "", "", url, type, key];
  await writeFile(join(root, "snapshot.json"), JSON.stringify({
    masterRows: [[],
      row("space", "X Audio Space", "https://x.com/i/spaces/1DxLdZjQNOaxm?s=20"),
      row("space-alias", "X Audio Space", "https://x.com/i/spaces/1DxLdZjQNOaxm"),
      row("archive", "X Video Broadcast", "https://x.com/thefileswithdub/status/123"),
      row("wrong-host", "X Video Broadcast", "https://evil.example/i/broadcasts/1DxLdZjlmrQxm"),
      row("youtube", "YouTube Video", "https://www.youtube.com/watch?v=unrelated"),
    ],
    titleRows: [[], ["space", "Verified Space"], ["archive", "Archived broadcast"], ["wrong-host", "No verified replay identity"]],
  }));
  execFileSync(process.execPath, [join(root, "scripts/broadcasts-sync.mjs"), "--snapshot", join(root, "snapshot.json")]);
  const generated = await readFile(join(root, "app/lib/x-broadcasts.ts"), "utf8");
  assert.match(generated, /sourceUrl: "https:\/\/x\.com\/i\/spaces\/1DxLdZjQNOaxm"/);
  assert.equal((generated.match(/id: "1DxLdZjQNOaxm"/g) ?? []).length, 1);
  assert.match(generated, /id: "archive"[^\n]+sourceUrl: null/);
  assert.match(generated, /id: "wrong-host"[^\n]+sourceUrl: null/);
  assert.doesNotMatch(generated, /youtube|evil\.example|\/status\//);
});
