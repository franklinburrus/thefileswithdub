import type { Metadata } from "next";
import SiteNavigation from "../components/site-navigation";

export const metadata: Metadata = { title: "Terms", description: "Terms information for The Files With Dub.", robots: { index: false, follow: false } };

export default function TermsPage() {
  return <><SiteNavigation /><main id="main-content" className="panel light policy-page"><p className="kicker">TERMS</p><h1>Terms information<br /><em>pending review.</em></h1><p>The final terms for The Files With Dub are pending owner and counsel approval. This draft does not create a completed legal agreement.</p><p>External services, media, event listings, and booking links remain subject to their own terms.</p></main></>;
}
