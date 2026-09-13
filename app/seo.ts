import type { Metadata } from "next";

export const SITE_URL = "https://www.thefileswithdub.com";
export const SITE_NAME = "The Files With Dub";
export const SOCIAL_IMAGE = "/og.webp";

export const publicSeoRoutes = [
  { key: "home", path: "/", title: "Culture, Commentary & Media", description: "The Files With Dub is an independent Queens, New York platform for culture, commentary, interviews, and media production." },
  { key: "files", path: "/files", title: "Clips & Interviews", description: "Browse the latest Files With Dub clips, interviews, and conversations sourced from Dub's public YouTube channel." },
  { key: "broadcasts", path: "/broadcasts", title: "X Broadcast Replays", description: "Watch public X broadcast replays from The Files With Dub directly inside the Files archive." },
  { key: "patreon", path: "/patreon", title: "Patreon Membership", description: "Watch and manage The Files With Dub membership experience through Dub's official Patreon home." },
  { key: "outside", path: "/outside", title: "NYC Nightlife, Music & Culture", description: "Outside is The Files With Dub guide to New York nightlife, music, and culture." },
  { key: "studio", path: "/studio", title: "Podcast & Video Production in Queens", description: "Explore The Files With Dub studio options for audio podcasts, video podcasts, and multi-camera production in Queens, New York." },
  { key: "consulting", path: "/consulting", title: "Media Strategy for Creators", description: "The Files With Dub offers focused media strategy, content audits, and podcast launch guidance for creators and shows." },
  { key: "spill", path: "/spill", title: "The Tip Line", description: "Share context, a lead, or a source with The Files With Dub through the clearly labeled, non-secure tip-line preparation form." },
  { key: "contact", path: "/contact", title: "Contact", description: "Find the right contact path for The Files With Dub, including general inquiries, event information, and media conversations." },
  { key: "about", path: "/about", title: "About", description: "Learn about The Files With Dub, an independent Queens, New York platform for culture, commentary, interviews, and production." },
] as const;

export type PublicSeoRoute = typeof publicSeoRoutes[number]["key"];

const routeByKey = new Map(publicSeoRoutes.map(route => [route.key, route]));

export function metadataFor(key: PublicSeoRoute): Metadata {
  const route = routeByKey.get(key);
  if (!route) throw new Error(`Unknown SEO route: ${key}`);
  const url = `${SITE_URL}${route.path === "/" ? "" : route.path}`;

  return {
    title: route.title,
    description: route.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${SITE_NAME} | ${route.title}`,
      description: route.description,
      url,
      images: [{ url: SOCIAL_IMAGE, alt: `${SITE_NAME} — ${route.title}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} | ${route.title}`,
      description: route.description,
      images: [SOCIAL_IMAGE],
    },
  };
}
