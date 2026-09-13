import type { MetadataRoute } from "next";
import { publicSeoRoutes, SITE_URL } from "./seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicSeoRoutes.map(route => ({
    url: `${SITE_URL}${route.path === "/" ? "" : route.path}`,
  }));
}
