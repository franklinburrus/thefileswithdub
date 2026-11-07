import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildXCatalog, parseCsv, parseXSource } from "../feeds/x-source.mjs";

const masterHeader = ["Broadcast date", "Content type", "Source broadcast URL", "Episode key"];
const titleHeader = ["Episode key", "Broadcast title", "Broadcast date"];
const oldId = "1oKMvNPnEzDGQ";
const newId = "2onbAgvyKWBPYg";
const source = (id) => `https://x.com/i/broadcasts/${id}`;
const oldItem = { id: oldId, title: "Legacy", date: "2026-10-29", poster: "/broadcasts/legacy.jpg", sourceUrl: source(oldId) };
const master = (...rows) => [masterHeader, ...rows];
const titles = (...rows) => [titleHeader, ...rows];

test("CSV preserves quoted commas, quotes, newlines, CRLF and BOM", () => {
  assert.deepEqual(parseCsv('\uFEFFa,b\r\n"line\nnext","a,""quote"""\r\n'), [["a", "b"], ["line\nnext", 'a,"quote"']]);
  assert.throws(() => parseCsv('a,"unterminated'), /CSV/i);
  assert.throws(() => parseCsv('a,"closed"garbage'), /CSV/i);
});

test("X source supports verified 13 and 14 character identities with canonical hosts", () => {
  assert.deepEqual(parseXSource(`https://twitter.com/i/spaces/${newId}?s=20`), { id: newId, sourceUrl: `https://x.com/i/spaces/${newId}` });
  assert.equal(parseXSource(source(oldId)).id, oldId);
  for (const url of [source(oldId).replace("x.com", "x.com.evil.test"), source(oldId).replace("x.com", "evil@x.com"), source(oldId).replace("x.com", "x.com:443"), source(oldId).replace("https:", "http:"), `${source(oldId)}/extra`, source("short"), `https://x.com/user/status/${oldId}`]) assert.equal(parseXSource(url), null, url);
});

test("named reordered columns group aliases and retain row provenance", () => {
  const result = buildXCatalog([
    ["Episode key", "Source broadcast URL", "Content type", "Broadcast date"],
    ["first", source(newId), "X Video Broadcast", "11/06/2026"],
    ["second", source(newId), "X Video Broadcast", "2026-11-06"],
    ["", source(oldId), "X Video Broadcast", "2026-10-29"],
  ], titles(["first", "Verified", "11/05/2026"], ["second", "Verified", "2026-11-05"], [oldId, "Legacy", "2026-10-29"]), [oldItem]);
  assert.deepEqual(result.items.map(item => item.id), [newId, oldId]);
  assert.equal(result.items[0].date, "2026-11-05");
  assert.deepEqual(result.items[1], oldItem);
  assert.deepEqual(result.diff, { added: [newId], changed: [], removed: [] });
  assert.deepEqual(result.provenance[newId].masterRows, [2, 3]);
});

test("draft titles are ignored and conflicting verified aliases reject the candidate", () => {
  const rows = master(["2026-11-05", "X Video Broadcast", source(newId), "alias"]);
  assert.equal(buildXCatalog(rows, [["Episode key", "Broadcast title", "Broadcast date", "Suggested title (draft — Frank to review)"], ["alias", "", "", "Draft fake"], [newId, "Verified"]]).items[0].title, "Verified");
  assert.throws(() => buildXCatalog(rows, titles(["alias", "First"], [newId, "Second"])), /conflicting.*title/i);
  assert.throws(() => buildXCatalog(rows, [["Episode key", "Broadcast title", "Suggested title (draft — Frank to review)"], ["alias", "", "Draft fake"]]), /missing.*title/i);
});

test("empty, invalid, ambiguous headers and disappearing baseline identity reject", () => {
  const rows = master(["2026-11-05", "X Video Broadcast", source(newId), "new"]);
  assert.throws(() => buildXCatalog(master(), titles()), /empty|eligible/i);
  assert.throws(() => buildXCatalog([["Episode key"]], titles()), /header/i);
  assert.throws(() => buildXCatalog([[...masterHeader, "Episode key"], rows[1]], titles()), /duplicate|unique/i);
  assert.throws(() => buildXCatalog(rows, titles(["new", "New"]), [oldItem]), /missing|disappear|shrink/i);
  assert.throws(() => buildXCatalog(master(["2026-02-30", "X Video Broadcast", source(newId), "new"]), titles(["new", "New"])), /date/i);
  assert.throws(() => buildXCatalog(master(["2026-11-05", "X Video Broadcast", "https://evil.test/x", "new"]), titles(["new", "New"])), /source/i);
});

test("baseline archive-only metadata survives absent and legacy status rows", () => {
  const archived = { id: "archive-key", title: "Archive", date: "2026-08-15", poster: "/broadcasts/old.png", sourceUrl: null };
  const rows = master(["2026-10-29", "X Video Broadcast", source(oldId), "legacy"], ["2026-08-15", "X Video Broadcast", "https://x.com/u/status/123", "archive-key"]);
  const result = buildXCatalog(rows, titles(), [oldItem, archived]);
  assert.deepEqual(result.items, [oldItem, archived]);
  assert.deepEqual(result.diff, { added: [], changed: [], removed: [] });
});

test("unidentified derivative rows are skipped and blank-source aliases attach to canonical evidence", () => {
  const rows = master(["2026-11-05", "X Video Broadcast", "", ""], ["2026-11-05", "X Video Broadcast", "", "alias"], ["2026-11-05", "X Video Broadcast", source(newId), "alias"]);
  const result = buildXCatalog(rows, titles(["alias", "Verified"]));
  assert.equal(result.items.length, 1);
  assert.deepEqual(result.provenance[newId].masterRows, [3, 4]);
});

test("normalized traversal and control characters cannot create a canonical source", () => {
  for (const url of [`https://x.com/foo/../i/broadcasts/${newId}`, `https://x.com/i/broadcasts/${newId}\n`, `https://x.com/i/broadcasts/${newId}?x=\n`]) assert.equal(parseXSource(url), null);
});

const retiredIds = ['1DxLddryWQPxm', '1jGXggZlkdVKZ', '1YxNrrOVnryxw'];
const retiredItems = retiredIds.map((id, index) => ({ ...oldItem, id, title: `Retired replay ${index + 1}`, sourceUrl: source(id) }));

test('retires exactly the three approved dead replays while preserving all other metadata and source rows', () => {
  const baseline = [oldItem, ...retiredItems];
  const rows = master(...baseline.map(item => [item.date, 'X Video Broadcast', item.sourceUrl, item.id]));
  const titleRows = titles(...baseline.map(item => [item.id, item.title, item.date]));
  const originalRows = structuredClone({ rows, titleRows });
  const result = buildXCatalog(rows, titleRows, baseline);
  assert.deepEqual(result.items, [oldItem]);
  assert.deepEqual(result.diff, { added: [], changed: [], removed: retiredIds });
  assert.deepEqual({ rows, titleRows }, originalRows);
});

test('retired replays cannot reappear from unchanged source rows on repeat sync', () => {
  const rows = master(...[oldItem, ...retiredItems].map(item => [item.date, 'X Video Broadcast', item.sourceUrl, item.id]));
  const titleRows = titles(...[oldItem, ...retiredItems].map(item => [item.id, item.title, item.date]));
  const first = buildXCatalog(rows, titleRows, [oldItem, ...retiredItems]);
  const repeated = buildXCatalog(rows, titleRows, first.items);
  assert.deepEqual(repeated.items, [oldItem]);
  assert.deepEqual(repeated.diff, { added: [], changed: [], removed: [] });
});

test('approved retirement permits absent dead source rows and still rejects every unrelated baseline loss', () => {
  const survivorRows = master([oldItem.date, 'X Video Broadcast', oldItem.sourceUrl, oldItem.id]);
  const result = buildXCatalog(survivorRows, titles(), [oldItem, ...retiredItems]);
  assert.deepEqual(result.items, [oldItem]);
  assert.deepEqual(result.diff.removed, retiredIds);
  const unrelated = { ...oldItem, id: newId, sourceUrl: source(newId) };
  assert.throws(() => buildXCatalog(survivorRows, titles(), [oldItem, ...retiredItems, unrelated]), /catalog shrink/);
  assert.throws(() => buildXCatalog(master(...retiredItems.map(item => [item.date, 'X Video Broadcast', item.sourceUrl, item.id])), titles(), retiredItems), /empty|eligible/i);
});

test('bundled catalog excludes retired replays and includes the verified latest source identities once', async () => {
  const source = await readFile(new URL('../app/lib/x-broadcasts.ts', import.meta.url), 'utf8');
  const generated = source.match(/export const xBroadcasts:[\s\S]*?\n\];/)[0];
  const ids = [...generated.matchAll(/\bid: "([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const id of retiredIds) assert.equal(ids.includes(id), false, id);
  for (const id of [oldId, newId, '2zkAnlRLKZvymP']) assert.equal(ids.filter(candidate => candidate === id).length, 1, id);
});
