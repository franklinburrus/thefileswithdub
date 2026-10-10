import type { XBroadcast, XBroadcastReplay } from "./x-broadcasts";

export function playableBroadcasts(catalog: XBroadcast[], payload: unknown): XBroadcastReplay[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { broadcasts?: unknown }).broadcasts)) {
    throw new Error("Invalid replay response");
  }

  const replayUrls = new Map<string, string>();
  for (const entry of (payload as { broadcasts: unknown[] }).broadcasts) {
    if (!entry || typeof entry !== "object") continue;
    const { id, hlsUrl } = entry as { id?: unknown; hlsUrl?: unknown };
    if (typeof id === "string" && typeof hlsUrl === "string" && hlsUrl.trim()) {
      replayUrls.set(id, hlsUrl);
    }
  }

  // This release's synced catalog owns identity, metadata, and ordering.
  // The API supplies only replay availability for verified source entries.
  return catalog.flatMap(broadcast => {
    const hlsUrl = broadcast.sourceUrl ? replayUrls.get(broadcast.id) : undefined;
    return hlsUrl ? [{ ...broadcast, hlsUrl }] : [];
  });
}
