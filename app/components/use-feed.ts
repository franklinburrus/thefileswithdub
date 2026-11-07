"use client";

import { useEffect, useRef, useState } from "react";

export type FeedHealth = { state?: string; feedAgeMs?: number | null; lastSuccessAt?: number | null };
export type FeedStatus = "loading" | "ready" | "degraded" | "unavailable";

/** Refresh visible clients while retaining their last accepted collection on error. */
export function useFeedItems<T>(url: string, parse: (payload: unknown) => T[], initialItems: T[]) {
  const [items, setItems] = useState(initialItems);
  const [status, setStatus] = useState<FeedStatus>("loading");
  const [health, setHealth] = useState<FeedHealth | null>(null);
  const accepted = useRef(false);
  useEffect(() => {
    let disposed = false;
    let running = false;
    let controller: AbortController | null = null;
    let next: ReturnType<typeof setTimeout> | undefined;
    const refresh = async () => {
      if (disposed || running) return;
      clearTimeout(next);
      if (document.hidden) {
        next = setTimeout(refresh, 60_000);
        return;
      }
      running = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 15_000);
      try {
        const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Feed unavailable");
        const payload = await response.json();
        const collection = parse(payload);
        if (!collection.length) throw new Error("Feed empty");
        if (disposed) return;
        accepted.current = true;
        setItems(collection);
        const currentHealth = payload && typeof payload === "object" ? (payload as { health?: FeedHealth }).health : undefined;
        setHealth(currentHealth ?? null);
        setStatus(currentHealth && currentHealth.state !== "healthy" ? "degraded" : "ready");
      } catch {
        if (!disposed) setStatus(accepted.current ? "degraded" : "unavailable");
      } finally {
        clearTimeout(timeout);
        running = false;
        if (!disposed) next = setTimeout(refresh, 60_000);
      }
    };
    const visible = () => { if (!document.hidden) void refresh(); };
    void refresh();
    document.addEventListener("visibilitychange", visible);
    return () => {
      disposed = true;
      controller?.abort();
      clearTimeout(next);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [url, parse]);
  return { items, status, health };
}
