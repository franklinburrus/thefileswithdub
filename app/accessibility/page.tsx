import type { Metadata } from "next";
import SiteNavigation from "../components/site-navigation";

export const metadata: Metadata = { title: "Accessibility", description: "Accessibility information for The Files With Dub.", robots: { index: false, follow: false } };

export default function AccessibilityPage() {
  return <><SiteNavigation /><main id="main-content" className="panel light policy-page"><p className="kicker">ACCESSIBILITY</p><h1>Accessibility statement<br /><em>pending review.</em></h1><p>The Files With Dub is completing a WCAG 2.2 AA review across keyboard, screen-reader, mobile, and contrast use. The final statement and a monitored contact path are pending owner approval.</p><p>If a page blocks access, use the visible navigation and return later while this review is completed.</p></main></>;
}
