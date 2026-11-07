/** Shared CDN boundary for published manifests, rewritten renditions and media. */
export function approvedReplayUrl(value) {
  if (typeof value !== 'string' || !value || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.video\.pscp\.tv$/.test(url.hostname)) return null;
    if (url.username || url.password || url.port || url.hash) return null;
    // Fastly masters use both the original path and this observed /a rendition prefix.
    if (!/^\/(?:a\/)?Transcoding\/v1\/hls\//.test(url.pathname)) return null;
    return url;
  } catch {
    return null;
  }
}
