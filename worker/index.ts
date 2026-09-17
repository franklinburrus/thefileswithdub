/** Cloudflare Worker entry point for the vinext application. */
import handler from "vinext/server/app-router-entry";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' https://i.ytimg.com https://*.ytimg.com data: blob:",
  "media-src 'self' blob:",
  "connect-src 'self' https://cloudflareinsights.com",
  "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://embed.music.apple.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = {
  "Content-Security-Policy": contentSecurityPolicy,
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
};

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

type EdgeCache = { default?: Cache };

function edgeCache(): Cache | undefined {
  return (globalThis as unknown as { caches?: EdgeCache }).caches?.default;
}

function tagResponse(response: Response, name: string, value: string): Response {
  const headers = new Headers(response.headers);
  headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Clean, explicit cache key: method + URL only. Never reuse the incoming
// Request object — its headers/cookies/cf properties must not poison the
// key or interact with Vary on stored responses.
function cacheKey(request: Request): Request {
  return new Request(request.url, { method: "GET" });
}

// Normalize a response into a safely storable copy for cache.put().
// Cloudflare's Cache API honors response headers on put(): it throws on
// `Vary: *` and fails (413) when Cache-Control forbids caching, so both are
// normalized here. Set-Cookie is never cached. Only a clone's body branch
// is consumed; the caller's response stays untouched.
function toStorableClone(response: Response, cacheControl: string): Response {
  const headers = new Headers(response.headers);
  headers.delete("set-cookie");
  headers.delete("vary");
  headers.set("Cache-Control", cacheControl);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Fire-and-forget cache write with visible errors. A failed put used to be
// swallowed silently, which made every request a cold miss with no trace —
// now failures land in Cloudflare Logs via console.error.
function storeInBackground(
  ctx: ExecutionContext,
  cache: Cache,
  key: Request,
  response: Response,
  cacheControl: string,
  label: string,
): void {
  const storable = toStorableClone(response.clone(), cacheControl);
  ctx.waitUntil(
    cache.put(key, storable).then(
      () => console.log(`[edge-cache] stored ${label}`),
      (error: unknown) => console.error(`[edge-cache] put failed for ${label}:`, error),
    ),
  );
}

async function withVideoCache(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  // /api/videos fetches the YouTube RSS feed (up to 3 retries) per request.
  // Serve the edge-cached feed while fresh, regenerating only on a miss.
  // Local dev has no Cache API — pass through.
  const cache = edgeCache();
  if (!cache || request.method !== "GET") return handler.fetch(request, env, ctx);

  const key = cacheKey(request);
  const cached = await cache.match(key);
  if (cached) return tagResponse(cached, "X-Videos-Cache", "HIT");

  const response = await handler.fetch(request, env, ctx);
  if (response.ok) {
    const body = await response.clone().json().catch(() => null) as { videos?: unknown[] } | null;
    if (body?.videos?.length) {
      storeInBackground(ctx, cache, key, response, "public, max-age=300, s-maxage=300", "videos");
      return tagResponse(response, "X-Videos-Cache", "MISS");
    }
  }
  return tagResponse(response, "X-Videos-Cache", "MISS");
}

async function withNightlifeCache(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  // /api/nightlife fans out to ~13 Eventbrite fetches per request.
  // Serve the edge-cached listing while fresh, regenerating only on a miss.
  // Local dev has no Cache API — pass through.
  const cache = edgeCache();
  if (!cache || request.method !== "GET") return handler.fetch(request, env, ctx);

  const key = cacheKey(request);
  const cached = await cache.match(key);
  if (cached) return tagResponse(cached, "X-Nightlife-Cache", "HIT");

  const response = await handler.fetch(request, env, ctx);
  if (response.ok) {
    storeInBackground(ctx, cache, key, response, "public, max-age=900, s-maxage=900", "nightlife");
  }
  return tagResponse(response, "X-Nightlife-Cache", "MISS");
}

async function withXMediaCache(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  // /api/x-media proxies HLS manifests/segments from *.video.pscp.tv.
  // Segments are immutable (unique URLs) — cache them long at the edge.
  // Range requests pass through uncached: the cache key doesn't include
  // Range, so a cached 206 must never be served for a full request.
  // Local dev has no Cache API — pass through.
  const cache = edgeCache();
  if (!cache || request.method !== "GET" || request.headers.has("range")) {
    return handler.fetch(request, env, ctx);
  }

  const key = cacheKey(request);
  const cached = await cache.match(key);
  if (cached) return tagResponse(cached, "X-XMedia-Cache", "HIT");

  const response = await handler.fetch(request, env, ctx);
  if (response.ok) {
    const contentType = (response.headers.get("Content-Type") ?? "").toLowerCase();
    const cacheControl = response.headers.get("Cache-Control") ?? "";
    // Respect upstream privacy directives: never cache what the origin marks
    // no-store or private — skip the write instead of overriding it.
    // Segments are immutable (unique URLs) — cache long. Manifests get a
    // short TTL so concurrent viewers share them.
    if (/no-store/i.test(cacheControl) || /private/i.test(cacheControl)) {
      return tagResponse(response, "X-XMedia-Cache", "MISS");
    }
    const storableControl = contentType.includes("mpegurl")
      ? "public, max-age=60, s-maxage=60"
      : "public, max-age=86400, s-maxage=86400, immutable";
    storeInBackground(ctx, cache, key, response, storableControl, "x-media");
  }
  return tagResponse(response, "X-XMedia-Cache", "MISS");
}

async function withBroadcastsCache(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  // /api/x-broadcasts fans out to ~56 x.com page fetches per request (~5s).
  // Serve the edge-cached catalog while fresh, regenerating only on a miss.
  // Local dev has no Cache API — pass through.
  const cache = edgeCache();
  if (!cache || request.method !== "GET") return handler.fetch(request, env, ctx);

  const key = cacheKey(request);
  const cached = await cache.match(key);
  if (cached) return tagResponse(cached, "X-Broadcasts-Cache", "HIT");

  const response = await handler.fetch(request, env, ctx);
  if (response.ok) {
    storeInBackground(ctx, cache, key, response, "public, max-age=300, s-maxage=900", "x-broadcasts");
  }
  return tagResponse(response, "X-Broadcasts-Cache", "MISS");
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const requestUrl = new URL(request.url);
    // Cloudflare's zone setting is an external control-plane dependency. Keep
    // the application boundary safe as well, while preserving localhost HTTP
    // for the local Worker test harness.
    if (requestUrl.protocol === "http:" && !["localhost", "127.0.0.1"].includes(requestUrl.hostname)) {
      requestUrl.protocol = "https:";
      return withSecurityHeaders(new Response(null, {
        status: 301,
        headers: {
          Location: requestUrl.toString(),
          "Cache-Control": "public, max-age=31536000",
        },
      }));
    }
    if (requestUrl.pathname === "/game" || requestUrl.pathname.startsWith("/game/")) {
      return withSecurityHeaders(new Response("Not Found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=0, must-revalidate",
        },
      }));
    }
    let response: Response;
    const pathname = requestUrl.pathname;
    if (pathname === "/api/videos") {
      response = await withVideoCache(request, env, ctx);
    } else if (pathname === "/api/x-broadcasts") {
      response = await withBroadcastsCache(request, env, ctx);
    } else if (pathname === "/api/nightlife") {
      response = await withNightlifeCache(request, env, ctx);
    } else if (pathname === "/api/x-media") {
      response = await withXMediaCache(request, env, ctx);
    } else {
      response = await handler.fetch(request, env, ctx);
    }
    return withSecurityHeaders(response);
  },
};

export default worker;
