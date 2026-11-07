import { approvedReplayUrl } from "../../feeds/replay-url.mjs";
import type { XBroadcastReplay } from "./x-broadcasts";

/** Validate one complete runtime snapshot before replacing a displayed archive. */
export function runtimeBroadcasts(payload: unknown): XBroadcastReplay[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { broadcasts?: unknown }).broadcasts)) {
    throw new Error("Invalid broadcast snapshot");
  }
  const seen = new Set<string>();
  const entries = (payload as { broadcasts: unknown[] }).broadcasts.map(value => {
    if (!value || typeof value !== "object") throw new Error("Invalid broadcast");
    const item = value as XBroadcastReplay;
    if (typeof item.id !== "string" || !item.id || seen.has(item.id)
      || typeof item.title !== "string" || !item.title.trim()
      || typeof item.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)
      || typeof item.poster !== "string" || !item.poster.startsWith("/broadcasts/")) {
      throw new Error("Invalid broadcast metadata");
    }
    seen.add(item.id);
    if (item.sourceUrl !== null) {
      const source = new URL(item.sourceUrl);
      if (source.origin !== "https://x.com" || source.username || source.password || source.search || source.hash
        || !/^\/i\/(broadcasts|spaces)\/[A-Za-z0-9]+$/.test(source.pathname)
        || source.pathname.split("/").at(-1) !== item.id) throw new Error("Invalid broadcast identity");
    }
    if (item.hlsUrl !== null) {
      if (typeof item.hlsUrl !== "string" || !item.hlsUrl.startsWith("/api/x-media?url=") || !item.sourceUrl) throw new Error("Invalid playback URL");
      const proxy = new URL(item.hlsUrl, "https://files.invalid");
      const upstream = new URL(proxy.searchParams.get("url") ?? "");
      if (proxy.origin !== "https://files.invalid" || proxy.pathname !== "/api/x-media" || !approvedReplayUrl(upstream.href)) throw new Error("Invalid playback origin");
    }
    return { id: item.id, title: item.title, date: item.date, sourceUrl: item.sourceUrl, poster: item.poster, hlsUrl: item.hlsUrl };
  });
  return entries.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}
