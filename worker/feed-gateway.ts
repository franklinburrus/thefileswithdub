/** Public read boundary for the private feed coordinator. */
type Coordinator = Pick<Fetcher, "fetch">;
type BackgroundContext = Pick<ExecutionContext, "waitUntil">;
const feedPaths: Record<string, string> = {
  "/api/x-broadcasts": "/x",
  "/api/videos": "/youtube",
  "/api/feed-health": "/health",
};

function unavailable(): Response {
  return Response.json({ error: "Feed service unavailable" }, {
    status: 503,
    headers: { "Cache-Control": "no-store", "X-Data-Status": "degraded" },
  });
}

export async function runtimeFeedResponse(
  request: Request,
  coordinator: Coordinator,
  ctx: BackgroundContext,
  cache?: Cache,
): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET", "Cache-Control": "no-store" } });
  }
  const url = new URL(request.url);
  const privatePath = feedPaths[url.pathname];
  if (!privatePath) return new Response("Not Found", { status: 404 });
  try {
    // The visitor cannot select a private method, path, headers, or query.
    const upstream = await coordinator.fetch(new Request(`https://feeds${privatePath}`, { signal: AbortSignal.timeout(15_000) }));
    if (!upstream.ok) return unavailable();
    const payload = await upstream.json() as Record<string, unknown>;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return unavailable();
    const headers = new Headers({ "Cache-Control": "no-store" });
    if (privatePath === "/health") return Response.json(payload, { headers });
    const version = payload.version;
    const field = privatePath === "/x" ? "broadcasts" : "videos";
    if ((typeof version !== "string" && typeof version !== "number") || !Array.isArray(payload[field])) return unavailable();
    headers.set("X-Catalog-Version", String(version));
    const health = payload.health as { state?: string } | undefined;
    headers.set("X-Data-Status", health?.state ?? "unavailable");
    const key = new Request(`${url.origin}${url.pathname}?catalog=${encodeURIComponent(String(version))}`);
    const cached = await cache?.match(key);
    if (cached) {
      const content = await cached.json() as Record<string, unknown>;
      if (Array.isArray(content[field])) payload[field] = content[field];
    } else if (cache) {
      const content = Response.json({ [field]: payload[field] }, { headers: { "Cache-Control": "public, max-age=300" } });
      ctx.waitUntil(cache.put(key, content).catch(() => console.error("[feeds] content cache write failed")));
    }
    // Health and source are always from this owner read, including cache hits.
    headers.set("X-Feed-Cache", cached ? "HIT" : "MISS");
    return Response.json(payload, { headers });
  } catch {
    console.error("[feeds] coordinator read failed");
    return unavailable();
  }
}
