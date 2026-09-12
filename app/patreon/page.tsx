import Link from "next/link";
import Image from "next/image";
import SiteNavigation from "../components/site-navigation";

const patreon = "https://www.patreon.com/cw/CANTDUBME";

export default function PatreonPage() {
  return <><SiteNavigation /><main className="panel light patreon-page">
    <p className="kicker">THE FILES WITH DUB / MEMBERSHIP</p>
    <h1>Dub’s<br /><em>Patreon.</em></h1>
    <p>Watch, join, and manage your membership through Dub’s official Patreon home.</p>
    <section className="patreon-card" aria-labelledby="patreon-title">
      <div className="patreon-copy">
        <p className="kicker">MEMBER VIEWING</p>
        <h2 id="patreon-title">Watch directly on Patreon.</h2>
        <p>Patreon securely handles sign-up, member login, and access to member posts. If you are already signed in there, the full member experience opens directly in this browser window.</p>
        <div className="patreon-actions">
          <a className="solid" href={patreon} target="_self" rel="noreferrer">Watch on Patreon ↗</a>
          <a className="outline" href={patreon} target="_self" rel="noreferrer">Join or sign in ↗</a>
        </div>
      </div>
      <div className="patreon-feature-image"><Image src="/cant-dub-me-logo.png" alt="Can’t DUB Me logo" width={2400} height={2400} sizes="(max-width: 760px) 82vw, 40vw" priority /><span>CAN’T DUB ME / MEMBER PREVIEW</span></div>
    </section>
    <Link className="outline" href="/">Back to The Files</Link>
  </main></>;
}
