const listingUrl = "https://www.eventbrite.com/b/ny--new-york/nightlife/";

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

export async function GET() {
  const token = process.env.EVENTBRITE_PUBLIC_TOKEN;
  if (!token) return Response.json({ events: [] }, { status: 503 });

  try {
    const listing = await fetch(listingUrl, { headers: { "User-Agent": "The-Files-With-Dub-NYC-Calendar/1.0" } });
    if (!listing.ok) throw new Error("Eventbrite listing unavailable");
    const html = await listing.text();
    const eventIds = [...html.matchAll(/tickets-(\d+)/g)].map(match => match[1]);
    const uniqueIds = [...new Set(eventIds)].slice(0, 12);
    const eventResults = await Promise.all(uniqueIds.map(async id => {
      const response = await fetch(`https://www.eventbriteapi.com/v3/events/${id}/?expand=venue`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return null;
      return response.json() as Promise<EventbriteEvent>;
    }));
    const events = eventResults.filter((event): event is EventbriteEvent => Boolean(event?.name?.text && event.url)).map(event => ({
      title: event.name!.text!,
      when: formatWhen(event.start?.local),
      venue: event.venue?.name ?? "New York City",
      note: "Eventbrite tickets",
      href: event.url!,
    }));
    return Response.json({ events }, { headers: { "Cache-Control": "public, max-age=900, s-maxage=900" } });
  } catch {
    return Response.json({ events: [] }, { status: 502 });
  }
}
