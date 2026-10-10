"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import HlsVideo from "../components/hls-video";
import { useBroadcastReplays } from "../components/use-broadcast-replays";
import SiteNavigation from "../components/site-navigation";
import { xBroadcasts, displayTitleFor } from "../lib/x-broadcasts";
import { SITE_URL, safeJsonLd } from "../seo";

export default function Broadcasts() {
  const { broadcasts, archiveStatus } = useBroadcastReplays();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const viewerRef = useRef<HTMLElement>(null);
  const openingReplay = useRef(false);
  const selected = broadcasts.find(broadcast => broadcast.id === selectedId) ?? broadcasts[1] ?? broadcasts[0]
    ?? (archiveStatus === "loading" ? { ...(xBroadcasts[1] ?? xBroadcasts[0]), hlsUrl: null } : undefined);

  function openReplay(id: string) {
    if (id === selected?.id) {
      revealPlayer();
    } else {
      openingReplay.current = true;
      setSelectedId(id);
    }
  }

  function revealPlayer() {
    // A card opens the shared player. Keep its native play control visible
    // and available for the direct user gesture required by some browsers.
    viewerRef.current?.focus({ preventScroll: true });
    viewerRef.current?.scrollIntoView({ block: "end", behavior: "instant" });
  }

  useEffect(() => {
    if (!openingReplay.current) return;
    openingReplay.current = false;
    revealPlayer();
  }, [selectedId]);

  const archiveStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "X Broadcast Replays — The Files With Dub",
    url: `${SITE_URL}/broadcasts`,
    itemListElement: broadcasts.map((broadcast, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "VideoObject",
        name: displayTitleFor(broadcast),
        thumbnailUrl: broadcast.poster.startsWith("/") ? `${SITE_URL}${broadcast.poster}` : broadcast.poster,
        ...(broadcast.date ? { uploadDate: broadcast.date } : {}),
        embedUrl: `${SITE_URL}/broadcasts`,
      },
    })),
  };

  return <><SiteNavigation /><main id="main-content" className="panel light broadcasts-page">
    {archiveStatus === "ready" && broadcasts.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(archiveStructuredData) }} />}
    <p className="kicker">THE FILES WITH DUB / X BROADCASTS</p>
    <h1 className="broadcast-title">Can’t DUB Me <em>Radio.</em></h1>
    <p>Watch Dub’s public X broadcast replays directly inside The Files. Open a replay below, then press play in the player.</p>
    {selected && <section ref={viewerRef} className="broadcast-viewer" aria-label="Selected X broadcast" tabIndex={-1}>
      <div className="broadcast-toolbar">
        <div>
          <p className="kicker">SELECTED / X ARCHIVE</p>
          <h2>{displayTitleFor(selected)}</h2>
        </div>
        <span className="broadcast-source-state">{archiveStatus === "loading" ? "Resolving replay…" : "Files-native playback"}</span>
      </div>
      {archiveStatus === "loading"
        ? <div className="broadcast-player"><Image src={selected.poster} alt={displayTitleFor(selected)} fill priority sizes="(max-width: 760px) 100vw, 82vw" unoptimized /><div className="broadcast-player-status" role="status">Loading the Files replay…</div></div>
        : <HlsVideo key={selected.id} src={selected.hlsUrl} poster={selected.poster} title={displayTitleFor(selected)} sourceVerified={!!selected.sourceUrl} />}
    </section>}
    {!selected && <p role="status">{archiveStatus === "unavailable" ? "Replays could not be loaded. Please try again later." : "No public replays are available right now."}</p>}
    <div className="broadcast-list">
      {archiveStatus === "ready" && broadcasts.map((broadcast, index) => <button className={broadcast.id === selected?.id ? "active" : ""} key={broadcast.id} onClick={() => openReplay(broadcast.id)} aria-pressed={broadcast.id === selected?.id}>
        <Image src={broadcast.poster} alt={displayTitleFor(broadcast)} width={360} height={203} unoptimized />
        <span>REPLAY {String(index + 1).padStart(2, "0")}</span>
        <h2>{displayTitleFor(broadcast)}</h2>
        <b>Open replay</b>
      </button>)}
    </div>
    <p className="broadcast-note">Playback stays inside The Files. Only available public replays are shown.</p>
    <Link className="outline" href="/">Back to The Files</Link>
  </main></>;
}
