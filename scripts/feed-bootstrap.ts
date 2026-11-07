/** Run locally with a remote service binding to warm the private coordinator. */
type BootstrapEnv = { FEED_COORDINATOR: Fetcher };
export default {
  async fetch(request: Request, env: BootstrapEnv): Promise<Response> {
    const url = new URL(request.url);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return new Response("Local operator only", { status: 403 });
    const origin = request.headers.get("Origin");
    if ((origin && origin !== url.origin) || request.headers.get("X-Dub-Operator") !== "bootstrap") return new Response("Operator request required", { status: 403 });
    if (url.pathname !== "/bootstrap" || request.method !== "POST") return new Response("POST /bootstrap", { status: 405 });
    try {
      for (const lane of ["metadata", "youtube", "playback"]) {
        const response = await env.FEED_COORDINATOR.fetch(new Request(`https://feeds/refresh/${lane}`, { method: "POST" }));
        const result = await response.json() as { accepted?: boolean };
        if (!response.ok || !result.accepted) throw new Error("Feed warming failed");
      }
      const [xResponse, youtubeResponse] = await Promise.all(["x", "youtube"].map(feed => env.FEED_COORDINATOR.fetch(`https://feeds/${feed}`)));
      const x = await xResponse.json() as { version: string; broadcasts: { id: string; hlsUrl: string | null }[]; health: { metadata: { state: string } } };
      const youtube = await youtubeResponse.json() as { version: string; videos: { videoId: string }[]; health: { state: string; lastSuccessAt: number | null } };
      if (!xResponse.ok || !youtubeResponse.ok || x.health.metadata.state !== "healthy" || youtube.health.state !== "healthy"
        || !youtube.health.lastSuccessAt || !youtube.videos.length) throw new Error("Feed readback failed");
      for (const id of ["2onbAgvyKWBPYg", "1oKMvNPnEzDGQ"]) {
        const matches = x.broadcasts.filter(item => item.id === id);
        if (matches.length !== 1 || !matches[0].hlsUrl) throw new Error("Required replay unavailable");
      }
      return Response.json({ ready: true, x: { count: x.broadcasts.length, version: x.version }, youtube: { count: youtube.videos.length, newest: youtube.videos[0].videoId, version: youtube.version } }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return Response.json({ ready: false, error: "Bootstrap or verified feed readback failed" }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }
  },
} satisfies ExportedHandler<BootstrapEnv>;
