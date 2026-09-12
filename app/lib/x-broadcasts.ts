export type XBroadcast = {
  id: string;
  title: string;
  poster: string;
};

export type XBroadcastReplay = XBroadcast & {
  hlsUrl: string | null;
};

export const xBroadcasts: XBroadcast[] = [
  { id: "1AKEmmrYnnnKL", title: "CAN'T DUB ME RADIO: ROC SOLID | KAREN CIVIL | WE TURNING UP", poster: "/broadcasts/1AKEmmrYnnnKL.png" },
  { id: "1pJkOOzwOZjJj", title: "LET'S START THE WEEK OFF RIGHT!!!", poster: "/broadcasts/1pJkOOzwOZjJj.jpg" },
  { id: "1rGmqqargvLGy", title: "FRIDAY FUNK | THEY STINK WITH MESS | VIBES ONLY", poster: "/broadcasts/1rGmqqargvLGy.jpg" },
  { id: "1AxRnnwoqwyxl", title: "It's Friday!!!! Whewww Lots to Talk About!!!", poster: "/broadcasts/1AxRnnwoqwyxl.jpg" },
  { id: "1XxyggRVnEVGM", title: "EXTENDED MESSY LIVE | SPACE WARS & VIBES", poster: "/broadcasts/1XxyggRVnEVGM.jpg" },
  { id: "1DxLddryWQPxm", title: "4TH of July SPECIAL | WAKE IT UP!!!!!", poster: "/broadcasts/1DxLddryWQPxm.jpg" },
  { id: "1XxyggYqmoeGM", title: "JOE BUDDEN NEW WEBAPP | SATURDAY VIBES | BONUS CONTENT", poster: "/broadcasts/1XxyggYqmoeGM.jpg" },
  { id: "1YGNrrmoqZoGw", title: "STARTING THE WEEK OFF RIGHT PT 2 | TURN UP", poster: "/broadcasts/1YGNrrmoqZoGw.jpg" },
  { id: "1jGXggZlkdVKZ", title: "NYC | AKADEMIKS SCARED NOW? | JOE BUDDEN VS MOUSE JONES", poster: "/broadcasts/1jGXggZlkdVKZ.jpg" },
  { id: "1nxeLLQwQjoJX", title: "MEDIA STREETS ON FIRE!!! LOTS OF FILES", poster: "/broadcasts/1nxeLLQwQjoJX.jpg" },
  { id: "1jGXggPZWLVKZ", title: "RORY WAS HATIN | Live Broadcast", poster: "/broadcasts/1jGXggPZWLVKZ.jpg" },
];

export function extractReplayHlsUrl(html: string): string | null {
  const normalized = html
    .replaceAll("\\u0026", "&")
    .replaceAll("\\/", "/")
    .replaceAll("&amp;", "&");
  const matches = normalized.match(/https:\/\/[^"'<>\s]+\.m3u8(?:\?[^"'<>\s]*)?/g) ?? [];
  return matches.find(url => url.includes("periscope-replay") || url.includes("type=replay")) ?? matches[0] ?? null;
}
