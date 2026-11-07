import { errorCategory, readUpstreamText } from './upstream.mjs';

export const CHANNEL_ID = 'UCPydZggyK7qQRp4VNUGXNgg';
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

function decodeXml(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, entity => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
    if (named[entity]) return named[entity];
    const code = entity[2] === 'x' ? Number.parseInt(entity.slice(3, -1), 16) : Number(entity.slice(2, -1));
    if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) throw new Error('invalid-candidate');
    return String.fromCodePoint(code);
  });
}
function tag(xml, name) {
  const matches = [...xml.matchAll(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'g'))];
  if (matches.length !== 1) throw new Error('invalid-candidate');
  return decodeXml(matches[0][1].trim());
}
function videosFromEntries(entries) {
  if (!entries.length || entries.length > 50) throw new Error('invalid-candidate');
  const ids = new Set();
  const normalized = entries.map(entry => {
    if (entry.channelId !== CHANNEL_ID) throw new Error('invalid-candidate');
    if (!VIDEO_ID.test(entry.videoId) || ids.has(entry.videoId)) throw new Error('invalid-candidate');
    ids.add(entry.videoId);
    const title = entry.title.replace(/\s+/g, ' ').trim();
    const dateMs = Date.parse(entry.publishedAt);
    if (!title || title.length > 500 || !/^\d{4}-\d{2}-\d{2}T/.test(entry.publishedAt) || !Number.isFinite(dateMs)) throw new Error('invalid-candidate');
    return { title, videoId: entry.videoId, publishedAt: new Date(dateMs).toISOString() };
  }).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.videoId.localeCompare(b.videoId));
  return normalized.map((entry, index) => ({
    id: index + 1,
    title: entry.title,
    runtime: 'New upload',
    date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(entry.publishedAt)),
    videoId: entry.videoId,
    image: `https://i.ytimg.com/vi/${entry.videoId}/hqdefault.jpg`,
    publishedAt: entry.publishedAt,
  }));
}

function validateXmlStructure(xml) {
  const stack = [];
  const tokens = /<!--[\s\S]*?-->|<\?xml[^?]*\?>|<!\[CDATA\[[\s\S]*?\]\]>|<\/?([A-Za-z_][\w:.-]*)(?:\s+[^<>]*?)?\s*\/?>/g;
  let end = 0;
  for (const match of xml.matchAll(tokens)) {
    if (xml.slice(end, match.index).includes('<')) throw new Error('invalid-candidate');
    end = match.index + match[0].length;
    if (!match[1]) continue;
    if (match[0].startsWith('</')) {
      if (stack.pop() !== match[1]) throw new Error('invalid-candidate');
    } else if (!match[0].endsWith('/>')) stack.push(match[1]);
  }
  if (stack.length || xml.slice(end).includes('<')) throw new Error('invalid-candidate');
}

export function parseYoutubeFeed(xml) {
  if (typeof xml !== 'string' || !/^\s*(?:<\?xml[^?]*\?>\s*)?<feed\b[^>]*>[\s\S]*<\/feed>\s*$/.test(xml) || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('invalid-candidate');
  validateXmlStructure(xml);
  const entries = xml.match(/<entry\b[^>]*>[\s\S]*?<\/entry>/g) ?? [];
  if (entries.length !== (xml.match(/<entry\b/g) ?? []).length || entries.length !== (xml.match(/<\/entry>/g) ?? []).length) throw new Error('invalid-candidate');
  const metadata = xml.replace(/<entry\b[^>]*>[\s\S]*?<\/entry>/g, '');
  if (![CHANNEL_ID, CHANNEL_ID.slice(2)].includes(tag(metadata, 'yt:channelId'))) throw new Error('invalid-candidate');
  const author = tag(metadata, 'author');
  if (tag(author, 'uri') !== `https://www.youtube.com/channel/${CHANNEL_ID}`) throw new Error('invalid-candidate');
  return videosFromEntries(entries.map(entry => ({ videoId: tag(entry, 'yt:videoId'), channelId: tag(entry, 'yt:channelId'), title: tag(entry, 'title'), publishedAt: tag(entry, 'published') })));
}

async function apiFallback(fetcher, key) {
  const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
  url.search = new URLSearchParams({ part: 'snippet,contentDetails', playlistId: `UU${CHANNEL_ID.slice(2)}`, maxResults: '15' }).toString();
  const body = JSON.parse(await readUpstreamText(url.toString(), { fetcher, headers: { 'X-Goog-Api-Key': key } }));
  if (!Array.isArray(body.items)) throw new Error('invalid-candidate');
  return videosFromEntries(body.items.map(item => ({
    videoId: item.contentDetails?.videoId,
    channelId: item.snippet?.videoOwnerChannelId,
    title: item.snippet?.title ?? '',
    publishedAt: item.contentDetails?.videoPublishedAt ?? '',
  })));
}

export async function fetchYoutubeVideos(fetcher = fetch, env = {}) {
  let category = 'network';
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return parseYoutubeFeed(await readUpstreamText(RSS_URL, { fetcher, headers: { Accept: 'application/atom+xml,application/xml', 'User-Agent': 'The-Files-With-Dub-Updates/2.0' } }));
    } catch (error) { category = errorCategory(error); }
  }
  if (env.YOUTUBE_DATA_API_FALLBACK_ENABLED === 'true' && env.YOUTUBE_DATA_API_KEY) return apiFallback(fetcher, env.YOUTUBE_DATA_API_KEY);
  throw new Error(category);
}
