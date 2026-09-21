import type { Metadata } from "next";
import { metadataFor, SITE_URL, safeJsonLd } from "../seo";
import { displayTitleFor, xBroadcasts } from "../lib/x-broadcasts";

export const metadata: Metadata = metadataFor("broadcasts");

const archiveStructuredData = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "X Broadcast Replays — The Files With Dub",
  url: `${SITE_URL}/broadcasts`,
  itemListElement: xBroadcasts.map((broadcast, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "VideoObject",
      name: displayTitleFor(broadcast),
      thumbnailUrl: broadcast.poster.startsWith("/")
        ? `${SITE_URL}${broadcast.poster}`
        : broadcast.poster,
      ...(broadcast.date ? { uploadDate: broadcast.date } : {}),
      embedUrl: `${SITE_URL}/broadcasts`,
    },
  })),
};

export default function BroadcastsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(archiveStructuredData) }} />{children}</>;
}
