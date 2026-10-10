"use client";

import { useEffect, useState } from "react";
import { playableBroadcasts } from "../lib/playable-broadcasts";
import { xBroadcasts, type XBroadcastReplay } from "../lib/x-broadcasts";

export function useBroadcastReplays() {
  const [broadcasts, setBroadcasts] = useState<XBroadcastReplay[]>([]);
  const [archiveStatus, setArchiveStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/x-broadcasts", { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("Replays could not be loaded");
        return response.json() as Promise<unknown>;
      })
      .then(payload => {
        const replays = playableBroadcasts(xBroadcasts, payload);
        if (controller.signal.aborted) return;
        setBroadcasts(replays);
        setArchiveStatus("ready");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setBroadcasts([]);
        setArchiveStatus("unavailable");
      });

    return () => controller.abort();
  }, []);

  return { broadcasts, archiveStatus };
}
