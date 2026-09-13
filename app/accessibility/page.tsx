import type { Metadata } from "next";
import SiteNavigation from "../components/site-navigation";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "Accessibility statement template for The Files With Dub.",
  robots: { index: false, follow: false },
};

export default function AccessibilityPage() {
  return <><SiteNavigation /><main id="main-content" className="panel light policy-page">
    <p className="kicker">ACCESSIBILITY</p>
    <h1>Access for every<br /><em>visitor.</em></h1>
    <p className="policy-note"><strong>Template notice:</strong> This statement describes the current accessibility goal and known limits. It is not a certification of WCAG conformance. The owner should review it after the next full browser, keyboard, screen-reader, and mobile audit.</p>

    <h2>Our goal</h2>
    <p>The Files With Dub aims to make its public website usable by as many people as possible and targets the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA. Accessibility is an ongoing product and content responsibility, not a one-time claim.</p>

    <h2>Current measures</h2>
    <ul>
      <li>Pages use semantic headings, landmarks, labeled controls, and a skip link to the main content.</li>
      <li>Layouts are responsive and are checked at phone, tablet, desktop, and large-screen widths.</li>
      <li>Images include descriptive alternative text where they convey meaningful information, and keyboard focus is designed to remain visible.</li>
      <li>Interactive media includes a keyboard-closeable player; third-party controls remain governed by their providers.</li>
    </ul>

    <h2>Known limitations</h2>
    <p>Embedded YouTube and Apple Music players, Eventbrite listings, Calendly booking pages, Patreon pages, and other external services are outside the site’s direct control. Their controls, captions, contrast, language, and assistive-technology behavior may change independently. The local contact, tip, and newsletter forms are currently disabled.</p>

    <h2>Report an access barrier</h2>
    <p>If a page or interaction blocks access, use a verified social or source channel on the <a href="/contact">Contact page</a>. Include the page address, device or browser, and a plain description of the barrier. Do not include passwords, financial details, private records, or urgent safety information.</p>

    <h2>Review and updates</h2>
    <p>Record the next audit date, owner-approved accessibility contact, and any resolved or open issues here when the statement is finalized. The owner may update this page as the site and its third-party services change.</p>
  </main></>;
}
