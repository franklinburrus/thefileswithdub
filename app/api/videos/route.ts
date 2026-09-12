const channelId = "UCPydZggyK7qQRp4VNUGXNgg";
const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

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
      title: readTag(entry, "title"),
      runtime: "New upload",
      date: publishedLabel(readTag(entry, "published")),
      videoId,
      image: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  }).filter(video => Boolean(video.videoId && video.title));
}

export async function GET() {
  try {
    const response = await fetch(feedUrl, { headers: { "User-Agent": "The-Files-With-Dub-Updates/1.0" } });
    if (!response.ok) throw new Error("YouTube feed unavailable");
    const videos = videosFromFeed(await response.text());
    if (!videos.length) throw new Error("YouTube feed was empty");
    return Response.json({ videos, source: "youtube" }, { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } });
  } catch {
    return Response.json({ videos: [], source: "unavailable" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
