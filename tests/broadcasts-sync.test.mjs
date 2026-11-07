import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, rm, stat, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const id = "2onbAgvyKWBPYg";
const snapshot = {
  masterRows: [["Broadcast date", "Content type", "Source broadcast URL", "Episode key"], ["2026-11-05", "X Video Broadcast", `https://x.com/i/broadcasts/${id}`, "new"]],
  titleRows: [["Episode key", "Broadcast title"], ["new", "Verified title"]],
};
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "broadcast-sync-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ["scripts", "feeds", "app/lib", "public/broadcasts"]) await mkdir(join(root, dir), { recursive: true });
  for (const file of ["scripts/broadcasts-sync.mjs", "feeds/x-source.mjs"]) await writeFile(join(root, file), await readFile(new URL(`../${file}`, import.meta.url)));
  const target = join(root, "app/lib/x-broadcasts.ts");
  await writeFile(target, 'export const xBroadcasts: XBroadcast[] = [];\n// Keep helper\n');
  const input = join(root, "snapshot.json");
  await writeFile(input, JSON.stringify(snapshot));
  return { root, target, input, script: join(root, "scripts/broadcasts-sync.mjs") };
}

test("sync validates then atomically writes once and repeat run keeps exact bytes and mtime", async t => {
  const f = await fixture(t);
  execFileSync(process.execPath, [f.script, "--snapshot", f.input]);
  const generated = await readFile(f.target, "utf8");
  const before = await stat(f.target);
  assert.match(generated, new RegExp(`id: "${id}"`));
  assert.match(generated, /Keep helper/);
  execFileSync(process.execPath, [f.script, "--snapshot", f.input]);
  assert.equal(await readFile(f.target, "utf8"), generated);
  assert.equal((await stat(f.target)).mtimeMs, before.mtimeMs);
  assert.deepEqual(await readdir(join(f.root, "app/lib")), ["x-broadcasts.ts"]);
});

test("check reports candidate without writing and malformed input never changes target", async t => {
  const f = await fixture(t);
  const before = await readFile(f.target, "utf8");
  const report = execFileSync(process.execPath, [f.script, "--snapshot", f.input, "--check"], { encoding: "utf8" });
  assert.match(report, /added/);
  assert.equal(await readFile(f.target, "utf8"), before);
  await writeFile(f.input, JSON.stringify({ ...snapshot, titleRows: [["Episode key", "Broadcast title"]] }));
  const failed = spawnSync(process.execPath, [f.script, "--snapshot", f.input], { encoding: "utf8" });
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /missing.*title/i);
  assert.equal(await readFile(f.target, "utf8"), before);
});

test("marker injection rejects before writing", async t => {
  const f = await fixture(t);
  const before = await readFile(f.target, "utf8");
  await writeFile(f.input, JSON.stringify({ ...snapshot, titleRows: [["Episode key", "Broadcast title"], ["new", "// ---- END GENERATED ----"]] }));
  const failed = spawnSync(process.execPath, [f.script, "--snapshot", f.input], { encoding: "utf8" });
  assert.notEqual(failed.status, 0);
  assert.equal(await readFile(f.target, "utf8"), before);
});

test("quoted title text containing array terminators survives repeat generation", async t => {
  const f = await fixture(t);
  await writeFile(f.input, JSON.stringify({ ...snapshot, titleRows: [["Episode key", "Broadcast title"], ["new", 'Title ]; "quoted" ending']] }));
  execFileSync(process.execPath, [f.script, "--snapshot", f.input]);
  const first = await readFile(f.target, "utf8");
  execFileSync(process.execPath, [f.script, "--snapshot", f.input]);
  assert.equal(await readFile(f.target, "utf8"), first);
});
