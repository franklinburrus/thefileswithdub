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

async function withVideoCache(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  const response = await handler.fetch(request, env, ctx);
  if (!cache || request.method !== "GET") return response;

  if (response.ok) {
    const body = await response.clone().json().catch(() => null) as { videos?: unknown[] } | null;
    if (body?.videos?.length) {
      ctx.waitUntil(cache.put(request, response.clone()));
      return response;
    }
  }

  const cached = await cache.match(request);
  if (!cached) return response;
  const headers = new Headers(cached.headers);
  headers.set("X-Data-Status", "stale");
  headers.set("Cache-Control", "no-store");
  return new Response(cached.body, { status: cached.status, statusText: cached.statusText, headers });
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
    const response = requestUrl.pathname === "/api/videos"
      ? await withVideoCache(request, env, ctx)
      : await handler.fetch(request, env, ctx);
    return withSecurityHeaders(response);
  },
};

export default worker;
