import type { MetadataRoute } from "next";
import { publicSeoRoutes, SITE_URL } from "./seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-18");
  return publicSeoRoutes.map(route => ({
    url: `${SITE_URL}${route.path === "/" ? "" : route.path}`,
    lastModified,
  }));
}
