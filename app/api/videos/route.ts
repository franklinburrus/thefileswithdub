import { fetchWithTimeout, readTextWithLimit } from "../../lib/http";

const channelId = "UCPydZggyK7qQRp4VNUGXNgg";
const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
const MAX_FEED_BYTES = 1_048_576;
const MAX_TITLE_LENGTH = 240;
const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

type Video = {
  id: number;
  title: string;
  runtime: string;
  date: string;
  videoId: string;
  image: string;
};

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function readTag(entry: string, tag: string) {
  const value = entry.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return value ? decodeXml(value[1].trim()) : "";
}

function publishedLabel(value: string) {
  const published = new Date(value);
  if (Number.isNaN(published.getTime())) return "New upload";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(published);
}

function videosFromFeed(xml: string): Video[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  return entries.map((entry, index) => {
    const videoId = readTag(entry, "yt:videoId");
    return {
      id: index + 1,
      title: readTag(entry, "title").replace(/\s+/g, " ").trim().slice(0, MAX_TITLE_LENGTH),
      runtime: "New upload",
      date: publishedLabel(readTag(entry, "published")),
      videoId,
      image: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  }).filter(video => Boolean(video.title && YOUTUBE_VIDEO_ID.test(video.videoId)));
}

export async function GET() {
  try {
    let response: Response | null = null;
    // YouTube's public RSS edge intermittently answers 404 for this channel
    // even when the same request succeeds moments later. Retry a bounded
    // number of times before exposing the existing client fallback state.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const candidate = await fetchWithTimeout(feedUrl, {
        headers: {
          Accept: "application/atom+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent": "The-Files-With-Dub-Updates/1.0",
        },
      });
      if (candidate.ok) {
        response = candidate;
        break;
      }
    }
    if (!response) throw new Error("YouTube feed unavailable");
    const videos = videosFromFeed(await readTextWithLimit(response, MAX_FEED_BYTES));
    if (!videos.length) throw new Error("YouTube feed was empty");
    return Response.json({ videos, source: "youtube" }, { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } });
  } catch {
    return Response.json(
      { videos: [], source: "unavailable" },
      { headers: { "Cache-Control": "no-store", "X-Data-Status": "degraded" } },
    );
  }
}
