/** @typedef {{ title: string; when: string; venue: string; note: string; href: string }} NightlifeEvent */
/** @typedef {"live" | "empty" | "unavailable"} NightlifeStatus */

/**
 * @param {typeof fetch} fetcher
 * @returns {Promise<{ events: NightlifeEvent[]; status: NightlifeStatus }>}
 */
export async function loadNightlife(fetcher = fetch) {
  const unavailable = () => ({ events: [], status: "unavailable" });

  try {
    const response = await fetcher("/api/nightlife");
    if (!response.ok) return unavailable();

    const data = await response.json();
    if (!data || !Array.isArray(data.events)) return unavailable();

    return {
      events: data.events,
      status: data.events.length ? "live" : "empty",
    };
  } catch {
    return unavailable();
  }
}
