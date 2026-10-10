"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import HlsVideo from "../components/hls-video";
import SiteNavigation from "../components/site-navigation";
import { xBroadcasts, displayTitleFor, type XBroadcastReplay } from "../lib/x-broadcasts";

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState<XBroadcastReplay[]>(
    xBroadcasts.map(broadcast => ({ ...broadcast, hlsUrl: null })),
  );
  const [selectedId, setSelectedId] = useState(xBroadcasts[0].id);
  const [archiveStatus, setArchiveStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const viewerRef = useRef<HTMLElement>(null);
  const selected = broadcasts.find(broadcast => broadcast.id === selectedId) ?? broadcasts[0];

  function openReplay(id: string) {
    setSelectedId(id);
    // A card opens the shared player. Keep its native play control visible
    // and available for the direct user gesture required by some browsers.
    viewerRef.current?.focus({ preventScroll: true });
    viewerRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }

  useEffect(() => {
    fetch("/api/x-broadcasts")
      .then(response => response.ok ? response.json() as Promise<{ broadcasts?: XBroadcastReplay[] }> : Promise.reject())
      .then(data => {
        if (!data.broadcasts?.length) throw new Error("No replay sources");
        // The API/edge cache may still hold a previous release's metadata.
        // Keep this release's verified titles, sources and cover URLs; only
        // replay availability is supplied by the durable catalog response.
        const replayUrls = new Map(data.broadcasts.map(broadcast => [broadcast.id, broadcast.hlsUrl]));
        setBroadcasts(xBroadcasts.map(broadcast => ({
          ...broadcast,
          hlsUrl: broadcast.sourceUrl ? replayUrls.get(broadcast.id) ?? null : null,
        })));
        setArchiveStatus("ready");
      })
      .catch(() => {
        setBroadcasts(xBroadcasts.map(broadcast => ({ ...broadcast, hlsUrl: null })));
        setArchiveStatus("unavailable");
      });
  }, []);

  return <><SiteNavigation /><main id="main-content" className="panel light broadcasts-page">
    <p className="kicker">THE FILES WITH DUB / X BROADCASTS</p>
    <h1 className="broadcast-title">Can’t DUB Me <em>Radio.</em></h1>
    <p>Watch Dub’s public X broadcast replays directly inside The Files. Open a replay below, then press play in the player.</p>
    <section ref={viewerRef} className="broadcast-viewer" aria-label="Selected X broadcast" tabIndex={-1}>
      <div className="broadcast-toolbar">
        <div>
          <p className="kicker">SELECTED / X ARCHIVE</p>
          <h2>{displayTitleFor(selected)}</h2>
        </div>
        <span className="broadcast-source-state">{archiveStatus === "loading" ? "Resolving replay…" : selected.hlsUrl ? "Files-native playback" : selected.sourceUrl ? "Replay unavailable here" : "Archive only — replay source unverified"}</span>
      </div>
      {archiveStatus === "loading"
        ? <div className="broadcast-player"><Image src={selected.poster} alt={displayTitleFor(selected)} fill priority sizes="(max-width: 760px) 100vw, 82vw" unoptimized /><div className="broadcast-player-status" role="status">Loading the Files replay…</div></div>
        : <HlsVideo key={selected.id} src={selected.hlsUrl} poster={selected.poster} title={displayTitleFor(selected)} sourceVerified={!!selected.sourceUrl} />}
    </section>
    {archiveStatus !== "loading" && !selected.hlsUrl && selected.sourceUrl && <p><a className="outline" href={selected.sourceUrl} target="_blank" rel="noreferrer">Check the original on X ↗</a></p>}
    <div className="broadcast-list">
      {broadcasts.map((broadcast, index) => <button className={broadcast.id === selected.id ? "active" : ""} key={broadcast.id} onClick={() => openReplay(broadcast.id)} aria-pressed={broadcast.id === selected.id}>
        <Image src={broadcast.poster} alt={displayTitleFor(broadcast)} width={360} height={203} unoptimized />
        <span>REPLAY {String(index + 1).padStart(2, "0")}</span>
        <h2>{displayTitleFor(broadcast)}</h2>
        <b>{archiveStatus === "loading" ? "Checking replay…" : broadcast.hlsUrl ? "Open replay" : broadcast.sourceUrl ? "Replay unavailable here" : "Archive only"}</b>
      </button>)}
    </div>
    <p className="broadcast-note">Playback stays inside The Files. If a public source replay disappears, that broadcast remains listed with a clear unavailable state.</p>
    <Link className="outline" href="/">Back to The Files</Link>
  </main></>;
}
