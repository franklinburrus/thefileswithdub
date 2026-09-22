/**
 * Durable HLS catalog for /api/x-broadcasts, backed by Workers KV.
 *
 * Resolving every broadcast's replay HLS URL means fetching ~50 x.com pages
 * per request (~9s cold). The catalog metadata is static; only the HLS URLs
 * need resolving, and replay URLs are long-lived. So the resolved
 * id -> HLS-URL map lives in KV as a single JSON blob:
 *
 *   key:   "x-broadcasts:hls-v1"
 *   value: { resolvedAt: <epoch ms>, urls: { [broadcastId]: <https url | null> } }
 *
 * Read path (worker/index.ts): serve the merged catalog straight from KV.
 * Write paths: a scheduled refresh every 10 minutes, a background re-refresh
 * when served data is stale, and lazy seeding after a live (KV-miss) request.
 * Only these trusted paths write; the key is a fixed constant, so no user
 * input ever reaches KV key construction, and only https: URLs are persisted.
 */
import {
  extractReplayHlsUrl,
  xBroadcasts,
  type XBroadcast,
  type XBroadcastReplay,
} from "./x-broadcasts";
import { fetchWithTimeout, readTextWithLimit } from "./http";

export const BROADCASTS_KV_KEY = "x-broadcasts:hls-v1";
/** Serve KV data past this age, but trigger a background refresh. */
export const CATALOG_STALE_MS = 6 * 60 * 60 * 1000;

const MAX_BROADCAST_PAGE_BYTES = 4 * 1024 * 1024;
// Cloudflare Workers cap subrequests at 50 per invocation; keep concurrent
// upstream fetches under that limit while sizing the fan-out down.
const FETCH_CONCURRENCY = 16;

export type HlsCatalog = {
  resolvedAt: number;
  urls: Record<string, string | null>;
};

export function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validate a KV-stored catalog. Anything malformed — or holding a
 * non-https URL — is rejected wholesale so the caller falls back to live
 * resolution and refreshes the poisoned value.
 */
export function parseCatalog(raw: unknown): HlsCatalog | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const { resolvedAt, urls } = raw as { resolvedAt?: unknown; urls?: unknown };
  if (typeof resolvedAt !== "number" || !Number.isFinite(resolvedAt)) return null;
  if (!urls || typeof urls !== "object" || Array.isArray(urls)) return null;
  const clean: Record<string, string | null> = {};
  for (const [id, url] of Object.entries(urls as Record<string, unknown>)) {
    if (typeof id !== "string" || !id) return null;
    if (url === null) clean[id] = null;
    else if (isHttpsUrl(url)) clean[id] = url;
    else return null;
  }
  return { resolvedAt, urls: clean };
}

export function isCatalogStale(catalog: HlsCatalog, nowMs: number = Date.now()): boolean {
  return nowMs - catalog.resolvedAt > CATALOG_STALE_MS;
}

/** Upstream HLS URL -> same-origin /api/x-media proxy URL (the API's public shape). */
export function toProxyUrl(sourceUrl: string): string {
  return `/api/x-media?url=${encodeURIComponent(sourceUrl)}`;
}

/**
 * Recover the upstream HLS URL from a proxy URL built by toProxyUrl.
 * Returns null unless the embedded source is an https: URL.
 */
export function sourceUrlFromProxyUrl(proxyUrl: string): string | null {
  if (typeof proxyUrl !== "string") return null;
  const query = proxyUrl.split("?", 2)[1] ?? "";
  const source = new URLSearchParams(query).get("url");
  return isHttpsUrl(source) ? source : null;
}

/** Merge the static broadcast list with resolved HLS URLs into the API's JSON shape. */
export function mergeCatalog(catalog: HlsCatalog): { broadcasts: XBroadcastReplay[] } {
  return {
    broadcasts: xBroadcasts.map((broadcast) => {
      const source = catalog.urls[broadcast.id] ?? null;
      return { ...broadcast, hlsUrl: source ? toProxyUrl(source) : null };
    }),
  };
}

async function resolveOne(broadcast: XBroadcast): Promise<[string, string | null]> {
  try {
    const response = await fetchWithTimeout(`https://x.com/i/broadcasts/${broadcast.id}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TheFilesWithDub/1.0)",
      },
    });
    if (!response.ok) return [broadcast.id, null];
    const source = extractReplayHlsUrl(await readTextWithLimit(response, MAX_BROADCAST_PAGE_BYTES));
    return [broadcast.id, isHttpsUrl(source) ? source : null];
  } catch {
    return [broadcast.id, null];
  }
}

/**
 * Resolve every broadcast's replay HLS URL (the expensive fan-out).
 *
 * When `existing` is provided, only broadcasts missing from its URL map are
 * fetched — replay URLs are long-lived, so a refresh that already knows 54
 * of 56 broadcasts does 2 fetches instead of 56. Known entries (including
 * nulls) are carried over untouched; resolvedAt always reflects this run.
 */
export async function resolveCatalog(existing?: HlsCatalog): Promise<HlsCatalog> {
  const known = existing?.urls ?? {};
  const pending = xBroadcasts.filter((broadcast) => !Object.hasOwn(known, broadcast.id));
  const urls: Record<string, string | null> = { ...known };
  for (let i = 0; i < pending.length; i += FETCH_CONCURRENCY) {
    const chunk = await Promise.all(pending.slice(i, i + FETCH_CONCURRENCY).map(resolveOne));
    for (const [id, url] of chunk) urls[id] = url;
  }
  return { resolvedAt: Date.now(), urls };
}

/**
 * Rebuild a catalog from a live /api/x-broadcasts JSON body, so a KV-miss
 * request can seed KV for the next one. Returns null when the body has no
 * usable entries.
 */
export function catalogFromResponseBody(body: unknown): HlsCatalog | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const broadcasts = (body as { broadcasts?: unknown }).broadcasts;
  if (!Array.isArray(broadcasts) || broadcasts.length === 0) return null;
  const urls: Record<string, string | null> = {};
  for (const entry of broadcasts) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const { id, hlsUrl } = entry as { id?: unknown; hlsUrl?: unknown };
    if (typeof id !== "string" || !id) continue;
    urls[id] = typeof hlsUrl === "string" ? sourceUrlFromProxyUrl(hlsUrl) : null;
  }
  if (Object.keys(urls).length === 0) return null;
  return { resolvedAt: Date.now(), urls };
}
