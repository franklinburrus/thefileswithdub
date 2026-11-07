import { approvedReplayUrl } from './replay-url.mjs';
import { errorCategory, readUpstreamText } from './upstream.mjs';

export function validPlaybackUrl(value) {
  const url = approvedReplayUrl(value);
  return Boolean(url && /\.m3u8$/i.test(url.pathname));
}

export function extractPlaybackUrl(html) {
  const decoded = html.replace(/\\u002[fF]/g, '/').replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/&amp;/g, '&').replace(/&quot;|&#34;/g, '"');
  const urls = decoded.match(/https?:\/\/[^\s"'<>\\]+\.m3u8(?:\?[^\s"'<>\\]*)?/g) ?? [];
  return urls.find(validPlaybackUrl) ?? null;
}

export async function resolvePlayback(items, fetcher = fetch) {
  const results = [];
  const candidates = items.filter(item => item.sourceUrl?.startsWith('https://x.com/i/broadcasts/'));
  for (let offset = 0; offset < candidates.length; offset += 5) {
    const batch = await Promise.all(candidates.slice(offset, offset + 5).map(async item => {
      const identity = { id: item.id, sourceUrl: item.sourceUrl };
      if (!new RegExp(`^https://x\\.com/i/(?:broadcasts|spaces)/${item.id}$`).test(item.sourceUrl)) return { ...identity, errorCategory: 'invalid-source' };
      try {
        const text = await readUpstreamText(item.sourceUrl, { fetcher, maxBytes: 2_097_152, timeoutMs: 8_000, headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' } });
        const hlsUrl = extractPlaybackUrl(text);
        return hlsUrl ? { ...identity, hlsUrl } : { ...identity, errorCategory: 'invalid-playback' };
      } catch (error) {
        return { ...identity, errorCategory: errorCategory(error) };
      }
    }));
    results.push(...batch);
  }
  return results;
}
