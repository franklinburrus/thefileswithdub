/** @typedef {{id: string, title: string, poster: string, date: string, sourceUrl: string | null}} XCatalogItem */
const PLACEHOLDER_POSTER = "/broadcasts/replay-card.svg";
const MAX_CSV_BYTES = 4 * 1024 * 1024;
const MAX_ROWS = 100000;
// Frank retired these three confirmed 404 replays on 2026-11-07.
// Keep their worksheet records intact while excluding them from site catalogs.
const RETIRED_IDS = new Set(["1DxLddryWQPxm", "1jGXggZlkdVKZ", "1YxNrrOVnryxw"]);

/** Parse bounded RFC 4180 CSV, retaining quoted newlines and escaped quotes.
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCsv(text) {
  if (typeof text !== "string" || new TextEncoder().encode(text).length > MAX_CSV_BYTES) throw new Error("CSV exceeds 4 MB limit or is not text");
  const input = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  let closed = false;
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') { cell += '"'; index++; }
      else if (char === '"') { quoted = false; closed = true; }
      else cell += char;
      continue;
    }
    if (char === "," || char === "\n" || char === "\r") {
      row.push(cell);
      cell = "";
      closed = false;
      if (char !== ",") {
        rows.push(row);
        if (rows.length > MAX_ROWS) throw new Error("CSV row limit exceeded");
        row = [];
        if (char === "\r" && input[index + 1] === "\n") index++;
      }
    } else if (char === '"' && !cell && !closed) quoted = true;
    else {
      if (closed || char === '"') throw new Error("Invalid CSV quote boundary");
      cell += char;
    }
  }
  if (quoted) throw new Error("Unterminated CSV quoted field");
  if (cell || closed || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

/** Canonicalize only verified HTTPS X broadcast/Space source routes.
 * @param {string} url
 * @returns {{id: string, sourceUrl: string} | null}
 */
export function parseXSource(url) {
  if (typeof url !== "string" || /[\s\u0000-\u001f\u007f]/.test(url) || !/^https:\/\/(x\.com|twitter\.com)\/i\/(broadcasts|spaces)\/[A-Za-z0-9]{13,14}\/?(?:[?#]|$)/i.test(url)) return null;
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/i\/(broadcasts|spaces)\/([A-Za-z0-9]{13,14})\/?$/);
    if (!match || parsed.username || parsed.password || parsed.port) return null;
    return { id: match[2], sourceUrl: `https://x.com/i/${match[1]}/${match[2]}` };
  } catch { return null; }
}

/** @param {unknown} value */
function text(value) { return String(value ?? "").trim(); }

/** @param {string[][]} rows @param {string[]} required @param {string} name */
function headers(rows, required, name) {
  if (!Array.isArray(rows) || rows.length > MAX_ROWS || !Array.isArray(rows[0]) || rows.some(row => !Array.isArray(row))) throw new Error(`${name} invalid rows/header`);
  const names = rows[0].map(value => text(value).replace(/^\uFEFF/, "").toLowerCase());
  const indices = {};
  for (const name of [...required, "Broadcast date"]) {
    const matches = names.flatMap((value, index) => value === name.toLowerCase() ? [index] : []);
    if (matches.length > 1) throw new Error(`Duplicate header ${name} must be unique`);
    if (required.includes(name) && matches.length !== 1) throw new Error(`Missing required header ${name}`);
    indices[name] = matches[0] ?? -1;
  }
  return indices;
}

/** @param {string} value @returns {string} */
function normalizeDate(value) {
  if (!value) return "";
  let match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)?$/);
  if (!match) {
    const us = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (us) match = [value, us[3], us[1].padStart(2, "0"), us[2].padStart(2, "0")];
  }
  if (!match) throw new Error(`Invalid broadcast date ${value}`);
  const iso = `${match[1]}-${match[2]}-${match[3]}`;
  const date = new Date(`${iso}T00:00:00Z`);
  if (!Number.isFinite(date.valueOf()) || date.toISOString().slice(0, 10) !== iso) throw new Error(`Invalid broadcast date ${value}`);
  return iso;
}

/** Validate the complete candidate before any caller publishes it.
 * Dates from verified title rows override clip dates. Legacy metadata supplies
 * fallback values only for identities already accepted in the baseline.
 * @param {string[][]} masterRows
 * @param {string[][]} titleRows
 * @param {XCatalogItem[]} baseline
 * @returns {{items: XCatalogItem[], diff: {added: string[], changed: string[], removed: string[]}, provenance: Record<string, {masterRows: number[], titleRows: number[], aliases: string[], retained?: boolean}>}}
 */
export function buildXCatalog(masterRows, titleRows, baseline = []) {
  const master = headers(masterRows, ["Broadcast date", "Content type", "Source broadcast URL", "Episode key"], "Master Library");
  const titles = headers(titleRows, ["Episode key", "Broadcast title"], "Broadcast Titles");
  const accepted = new Map();
  for (const item of baseline) {
    if (!item.id || !item.title || accepted.has(item.id)) throw new Error("Invalid or duplicate baseline identity/title");
    if (item.sourceUrl !== null && parseXSource(item.sourceUrl)?.id !== item.id) throw new Error(`Invalid baseline source ${item.id}`);
    accepted.set(item.id, item);
  }
  const groups = new Map();
  const aliases = new Map();
  // Resolve blank-source clip rows only through canonical evidence elsewhere
  // in this same snapshot, never by guessing an identity from an episode key.
  const canonicalByAlias = new Map();
  for (const row of masterRows.slice(1)) {
    if (!["X Video Broadcast", "X Audio Space"].includes(text(row[master["Content type"]]))) continue;
    const source = parseXSource(text(row[master["Source broadcast URL"]]));
    if (!source) continue;
    for (const alias of [source.id, text(row[master["Episode key"]])].filter(Boolean)) {
      if (canonicalByAlias.has(alias) && canonicalByAlias.get(alias).id !== source.id) throw new Error(`Ambiguous episode key ${alias}`);
      canonicalByAlias.set(alias, source);
    }
  }
  let eligible = 0;
  for (let index = 1; index < masterRows.length; index++) {
    const row = masterRows[index];
    const type = text(row[master["Content type"]]);
    if (!["X Video Broadcast", "X Audio Space"].includes(type)) continue;
    const key = text(row[master["Episode key"]]);
    const sourceUrl = text(row[master["Source broadcast URL"]]);
    if (!key && !sourceUrl) continue;
    eligible++;
    const source = parseXSource(sourceUrl) ?? (!sourceUrl ? canonicalByAlias.get(key) : null);
    const archive = accepted.get(key);
    if (!source && archive?.sourceUrl !== null) throw new Error(`Invalid or unresolved source at Master Library row ${index + 1}`);
    if (!source && !archive) throw new Error(`Unverified new source at Master Library row ${index + 1}`);
    const id = source?.id ?? key;
    if (source && ((type === "X Audio Space") !== source.sourceUrl.includes("/spaces/"))) throw new Error(`Content type/source mismatch at row ${index + 1}`);
    if (!groups.has(id)) groups.set(id, { id, sourceUrl: source?.sourceUrl ?? null, masterRows: [], aliases: new Set([id]), dates: new Set() });
    const group = groups.get(id);
    if (group.sourceUrl !== (source?.sourceUrl ?? null)) throw new Error(`Conflicting source routes for ${id}`);
    group.masterRows.push(index + 1);
    if (key) {
      if (aliases.has(key) && aliases.get(key) !== id) throw new Error(`Ambiguous episode key ${key}`);
      aliases.set(key, id);
      group.aliases.add(key);
    }
    const date = normalizeDate(text(row[master["Broadcast date"]]));
    if (date) group.dates.add(date);
  }
  if (!eligible || !groups.size) throw new Error("Empty eligible X catalog");
  const titleRowsByKey = new Map();
  for (let index = 1; index < titleRows.length; index++) {
    const key = text(titleRows[index][titles["Episode key"]]);
    if (!titleRowsByKey.has(key)) titleRowsByKey.set(key, []);
    titleRowsByKey.get(key).push({ row: titleRows[index], rowNumber: index + 1 });
  }
  const provenance = Object.create(null);
  const items = [];
  for (const group of groups.values()) {
    if (RETIRED_IDS.has(group.id)) continue;
    const verifiedTitles = new Set();
    const verifiedDates = new Set();
    const titleRefs = [];
    const matchingTitles = [...group.aliases].flatMap(alias => titleRowsByKey.get(alias) ?? []);
    matchingTitles.sort((a, b) => a.rowNumber - b.rowNumber);
    for (const { row, rowNumber } of matchingTitles) {
      const title = text(row[titles["Broadcast title"]]);
      if (!title) continue;
      verifiedTitles.add(title);
      titleRefs.push(rowNumber);
      const date = normalizeDate(text(row[titles["Broadcast date"]]));
      if (date) verifiedDates.add(date);
    }
    if (verifiedTitles.size > 1) throw new Error(`Conflicting verified titles for ${group.id}`);
    if (verifiedDates.size > 1) throw new Error(`Conflicting verified dates for ${group.id}`);
    const previous = accepted.get(group.id);
    const title = [...verifiedTitles][0] ?? previous?.title;
    if (!title) throw new Error(`Missing verified title for ${group.id}`);
    let date = [...verifiedDates][0] ?? previous?.date;
    if (!date && group.dates.size > 1) throw new Error(`Conflicting broadcast dates for ${group.id}`);
    date ||= [...group.dates][0] ?? "";
    if (!date) throw new Error(`Missing broadcast date for ${group.id}`);
    items.push({ id: group.id, title, poster: previous?.poster ?? PLACEHOLDER_POSTER, date, sourceUrl: group.sourceUrl });
    provenance[group.id] = { masterRows: group.masterRows, titleRows: titleRefs, aliases: [...group.aliases] };
  }
  const present = new Set(items.map(item => item.id));
  for (const item of baseline) {
    if (present.has(item.id) || RETIRED_IDS.has(item.id)) continue;
    if (item.sourceUrl !== null) throw new Error(`Baseline identity missing from source (catalog shrink): ${item.id}`);
    items.push({ ...item });
    provenance[item.id] = { masterRows: [], titleRows: [], aliases: [item.id], retained: true };
  }
  if (!items.length) throw new Error("Empty eligible X catalog");
  items.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const fields = ["id", "title", "poster", "date", "sourceUrl"];
  return {
    items,
    diff: {
      added: items.filter(item => !accepted.has(item.id)).map(item => item.id),
      changed: items.filter(item => accepted.has(item.id) && fields.some(field => item[field] !== accepted.get(item.id)[field])).map(item => item.id),
      removed: baseline.filter(item => RETIRED_IDS.has(item.id)).map(item => item.id),
    },
    provenance,
  };
}
