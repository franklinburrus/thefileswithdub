import { fetchWithTimeout, readTextWithLimit } from "../../lib/http";

const MAX_REPLAY_URL_LENGTH = 2_048;
const MAX_RANGE_HEADER_LENGTH = 128;
const MAX_MANIFEST_BYTES = 8 * 1024 * 1024;
const APPROVED_REPLAY_SUFFIX = ".video.pscp.tv";
const APPROVED_REPLAY_HOST = /^[a-z0-9-]+\.video\.pscp\.tv$/;

function approvedReplayUrl(value: string | null): URL | null {
  if (!value || value.length > MAX_REPLAY_URL_LENGTH) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return null;
    if (!hostname.endsWith(APPROVED_REPLAY_SUFFIX) || !APPROVED_REPLAY_HOST.test(hostname)) return null;
    if (url.username || url.password || url.port || url.hash) return null;
    if (!url.pathname.startsWith("/Transcoding/v1/hls/")) return null;
    return url;
  } catch {
    return null;
  }
}

function proxyUrl(url: URL) {
  return `/api/x-media?url=${encodeURIComponent(url.toString())}`;
}

function approvedManifestUrl(value: string, upstream: URL): URL | null {
  const candidate = value.trim();
  if (!candidate || candidate.length > MAX_REPLAY_URL_LENGTH) return null;
  try {
    return approvedReplayUrl(new URL(candidate, upstream).toString());
  } catch {
    return null;
  }
}

function rewriteManifest(manifest: string, upstream: URL) {
  return manifest.split(/\r?\n/).map(line => {
    if (!line || line.startsWith("#")) {
      if (!line.startsWith("#")) return line;
      return line.replace(/URI="([^"]+)"/g, (match, value: string) => {
        const target = approvedManifestUrl(value, upstream);
        return target ? `URI="${proxyUrl(target)}"` : match;
      });
    }
    const target = approvedManifestUrl(line, upstream);
    return target ? proxyUrl(target) : line;
  }).join("\n");
}

function replayError(message: string, status: number) {
  return new Response(message, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const source = approvedReplayUrl(new URL(request.url).searchParams.get("url"));
  if (!source) return replayError("Invalid replay source", 400);

  const requestedRange = request.headers.get("range");
  const range = requestedRange && requestedRange.length <= MAX_RANGE_HEADER_LENGTH && /^bytes=(?:\d+-\d*|-\d+)$/i.test(requestedRange)
    ? requestedRange
    : null;
  let response: Response;
  try {
    response = await fetchWithTimeout(source, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TheFilesWithDub/1.0)",
        ...(range ? { Range: range } : {}),
      },
    }, 15_000);
  } catch {
    return replayError("Replay source unavailable", 502);
  }
  if (!response.ok || !response.body) {
    return replayError("Replay source unavailable", response.status || 502);
  }

  // The allowlist was validated on the *initial* URL; fetch() follows
  // redirects by default. Re-validate the final URL before proxying, so an
  // upstream redirect can never leave the approved origin set.
  const finalUrl = approvedReplayUrl(response.url);
  if (!finalUrl) return replayError("Replay redirect outside approved source", 400);

  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": response.headers.get("cache-control") ?? "public, max-age=60",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Expose-Headers": "Accept-Ranges, Content-Length, Content-Range",
    "X-Content-Type-Options": "nosniff",
  });
  const contentRange = response.headers.get("content-range");
  if (contentRange) headers.set("Content-Range", contentRange);
  if (response.headers.get("accept-ranges")) headers.set("Accept-Ranges", "bytes");

  if (contentType.toLowerCase().includes("mpegurl") || finalUrl.pathname.endsWith(".m3u8")) {
    try {
      return new Response(rewriteManifest(await readTextWithLimit(response, MAX_MANIFEST_BYTES), finalUrl), { status: response.status, headers });
    } catch {
      return replayError("Replay manifest unavailable", 502);
    }
  }
  return new Response(response.body, { status: response.status, headers });
}
