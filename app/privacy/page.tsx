import type { Metadata } from "next";
import SiteNavigation from "../components/site-navigation";

export const metadata: Metadata = { title: "Privacy", description: "Privacy information for The Files With Dub.", robots: { index: false, follow: false } };

export default function PrivacyPage() {
  return <><SiteNavigation /><main id="main-content" className="panel light policy-page"><p className="kicker">PRIVACY</p><h1>Privacy information<br /><em>pending review.</em></h1><p>This page is a transparent draft pending owner and counsel approval. Until the final policy, Contact, Spill, and Dispatch remain inactive and the site does not accept submissions through those forms.</p><p>Do not send sensitive personal information, passwords, financial details, or urgent safety concerns through this website.</p></main></>;
}
