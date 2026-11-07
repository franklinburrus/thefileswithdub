import { buildXCatalog, parseCsv } from './x-source.mjs';
import { fetchYoutubeVideos } from './youtube.mjs';
import { resolvePlayback } from './playback.mjs';
import { errorCategory, readUpstreamText } from './upstream.mjs';

const SHEET_ID = '17uhDO06vmVEz96YrUnA6aHyV5fL_3AAs3ylOjrYRLwI';
const sheetUrl = gid => `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;

export async function refreshFeed(repository, lane, env, fetcher = fetch) {
  const attempt = await repository.begin(lane);
  try {
    let accepted;
    if (lane === 'metadata') {
      const [master, titles] = await Promise.all(['672400447', '1718293388'].map(gid => readUpstreamText(sheetUrl(gid), { fetcher, maxBytes: 4_194_304, allowedRedirectHosts: ['docs.google.com', '.googleusercontent.com'] })));
      const candidate = buildXCatalog(parseCsv(master), parseCsv(titles), attempt.items);
      accepted = await repository.acceptMetadata(attempt.generation, candidate.items);
    } else if (lane === 'playback') {
      accepted = await repository.acceptPlayback(attempt.generation, await resolvePlayback(attempt.items, fetcher));
    } else {
      accepted = await repository.acceptYoutube(attempt.generation, await fetchYoutubeVideos(fetcher, env));
    }
    return { accepted, generation: attempt.generation };
  } catch (error) {
    const category = errorCategory(error);
    await repository.fail(lane, attempt.generation, category);
    return { accepted: false, generation: attempt.generation, errorCategory: category };
  }
}
