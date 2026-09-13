import { fetchWithTimeout, readJsonWithLimit, readTextWithLimit } from "../../lib/http";

const listingUrl = "https://www.eventbrite.com/b/ny--new-york/nightlife/";
const MAX_LISTING_BYTES = 4 * 1024 * 1024;
const MAX_EVENT_BYTES = 512 * 1024;
const MAX_EVENT_URL_LENGTH = 2_048;

type EventbriteEvent = {
  id: string;
  name?: { text?: string };
  start?: { local?: string };
  venue?: { name?: string };
  url?: string;
};

function formatWhen(local?: string) {
  if (!local) return "Upcoming";
  const date = new Date(local);
  if (Number.isNaN(date.getTime())) return "Upcoming";
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function approvedEventUrl(value?: string): string | null {
  if (!value || value.length > MAX_EVENT_URL_LENGTH) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return null;
    if (hostname !== "eventbrite.com" && !hostname.endsWith(".eventbrite.com")) return null;
    if (url.username || url.password || url.port || url.hash) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function boundedLabel(value: string | undefined, fallback: string, maxLength: number): string {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : fallback;
}

export async function GET() {
  const token = process.env.EVENTBRITE_PUBLIC_TOKEN;
  if (!token) return Response.json({ events: [] }, { status: 503 });

  try {
    const listing = await fetchWithTimeout(listingUrl, { headers: { "User-Agent": "The-Files-With-Dub-NYC-Calendar/1.0" } });
    if (!listing.ok) throw new Error("Eventbrite listing unavailable");
    const html = await readTextWithLimit(listing, MAX_LISTING_BYTES);
    const eventIds = [...html.matchAll(/tickets-(\d+)/g)].map(match => match[1]);
    const uniqueIds = [...new Set(eventIds)].slice(0, 12);
    const eventResults = await Promise.all(uniqueIds.map(async id => {
      const response = await fetchWithTimeout(`https://www.eventbriteapi.com/v3/events/${id}/?expand=venue`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return null;
      return readJsonWithLimit<EventbriteEvent>(response, MAX_EVENT_BYTES);
    }));
    const events = eventResults.map(event => {
      const href = approvedEventUrl(event?.url);
      if (!event || !href || !event.name?.text) return null;
      return {
        title: boundedLabel(event.name.text, "Eventbrite listing", 240),
        when: formatWhen(event.start?.local),
        venue: boundedLabel(event.venue?.name, "New York City", 120),
        note: "Eventbrite tickets",
        href,
      };
    }).filter((event): event is { title: string; when: string; venue: string; note: string; href: string } => Boolean(event));
    return Response.json({ events }, { headers: { "Cache-Control": "public, max-age=900, s-maxage=900" } });
  } catch {
    return Response.json({ events: [] }, { status: 502 });
  }
}
