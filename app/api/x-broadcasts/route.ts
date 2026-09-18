import { extractReplayHlsUrl, xBroadcasts } from "../../lib/x-broadcasts";
import { fetchWithTimeout, readTextWithLimit } from "../../lib/http";

const MAX_BROADCAST_PAGE_BYTES = 4 * 1024 * 1024;

// Cloudflare Workers cap subrequests at 50 per invocation; keep concurrent
// upstream fetches well under that limit.
const FETCH_CONCURRENCY = 8;

async function resolveBroadcast(broadcast: (typeof xBroadcasts)[number]) {
  try {
    const response = await fetchWithTimeout(`https://x.com/i/broadcasts/${broadcast.id}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TheFilesWithDub/1.0)",
      },
    });
    if (!response.ok) return { ...broadcast, hlsUrl: null };
    const source = extractReplayHlsUrl(await readTextWithLimit(response, MAX_BROADCAST_PAGE_BYTES));
    return {
      ...broadcast,
      hlsUrl: source ? `/api/x-media?url=${encodeURIComponent(source)}` : null,
    };
  } catch {
    return { ...broadcast, hlsUrl: null };
  }
}

export async function GET() {
  const broadcasts: Awaited<ReturnType<typeof resolveBroadcast>>[] = [];
  for (let i = 0; i < xBroadcasts.length; i += FETCH_CONCURRENCY) {
    const chunk = await Promise.all(xBroadcasts.slice(i, i + FETCH_CONCURRENCY).map(resolveBroadcast));
    broadcasts.push(...chunk);
  }

  return Response.json(
    { broadcasts },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=3600" } },
  );
}
