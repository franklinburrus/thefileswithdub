import { extractReplayHlsUrl, xBroadcasts } from "../../lib/x-broadcasts";

export async function GET() {
  const broadcasts = await Promise.all(xBroadcasts.map(async broadcast => {
    try {
      const response = await fetch(`https://x.com/i/broadcasts/${broadcast.id}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; TheFilesWithDub/1.0)",
        },
      });
      if (!response.ok) return { ...broadcast, hlsUrl: null };
      const source = extractReplayHlsUrl(await response.text());
      return {
        ...broadcast,
        hlsUrl: source ? `/api/x-media?url=${encodeURIComponent(source)}` : null,
      };
    } catch {
      return { ...broadcast, hlsUrl: null };
    }
  }));

  return Response.json(
    { broadcasts },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=3600" } },
  );
}
