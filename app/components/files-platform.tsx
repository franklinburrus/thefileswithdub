"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteNavigation from "./site-navigation";

export type Page = "home" | "library" | "files" | "studio" | "consulting" | "about" | "contact" | "tip";

const pageRoutes: Record<Page, string> = {
  home: "/",
  library: "/files",
  files: "/outside",
  studio: "/studio",
  consulting: "/consulting",
  about: "/about",
  contact: "/contact",
  tip: "/spill",
};

const channel = "https://www.youtube.com/@TheFilesWithDub";
const xProfile = "https://x.com/TheFilesWithDUB";
const shopifyStorefront = "https://9p7whp-1k.myshopify.com";
const calendlyHome = "https://calendly.com/dubwiththefiles";
const patreon = "https://www.patreon.com/cw/CANTDUBME";
type MediaItem = { id: number; title: string; runtime: string; date: string; videoId: string; image: string };
const fallbackMedia: MediaItem[] = [
  { id: 20, title: "🚨Karen Civil Explains the Future of Verzuz | Ish takes SHOT at Rick Ross | Patreon Exclusive 🗂️", runtime: "YouTube", date: "YouTube", videoId: "yf4qP6dZ7M0", image: "https://i.ytimg.com/vi/yf4qP6dZ7M0/hqdefault.jpg" },
  { id: 19, title: "🚨Joe Budden CHECKS Mandi for VIOLATING‼️😱🗂️| BEEF Simmering | Episode 949", runtime: "YouTube", date: "YouTube", videoId: "KWn3uHMDCf4", image: "https://i.ytimg.com/vi/KWn3uHMDCf4/hqdefault.jpg" },
  { id: 18, title: "🚨Narratives EXPLAINED | QueenzFlip & Milfy? | Ice was Bangin? | Joe WALKS OFF❓🗂️", runtime: "YouTube", date: "YouTube", videoId: "ri9SYZpj6ug", image: "https://i.ytimg.com/vi/ri9SYZpj6ug/hqdefault.jpg" },
  { id: 17, title: "🚨Vado Side of the Story | DJ Khaled, Misa Hylton, & Mary J. Blidge TEA | Patreon Exclusive 🗂️", runtime: "YouTube", date: "YouTube", videoId: "fE11p3Fg4ck", image: "https://i.ytimg.com/vi/fE11p3Fg4ck/hqdefault.jpg" },
  { id: 1, title: "Durand Bernarr Vs Sexuality | Ish OPTED Out the LGBTQIA+ Conversation", runtime: "11:55", date: "YouTube", videoId: "Z1uHcI-CLKU", image: "https://i.ytimg.com/vi/Z1uHcI-CLKU/hqdefault.jpg" },
  { id: 2, title: "Ish Vs Marc Lamont Hill | Google/Meta, Jay-Z, Target Debate", runtime: "YouTube", date: "YouTube", videoId: "AgRCJavR-HY", image: "https://i.ytimg.com/vi/AgRCJavR-HY/hqdefault.jpg" },
  { id: 3, title: "TURMOIL at JBP | Joe Budden is DISGUSTED", runtime: "YouTube", date: "YouTube", videoId: "DUCJ4NcwbVs", image: "https://i.ytimg.com/vi/DUCJ4NcwbVs/hqdefault.jpg" },
  { id: 4, title: "Ace Hood VS DJ Khaled | We The Best BREAKUP", runtime: "YouTube", date: "YouTube", videoId: "gvQmxC80ydc", image: "https://i.ytimg.com/vi/gvQmxC80ydc/hqdefault.jpg" },
  { id: 5, title: "Vado SHOCKED the JBP | Tahiry & Ice Stories", runtime: "YouTube", date: "YouTube", videoId: "gy5vGYDa6Cs", image: "https://i.ytimg.com/vi/gy5vGYDa6Cs/hqdefault.jpg" },
  { id: 6, title: "Mona Goes OFF on Emanny | Jenise Hart Interview", runtime: "YouTube", date: "YouTube", videoId: "ZxP8EC4KoAw", image: "https://i.ytimg.com/vi/ZxP8EC4KoAw/hqdefault.jpg" },
  { id: 7, title: "Rick Ross LAYS IT DOWN | Drake & Meek Situations", runtime: "YouTube", date: "YouTube", videoId: "QmrXY0NpF0M", image: "https://i.ytimg.com/vi/QmrXY0NpF0M/hqdefault.jpg" },
  { id: 8, title: "DJ Akademiks VS Charlamagne EXPLAINED", runtime: "YouTube", date: "YouTube", videoId: "UGQ2OSZ2yts", image: "https://i.ytimg.com/vi/UGQ2OSZ2yts/hqdefault.jpg" },
  { id: 9, title: "HOV DID but Drake Couldn’t? JBP Concert Review", runtime: "YouTube", date: "YouTube", videoId: "uUQ-8D5XihE", image: "https://i.ytimg.com/vi/uUQ-8D5XihE/hqdefault.jpg" },
  { id: 10, title: "Michael Jai White VS Sensai Ja EXPLAINED", runtime: "YouTube", date: "YouTube", videoId: "KG1JdeI1BvM", image: "https://i.ytimg.com/vi/KG1JdeI1BvM/hqdefault.jpg" },
  { id: 11, title: "Sensai Ja SHAKING up the JBP | Breakfast Club", runtime: "YouTube", date: "YouTube", videoId: "BHcHIZbB9IY", image: "https://i.ytimg.com/vi/BHcHIZbB9IY/hqdefault.jpg" },
  { id: 12, title: "Ish gets MUFFIN CRACKED by Sensai Ja", runtime: "YouTube", date: "YouTube", videoId: "OSamtp3Rvrk", image: "https://i.ytimg.com/vi/OSamtp3Rvrk/hqdefault.jpg" },
  { id: 13, title: "The Dream Takes Shots at Industry People", runtime: "YouTube", date: "YouTube", videoId: "rUy_7_WuXKE", image: "https://i.ytimg.com/vi/rUy_7_WuXKE/hqdefault.jpg" },
  { id: 14, title: "Kino Childrey WENT TOO FAR | Parks Spilled the Beans", runtime: "YouTube", date: "YouTube", videoId: "KYWo5CjiQRY", image: "https://i.ytimg.com/vi/KYWo5CjiQRY/hqdefault.jpg" },
  { id: 15, title: "Mona & Marc the LAST Options? Joe Budden Dives In", runtime: "YouTube", date: "YouTube", videoId: "bmExvPi3lic", image: "https://i.ytimg.com/vi/bmExvPi3lic/hqdefault.jpg" },
  { id: 16, title: "QueenzFlip Highlights Streaming Negativity", runtime: "YouTube", date: "YouTube", videoId: "VCUrtNN3laU", image: "https://i.ytimg.com/vi/VCUrtNN3laU/hqdefault.jpg" },
];
const studioPackages = [
  ["Audio podcast session", "A clear, conversation-first recording session with professional capture."],
  ["Video podcast session", "A camera-ready recording session for full episodes, interviews, and visual clips."],
  ["Multi-camera production", "A larger production plan for panels, campaign work, and special conversations."],
] as const;
const consultingServices = [
  ["Podcast launch consultation", "Format, first episodes, rollout, and the systems needed to begin with purpose."],
  ["Content audit", "A practical review of what is landing, what is missing, and what to make next."],
  ["Media strategy session", "A focused creative rhythm for creators, shows, artists, and brands."],
] as const;

export default function FilesPlatform({ page }: { page: Page }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [media, setMedia] = useState<MediaItem[]>(fallbackMedia);
  const [mediaStatus, setMediaStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [notice, setNotice] = useState("");
  const shown = useMemo(() => media.filter(item => item.title.toLowerCase().includes(query.toLowerCase())), [media, query]);
  const go = (next: Page) => {
    router.push(pageRoutes[next]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => { fetch("/api/videos").then(response => response.ok ? response.json() as Promise<{ videos?: MediaItem[] }> : Promise.reject()).then(data => { if (data.videos?.length) { setMedia(data.videos); setMediaStatus("live"); } else { setMediaStatus("fallback"); } }).catch(() => setMediaStatus("fallback")); }, []);
  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selected]);

  return <main>
    <SiteNavigation />
    <div className="ticker">THE FILES <b>◆</b> QUEENS DESK <b>◆</b> AFTER HOURS <b>◆</b> KEEP THE RECORD</div>

    {page === "home" && <>
      <section className="hero"><div className="hero-copy"><p className="kicker">INDEPENDENT MEDIA / QUEENS, NY</p><h1>THE CULTURE<br /><em>KEEPS RECEIPTS.</em></h1><p>Every clip, conversation, studio craft, and moment worth filing — all under one roof.</p><div className="button-row"><a className="solid" href={shopifyStorefront} target="_blank" rel="noreferrer">Shop the drop ↗</a><button className="outline" onClick={() => go("studio")}>Book the studio</button></div><small>Shop live inventory and checkout through the official Files Shopify store.</small></div><div className="hero-art"><img src="/dub-mark.svg" alt="The Files With Dub brand mark" /><div className="file-stamp">THE FILES<br />WITH DUB<br /><b>001</b></div></div></section>
      <section className="panel light"><SectionTitle overline="LATEST FROM DUB" title={<>Open the <em>files.</em></>} copy="One source-aware feed for every clip published through The Files With Dub." /><MediaGrid items={media.slice(0, 3)} onSelect={setSelected} /><div className="center"><button className="solid" onClick={() => go("library")}>View every clip ↗</button></div></section>
      <section className="panel split dark"><div><p className="kicker">THE BUSINESS OF THE FILES</p><h2>One platform.<br /><em>Three ways in.</em></h2></div><div className="path-grid"><button onClick={() => go("studio")}><b>01</b><h3>Book studio time</h3><p>Explore the studio session options before booking through the official calendar.</p><span>Explore studio ↗</span></button><button onClick={() => go("consulting")}><b>02</b><h3>Build a media plan</h3><p>Choose a consulting lane and book the working session that fits your goals.</p><span>Explore consulting ↗</span></button><a href={shopifyStorefront} target="_blank" rel="noreferrer"><b>03</b><h3>Shop the drop</h3><p>Browse current products, inventory, and checkout in the official Shopify store.</p><span>Enter the shop ↗</span></a></div></section>
      <Newsletter />
    </>}

    {page === "library" && <section className="panel light library"><SectionTitle overline="THE FILES / ALL CLIPS" title={<>One feed.<br /><em>Every file.</em></>} copy="Every new Dub upload is pulled from YouTube automatically, with no category walls between posts." /><div className="library-tools unified-feed-tools"><p><b>{media.length}</b> clips · newest first · {mediaStatus === "live" ? "live YouTube updates" : mediaStatus === "loading" ? "checking for new posts" : "last known posts"}</p><label>Search every clip <input value={query} onChange={event => setQuery(event.target.value)} placeholder="title or guest" /></label></div><MediaGrid items={shown} onSelect={setSelected} /><div className="source-note">Every card is sourced from The Files With Dub’s public YouTube channel, refreshes automatically as Dub posts, keeps its source attribution, and plays in the on-site player. Outside carries the current New York nightlife calendar and playlist.</div></section>}


    {page === "files" && <section className="panel files live-files"><SectionTitle overline="OUTSIDE / NYC NIGHTS" title={<>New York<br /><em>after dark.</em></>} copy="A living guide to nightlife, music, and culture—sourced from Eventbrite’s New York nightlife listings." /><div className="live-files-grid"><NightlifeCalendar /><ApplePlaylist /></div><div className="event-promo"><div><p className="kicker">PUT IT ON THE RECORD</p><h3>Promoting an event<br /><em>in New York?</em></h3><p>Send the details to The Files for upcoming calendar consideration.</p></div><button className="solid" onClick={() => go("contact")}>Promote your next event ↗</button></div></section>}

    {page === "studio" && <StudioBooking />}
    {page === "consulting" && <ConsultingFlow />}
    {page === "about" && <section className="panel about"><div><p className="kicker">ABOUT THE FILES</p><h1>MEDIA WITH<br /><em>A MEMORY.</em></h1><p>The Files With Dub is an independent platform for culture, commentary, interviews, and production — built to keep the real conversation in view.</p><p>The Files logo is now a Files-only mark, free of discontinued program references.</p><button className="solid" onClick={() => go("contact")}>Work with the Files ↗</button></div><img src="/dub-jacket.png" alt="The Files With Dub portrait in a Dub jacket" /></section>}

    {page === "contact" && <section className="panel light contact"><SectionTitle overline="CONTACT" title={<>Find the right<br /><em>way in.</em></>} copy="Choose a path and the form adapts to its purpose." /><form onSubmit={event => { event.preventDefault(); setNotice("Message prepared locally. Connect an approved inbox or CRM to deliver it."); }}><select defaultValue=""><option disabled value="">What is this about?</option><option>General inquiry</option><option>Event promotion</option><option>Studio booking</option><option>Consulting</option><option>Guest submission</option><option>Sponsorship or partnership</option><option>Press or media</option><option>Order support</option></select><div className="form-grid"><input required placeholder="Name" /><input required type="email" placeholder="Email" /></div><input placeholder="Organization or brand (optional)" /><textarea required placeholder="How can we help?" /><label className="check"><input type="checkbox" required /> I agree to have this inquiry routed to the relevant team workflow.</label><button className="solid">Prepare message ↗</button></form><div className="contact-card"><p className="kicker">SOCIAL / SOURCE CHANNELS</p><a href={channel} target="_blank" rel="noreferrer">YouTube: The Files With Dub ↗</a><a href={patreon} target="_blank" rel="noreferrer">Patreon: DUB ↗</a><a href={xProfile} target="_blank" rel="noreferrer">X: @TheFilesWithDUB ↗</a><button className="text-button" onClick={() => go("tip")}>Share information with The Files ↗</button></div></section>}

    {page === "tip" && <section className="panel light contact"><SectionTitle overline="THE TIP LINE" title={<>Share what<br /><em>you know.</em></>} copy="Have context, a lead, or information that belongs in the conversation? Send it to The Files for review." /><form onSubmit={event => { event.preventDefault(); setNotice("Your tip was prepared locally. A secure intake service is required before delivery can be enabled."); }}><p className="kicker">SHARE INFORMATION</p><textarea required placeholder="What should The Files know? Include useful context, dates, and relevant details." /><input type="url" placeholder="Source or reference link (optional)" /><input placeholder="How can we follow up? (optional)" /><label className="check"><input type="checkbox" required /> I understand this is not currently a secure or anonymous reporting channel and I should not include sensitive personal information.</label><button className="solid">Prepare tip ↗</button></form><div className="contact-card"><p className="kicker">BEFORE YOU SHARE</p><p>Do not submit urgent safety concerns, private records, passwords, financial details, or information that could put someone at risk.</p><p>A secure, owner-approved workflow is required before public submissions can be delivered.</p></div></section>}

    <footer><Link className="files-logo" href="/"><span className="files-logo-seal">TF</span><span><strong>THE FILES</strong><em>WITH DUB</em></span></Link><p>© {new Date().getFullYear()} The Files With Dub</p><div className="footer-links"><a href={patreon} target="_blank" rel="noreferrer">Support on Patreon ↗</a><Link href="/broadcasts">X Broadcast archive</Link><Link href="/affiliate">Affiliate links</Link><button aria-label="Policies and accessibility information pending review" onClick={() => setNotice("Policies & accessibility information is pending owner review; this notice is not a published policy.")}>Policies pending review</button></div></footer>
    {selected && <div className="modal-bg" role="dialog" aria-modal="true" aria-label={`Playing ${selected.title}`}><div className="modal"><button className="close" onClick={() => setSelected(null)} aria-label="Close player">×</button><div className="embed"><iframe src={`https://www.youtube-nocookie.com/embed/${selected.videoId}?autoplay=1&rel=0`} title={selected.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" loading="eager" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div><p className="kicker">THE FILES / YOUTUBE</p><h2>{selected.title}</h2><p>{selected.runtime} · {selected.date}</p><a className="solid" href={`https://www.youtube.com/watch?v=${selected.videoId}`} target="_blank" rel="noreferrer">Open on YouTube ↗</a></div></div>}
    {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notice">×</button></div>}
  </main>;
}

function SectionTitle({ overline, title, copy }: { overline: string; title: React.ReactNode; copy: string }) { return <div className="section-title"><div><p className="kicker">{overline}</p><h2>{title}</h2></div><p>{copy}</p></div>; }
function NightlifeCalendar() { const [events, setEvents] = useState<Array<{ title: string; when: string; venue: string; note: string; href: string }>>([]); const [loaded, setLoaded] = useState(false); useEffect(() => { fetch("/api/nightlife").then(response => response.ok ? response.json() as Promise<{ events?: Array<{ title: string; when: string; venue: string; note: string; href: string }> }> : Promise.reject()).then(data => setEvents(data.events ?? [])).catch(() => setEvents([])).finally(() => setLoaded(true)); }, []); return <div className="nightlife-calendar"><div className="nightlife-heading"><p className="kicker">ON THE CALENDAR</p><p>Fresh listings from Eventbrite’s New York nightlife page.</p></div>{events.length ? <div className="nightlife-list">{events.map(event => <a href={event.href} target="_blank" rel="noreferrer" key={event.href}><div><span>{event.when}</span><h3>{event.title}</h3><p>{event.venue}</p></div><b>{event.note} <i>↗</i></b></a>)}</div> : <p className="calendar-empty">{loaded ? "The live listings are being refreshed. Browse the full current calendar on Eventbrite." : "Loading the current New York nightlife listings…"}</p>}<a className="outline nightlife-more" href="https://www.eventbrite.com/b/ny--new-york/nightlife/" target="_blank" rel="noreferrer">See more NYC nightlife ↗</a></div>; }
function ApplePlaylist() { return <aside className="apple-playlist"><p className="kicker">NOW PLAYING</p><h3>Top 25<br /><em>New York City.</em></h3><p>Play the playlist right here. Apple Music may request sign-in for full-track playback.</p><iframe src="https://embed.music.apple.com/us/playlist/top-25-new-york-city/pl.a88b5c26caea48a59484370b6f79c9df" title="Top 25 New York City playlist on Apple Music" allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" loading="lazy" /></aside>; }
function MediaGrid({ items, onSelect }: { items: MediaItem[]; onSelect: (item: MediaItem) => void }) { return <div className="media-grid">{items.map(item => <button className="media-card" key={item.id} onClick={() => onSelect(item)} aria-label={`Play ${item.title}`}><div><img src={item.image} alt={`Thumbnail for ${item.title}`} loading="lazy" decoding="async" /><span>▶</span><small>THE FILES / YOUTUBE</small></div><p>{item.date} · {item.runtime}</p><h3>{item.title}</h3><b>Play clip ↗</b></button>)}</div>; }
function Newsletter() { return <section className="newsletter" aria-labelledby="dispatch-title"><div><p className="kicker">THE DISPATCH</p><h2 id="dispatch-title">Stay in<br /><em>the files.</em></h2><p>Get the latest interviews, releases, events, and studio updates.</p></div><div className="newsletter-pending" role="status"><p className="kicker">SIGN-UPS NOT ACTIVE</p><p>The Dispatch is not accepting sign-ups yet. No newsletter information is collected or sent from this form.</p></div></section>; }
function StudioBooking() { return <section className="panel light studio-page"><SectionTitle overline="THE STUDIO / SCHEDULING" title={<>Bring the story<br /><em>into focus.</em></>} copy="Choose a session type, then reserve available time through the official studio calendar." /><div className="studio-grid"><div className="studio-art"><img src="/dub-studio-mockup.png" alt="Podcast and video production studio mockup" /><div>THE FILES STUDIO<br /><b>PRODUCTION-READY</b></div></div><div className="stack">{studioPackages.map(([name, copy]) => <article className="service-line" key={name}><h3>{name}</h3><p>{copy}</p></article>)}<ScheduleDestination kind="studio" /></div></div></section>; }
function ConsultingFlow() { return <section className="panel consulting-page"><SectionTitle overline="DUB CONSULTING / SCHEDULING" title={<>Make the media<br /><em>make sense.</em></>} copy="Choose the working session that fits your goals, then select a time through the official consulting calendar." /><div className="service-grid">{consultingServices.map(([name, copy], index) => <article className="consult-card" key={name}><b>0{index + 1}</b><h3>{name}</h3><p>{copy}</p></article>)}</div><ScheduleDestination kind="consulting" /></section>; }
function ScheduleDestination({ kind }: { kind: "studio" | "consulting" }) { const label = kind === "studio" ? "Book studio time" : "Book a consulting session"; return <div className="schedule-destination"><a className="solid" href={calendlyHome} target="_blank" rel="noreferrer">{label} ↗</a><p>Select the matching session type on Dub’s official Calendly page.</p></div>; }
