"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import HlsVideo from "../components/hls-video";
import { useBroadcastReplays } from "../components/use-broadcast-replays";
import SiteNavigation from "../components/site-navigation";
import { xBroadcasts, displayTitleFor, type XBroadcastReplay } from "../lib/x-broadcasts";
import { SITE_URL, safeJsonLd } from "../seo";

export default function Broadcasts() {
  const { broadcasts, archiveStatus } = useBroadcastReplays();
  const [selection, setSelection] = useState<XBroadcastReplay | null>(null);
  const selectedId = selection?.id ?? null;
  const viewerRef = useRef<HTMLElement>(null);
  const openingReplay = useRef(false);
  const selected = selection ?? broadcasts.find(item => item.hlsUrl) ?? broadcasts[0]
    ?? (archiveStatus === "loading" ? { ...xBroadcasts[0], hlsUrl: null } : undefined);

  function openReplay(id: string) {
    if (id === selected?.id) {
      setSelection(selected);
      revealPlayer();
    } else {
      openingReplay.current = true;
      setSelection(broadcasts.find(item => item.id === id) ?? null);
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
    itemListElement: broadcasts.filter(item => item.hlsUrl).map((broadcast, index) => ({
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
    {archiveStatus !== "loading" && broadcasts.some(item => item.hlsUrl) && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(archiveStructuredData) }} />}
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
        : selected.hlsUrl ? <HlsVideo key={selected.id} src={selected.hlsUrl} poster={selected.poster} title={displayTitleFor(selected)} sourceVerified={!!selected.sourceUrl} onPlaybackStart={() => setSelection(selected)} /> : <p role="status">Playback is currently unavailable.{selected.sourceUrl && <> <a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open on X ↗</a></>}</p>}
    </section>}
    {!selected && <p role="status">{archiveStatus === "unavailable" ? "Replays could not be loaded. Please try again later." : "No public replays are available right now."}</p>}
    {archiveStatus === "degraded" && <p role="status">Showing the last verified archive while updates recover.</p>}
    <div className="broadcast-list">
      {archiveStatus !== "loading" && broadcasts.map((broadcast, index) => <article className="broadcast-card" key={broadcast.id}>
        {broadcast.hlsUrl ? <button className={broadcast.id === selected?.id ? "active" : ""} onClick={() => openReplay(broadcast.id)} aria-pressed={broadcast.id === selected?.id}>
          <Image src={broadcast.poster} alt="" width={360} height={203} unoptimized />
          <span>REPLAY {String(index + 1).padStart(2, "0")}</span><h2>{displayTitleFor(broadcast)}</h2><b>Open replay</b>
        </button> : <>
          <Image src={broadcast.poster} alt="" width={360} height={203} unoptimized />
          <span>{broadcast.sourceUrl?.includes("/spaces/") ? "X SPACE" : "ARCHIVE"}</span><h2>{displayTitleFor(broadcast)}</h2>
          {broadcast.sourceUrl ? <a className="outline" href={broadcast.sourceUrl} target="_blank" rel="noreferrer">Open on X ↗</a> : <p>Source unavailable</p>}
        </>}
      </article>)}
    </div>
    <p className="broadcast-note">Available replays play inside The Files. Spaces and unavailable sources retain their archive links.</p>
    <Link className="outline" href="/">Back to The Files</Link>
  </main></>;
}
