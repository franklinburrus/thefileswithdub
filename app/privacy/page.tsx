import type { Metadata } from "next";
import SiteNavigation from "../components/site-navigation";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Plain-language privacy policy template for The Files With Dub.",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return <><SiteNavigation /><main id="main-content" className="panel light policy-page">
    <p className="kicker">PRIVACY</p>
    <h1>Privacy information<br /><em>template for review.</em></h1>
    <p className="policy-note"><strong>Template notice:</strong> This plain-language draft is provided for owner and qualified-counsel review. Confirm the actual hosting, analytics, logs, cookies, vendors, retention periods, and legal contact before treating it as a final privacy notice.</p>

    <h2>What this site does</h2>
    <p>The Files With Dub publishes entertainment and media content, public event information, and production-service information. The site currently keeps its local contact, tip, and newsletter forms disabled, so those forms do not accept or send submissions from this site.</p>

    <h2>Information handled when you browse</h2>
    <p>Website infrastructure and security providers may process ordinary request information such as an IP address, browser or device details, timestamps, and requested pages to deliver, secure, and troubleshoot the site. The owner should confirm the providers, retention periods, analytics settings, and cookie behavior before approving this policy.</p>

    <h2>Information you choose to provide</h2>
    <p>Do not submit passwords, financial details, private records, urgent safety concerns, or other sensitive information through this website. If you contact The Files through a social or source channel, that platform’s account, messaging, and privacy practices also apply.</p>

    <h2>Third-party services</h2>
    <p>Pages may link to or embed YouTube, Apple Music, Eventbrite, Calendly, Patreon, and other providers. Those providers may set their own cookies, collect usage information, or request information when you interact with them. Their privacy notices—not this draft—govern those activities.</p>

    <h2>Use, sharing, and retention</h2>
    <p>Information may be used to operate the site, protect it from abuse, understand reliability, and respond through an approved channel. Do not publish a final promise about sale, sharing, or retention until the owner has verified the actual data flows and legal requirements. This template does not authorize a sale of personal information.</p>

    <h2>Your choices and questions</h2>
    <p>Depending on where you live, you may have rights to request access, correction, deletion, or information about processing. Add the owner’s verified privacy contact and the applicable request process before relying on this section. Until then, use the verified social and source channels on the <a href="/contact">Contact page</a> and do not include sensitive details.</p>

    <h2>Children and updates</h2>
    <p>Review this site with counsel before making a child-directed or age-related statement. The owner may update this notice when the site, vendors, or practices change. Add an effective date and revision history when the final policy is approved.</p>
  </main></>;
}
