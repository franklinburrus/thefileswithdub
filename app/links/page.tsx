import Image from "next/image";
import Link from "next/link";
import { metadataFor } from "../seo";

export const metadata = metadataFor("links");

/** UTM convention for the link-in-bio hub: every bio points at
 *  thefileswithdub.com/links, so each outbound destination carries
 *  ?utm_source=instagram&utm_medium=bio for attribution. */
const utm = "?utm_source=instagram&utm_medium=bio";

// All destination URLs below are verified against the site repo
// (app/components/files-platform.tsx, app/layout.tsx):
const YOUTUBE = `https://www.youtube.com/@TheFilesWithDub${utm}`;
const PATREON = `https://www.patreon.com/cw/CANTDUBME${utm}`;
const X = `https://x.com/TheFilesWithDUB${utm}`;
// Instagram handle verified in the Buffer/Apache pipeline records:
// @dubwiththefiles (the only Apache social handle).
const INSTAGRAM = `https://www.instagram.com/dubwiththefiles${utm}`;

/* PLACEHOLDER — NEWSLETTER SIGNUP URL (no verified URL yet):
 * "The Files" newsletter launches on beehiiv October 21, 2026 from
 * news.thefileswithdub.com. Drop the verified beehiiv signup URL in
 * NEWSLETTER_URL below before launch, then flip its row from
 * placeholder to a live link. */
const NEWSLETTER_URL = "";

/* PLACEHOLDER — PODCAST SHOW PAGE / RSS (no verified URL yet):
 * Transistor is active but episode one is not published and no public
 * show-page or RSS URL is on record. Fill PODCAST_URL with the verified
 * Transistor show page / RSS URL when it exists. Apple/Spotify store
 * links stay unlinked ("coming soon") until their listings are live. */
const PODCAST_URL = "";

type LinkRow =
  | { label: string; sub: string; href: string }
  | { label: string; sub: string; placeholder: string };

const rows: LinkRow[] = [
  { label: "Latest episode", sub: "YouTube — @TheFilesWithDub", href: YOUTUBE },
  ...(NEWSLETTER_URL
    ? [{ label: "The Files — newsletter", sub: "Sign up for the monthly letter", href: `${NEWSLETTER_URL}${utm}` } as LinkRow]
    : [{ label: "The Files — newsletter", sub: "Signup opens at launch — October 21", placeholder: "Coming Oct 21" } as LinkRow]),
  ...(PODCAST_URL
    ? [{ label: "Podcast", sub: "Full episodes, RSS", href: `${PODCAST_URL}${utm}` } as LinkRow]
    : [{ label: "Podcast", sub: "Apple & Spotify coming soon", placeholder: "Coming soon" } as LinkRow]),
  { label: "Patreon", sub: "Support the show", href: PATREON },
  { label: "Instagram", sub: "@dubwiththefiles", href: INSTAGRAM },
  { label: "X", sub: "@TheFilesWithDUB", href: X },
  { label: "Contact / sponsorship", sub: "Work with Dub", href: "/contact" },
];

export default function LinksPage() {
  return <>
    <main id="main-content" className="panel light" style={{ minHeight: "100svh" }}>
      <div className="center" style={{ maxWidth: "560px", margin: "0 auto" }}>
        <Image
          src="/files-with-dub-globe-logo.png"
          alt="The Files With Dub"
          width={112}
          height={112}
          priority
          style={{ borderRadius: "50%", marginBottom: "18px" }}
        />
        <p className="kicker">THE FILES WITH DUB</p>
        <h1 style={{ fontSize: "clamp(2.4rem, 8vw, 4rem)", marginBottom: "12px" }}>Links</h1>
        <p style={{ color: "#67625a", marginBottom: "38px", lineHeight: 1.55 }}>
          Everything in one place. Newest drops first.
        </p>
        <div style={{ display: "grid", gap: "12px", textAlign: "left" }}>
          {rows.map(row => "placeholder" in row ? (
            <span
              key={row.label}
              className="outline"
              aria-disabled="true"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", opacity: 0.65, cursor: "default" }}
            >
              <span>
                <span style={{ display: "block", fontSize: "12px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>{row.label}</span>
                <span style={{ display: "block", fontSize: "12px", color: "#67625a", marginTop: "6px" }}>{row.sub}</span>
              </span>
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: ".08em", whiteSpace: "nowrap" }}>{row.placeholder}</span>
            </span>
          ) : (
            <a
              key={row.label}
              className="outline"
              href={row.href}
              target={row.href.startsWith("http") ? "_blank" : undefined}
              rel={row.href.startsWith("http") ? "noreferrer" : undefined}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}
            >
              <span>
                <span style={{ display: "block", fontSize: "12px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>{row.label}</span>
                <span style={{ display: "block", fontSize: "12px", color: "#67625a", marginTop: "6px" }}>{row.sub}</span>
              </span>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
        <div style={{ marginTop: "44px" }}>
          <Link className="outline" href="/" style={{ display: "inline-block" }}>thefileswithdub.com</Link>
        </div>
      </div>
    </main>
    <footer><p>© {new Date().getFullYear()} The Files With Dub</p></footer>
  </>;
}
