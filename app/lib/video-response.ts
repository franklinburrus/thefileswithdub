export type MediaItem = { id: number; title: string; runtime: string; date: string; videoId: string; image: string; publishedAt?: string };

export function videosFromResponse(payload: unknown): MediaItem[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { videos?: unknown }).videos)) throw new Error("Invalid YouTube snapshot");
  const seen = new Set<string>();
  return (payload as { videos: unknown[] }).videos.map(value => {
    if (!value || typeof value !== "object") throw new Error("Invalid YouTube item");
    const item = value as MediaItem;
    if (typeof item.videoId !== "string" || !/^[A-Za-z0-9_-]{11}$/.test(item.videoId) || seen.has(item.videoId)
      || typeof item.title !== "string" || !item.title.trim() || typeof item.date !== "string"
      || typeof item.runtime !== "string" || typeof item.id !== "number"
      || item.image !== `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`) throw new Error("Invalid YouTube metadata");
    seen.add(item.videoId);
    return item;
  });
}
