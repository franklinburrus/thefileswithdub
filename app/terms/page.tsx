import type { Metadata } from "next";
import SiteNavigation from "../components/site-navigation";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Plain-language terms of use template for The Files With Dub.",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return <><SiteNavigation /><main id="main-content" className="panel light policy-page">
    <p className="kicker">TERMS</p>
    <h1>Terms of use<br /><em>template for review.</em></h1>
    <p className="policy-note"><strong>Template notice:</strong> This plain-language draft is provided for owner and qualified-counsel review. It is not legal advice and should not be treated as the final agreement until the owner approves the details, governing law, and effective date.</p>

    <h2>About The Files With Dub</h2>
    <p>The Files With Dub is an independent entertainment and media platform for culture, commentary, interviews, clips, events, and production services. These terms describe general use of this website and its public pages.</p>

    <h2>Using the site</h2>
    <ul>
      <li>Use the site lawfully and respectfully.</li>
      <li>Do not interfere with the site, attempt unauthorized access, or use automated activity that burdens the service.</li>
      <li>Do not copy, frame, or present the site or its branding as your own, except as permitted by law or by written permission.</li>
    </ul>

    <h2>Content and ownership</h2>
    <p>Unless a page identifies another source, site text, branding, artwork, and original production materials belong to The Files With Dub or its licensors. Public videos, music, event listings, and other third-party materials remain subject to their respective owners and terms. A link or embed does not imply endorsement.</p>

    <h2>Bookings, listings, and external services</h2>
    <p>Studio and consulting links send you to the official Calendly booking pages. Media and event features may use YouTube, Apple Music, Eventbrite, Patreon, or other third-party services. Their availability, pricing, privacy practices, and terms are controlled by those providers. Review the provider’s information before booking, registering, or sharing information.</p>

    <h2>Submissions</h2>
    <p>The local contact, tip, and newsletter forms are currently disabled. Do not send passwords, financial information, private records, urgent safety concerns, or confidential material through this website or an external social message. A future submission process will need its own approved instructions.</p>

    <h2>Disclaimers</h2>
    <p>The site and its information are provided for general entertainment and informational purposes. Listings, links, media, schedules, and availability can change. To the extent permitted by law, The Files With Dub makes no promise that every page or third-party service will be uninterrupted, current, or error-free.</p>

    <h2>Changes and contact</h2>
    <p>The owner may update these terms when the site, services, or applicable requirements change. Before publication as a final policy, add the owner’s legal name, governing jurisdiction, effective date, and approved direct contact method.</p>
    <p>Until an owner-approved direct address is published, use the verified social and source channels listed on the <a href="/contact">Contact page</a>.</p>
  </main></>;
}
