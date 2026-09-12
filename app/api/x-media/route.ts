function approvedReplayUrl(value: string | null): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (!url.hostname.endsWith(".video.pscp.tv")) return null;
    if (!url.pathname.startsWith("/Transcoding/v1/hls/")) return null;
    return url;
  } catch {
    return null;
  }
}

function proxyUrl(url: URL) {
  return `/api/x-media?url=${encodeURIComponent(url.toString())}`;
}

function rewriteManifest(manifest: string, upstream: URL) {
  return manifest.split(/\r?\n/).map(line => {
    if (!line) return line;
    if (!line.startsWith("#")) return proxyUrl(new URL(line.trim(), upstream));
    return line.replace(/URI="([^"]+)"/g, (_match, value: string) => `URI="${proxyUrl(new URL(value, upstream))}"`);
  }).join("\n");
}

export async function GET(request: Request) {
  const source = approvedReplayUrl(new URL(request.url).searchParams.get("url"));
  if (!source) return new Response("Invalid replay source", { status: 400 });

  const range = request.headers.get("range");
  const response = await fetch(source, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TheFilesWithDub/1.0)",
      ...(range ? { Range: range } : {}),
    },
  });
  if (!response.ok || !response.body) {
    return new Response("Replay source unavailable", { status: response.status || 502 });
  }

  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": response.headers.get("cache-control") ?? "public, max-age=60",
    "Access-Control-Allow-Origin": "*",
  });
  const contentRange = response.headers.get("content-range");
  if (contentRange) headers.set("Content-Range", contentRange);
  if (response.headers.get("accept-ranges")) headers.set("Accept-Ranges", "bytes");

  if (contentType.toLowerCase().includes("mpegurl") || source.pathname.endsWith(".m3u8")) {
    return new Response(rewriteManifest(await response.text(), source), { status: response.status, headers });
  }
  return new Response(response.body, { status: response.status, headers });
}
