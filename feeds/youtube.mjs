import { errorCategory, readUpstreamText } from './upstream.mjs';

export const CHANNEL_ID = 'UCPydZggyK7qQRp4VNUGXNgg';
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const UPLOADS_ID = `UU${CHANNEL_ID.slice(2)}`;
const MAX_VIDEOS = 15;

function publishedTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) throw new Error('invalid-candidate');
  const time = Date.parse(value);
  const day = Date.parse(`${value.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(time) || !Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== value.slice(0, 10)) throw new Error('invalid-candidate');
  return time;
}

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
    if (typeof entry.title !== 'string') throw new Error('invalid-candidate');
    const title = entry.title.replace(/\s+/g, ' ').trim();
    const dateMs = publishedTime(entry.publishedAt);
    if (!title || title.length > 500) throw new Error('invalid-candidate');
    return { title, videoId: entry.videoId, publishedAt: new Date(dateMs).toISOString() };
  }).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.videoId.localeCompare(b.videoId));
  return normalized.slice(0, MAX_VIDEOS).map((entry, index) => ({
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

async function apiItems(endpoint, params, fetcher, key, kind) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  url.search = new URLSearchParams(params).toString();
  const body = JSON.parse(await readUpstreamText(url.toString(), { fetcher, headers: { 'X-Goog-Api-Key': key } }));
  if (body?.kind !== kind || !Array.isArray(body.items) || body.items.length > 50 || body.error) throw new Error('invalid-candidate');
  return body.items;
}

async function apiFallback(fetcher, key, now) {
  const playlist = await apiItems('playlistItems', { part: 'snippet,contentDetails', playlistId: UPLOADS_ID, maxResults: '50' }, fetcher, key, 'youtube#playlistItemListResponse');
  if (!playlist.length) throw new Error('invalid-candidate');
  const requested = new Map();
  for (const item of playlist) {
    const id = item?.contentDetails?.videoId;
    const snippet = item?.snippet;
    if (
      item?.kind !== 'youtube#playlistItem' || !VIDEO_ID.test(id ?? '') || requested.has(id) ||
      snippet?.channelId !== CHANNEL_ID || snippet.playlistId !== UPLOADS_ID ||
      snippet.resourceId?.kind !== 'youtube#video' || snippet.resourceId.videoId !== id ||
      (snippet.videoOwnerChannelId !== undefined && snippet.videoOwnerChannelId !== CHANNEL_ID)
    ) throw new Error('invalid-candidate');
    requested.set(id, snippet);
  }
  const videos = await apiItems('videos', { part: 'snippet,status', id: [...requested.keys()].join(',') }, fetcher, key, 'youtube#videoListResponse');
  const seen = new Set();
  const eligible = [];
  for (const item of videos) {
    const snippet = item?.snippet;
    const status = item?.status;
    if (
      item?.kind !== 'youtube#video' || !requested.has(item.id) || seen.has(item.id) ||
      snippet?.channelId !== CHANNEL_ID || !status ||
      !['public', 'private', 'unlisted'].includes(status.privacyStatus) ||
      !['uploaded', 'processed', 'failed', 'rejected', 'deleted'].includes(status.uploadStatus)
    ) throw new Error('invalid-candidate');
    seen.add(item.id);
    const publishedAt = publishedTime(snippet.publishedAt);
    const publishAt = status.publishAt === undefined ? null : publishedTime(status.publishAt);
    if (
      status.privacyStatus !== 'public' || status.uploadStatus !== 'processed' ||
      snippet.liveBroadcastContent === 'upcoming' || publishedAt > now ||
      (publishAt !== null && publishAt > now)
    ) continue;
    if (requested.get(item.id).videoOwnerChannelId !== CHANNEL_ID) throw new Error('invalid-candidate');
    eligible.push({ videoId: item.id, channelId: snippet.channelId, title: snippet.title, publishedAt: snippet.publishedAt });
  }
  // Missing videos are unavailable to this public API caller and stay excluded.
  return videosFromEntries(eligible);
}

export async function fetchYoutubeVideos(fetcher = fetch, env = {}, now = Date.now) {
  let category = 'network';
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const videos = parseYoutubeFeed(await readUpstreamText(RSS_URL, { fetcher, headers: { Accept: 'application/atom+xml,application/xml', 'User-Agent': 'The-Files-With-Dub-Updates/2.0' } }));
      return { videos, provider: 'rss', primaryErrorCategory: null };
    } catch (error) { category = errorCategory(error); }
  }
  if (env.YOUTUBE_DATA_API_FALLBACK_ENABLED === 'true' && env.YOUTUBE_DATA_API_KEY) {
    try {
      const videos = await apiFallback(fetcher, env.YOUTUBE_DATA_API_KEY, now());
      return { videos, provider: 'youtube-data-api', primaryErrorCategory: category };
    } catch (error) {
      throw Object.assign(new Error(errorCategory(error)), { primaryErrorCategory: category });
    }
  }
  throw Object.assign(new Error(category), { primaryErrorCategory: category });
}
