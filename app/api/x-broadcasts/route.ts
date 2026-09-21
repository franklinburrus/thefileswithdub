import { mergeCatalog, resolveCatalog } from "../../lib/broadcasts-catalog";

export async function GET() {
  // Live resolution (the ~50 x.com page fan-out). The worker serves the KV
  // catalog on this route's behalf whenever it is populated; this path only
  // runs on a KV miss and seeds KV for the next request.
  const catalog = await resolveCatalog();

  return Response.json(mergeCatalog(catalog), {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=3600" },
  });
}
