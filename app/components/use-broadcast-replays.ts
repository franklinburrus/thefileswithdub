"use client";

import { runtimeBroadcasts } from "../lib/playable-broadcasts";
import type { XBroadcastReplay } from "../lib/x-broadcasts";
import { useFeedItems } from "./use-feed";
const initialBroadcasts: XBroadcastReplay[] = [];

export function useBroadcastReplays() {
  const { items, status, health } = useFeedItems("/api/x-broadcasts", runtimeBroadcasts, initialBroadcasts);
  return { broadcasts: items, archiveStatus: status, health };
}
