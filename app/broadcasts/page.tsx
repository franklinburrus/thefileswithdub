"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import HlsVideo from "../components/hls-video";
import SiteNavigation from "../components/site-navigation";
import { xBroadcasts, type XBroadcastReplay } from "../lib/x-broadcasts";

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState<XBroadcastReplay[]>(
    xBroadcasts.map(broadcast => ({ ...broadcast, hlsUrl: null })),
  );
  const [selectedId, setSelectedId] = useState(xBroadcasts[0].id);
  const [archiveStatus, setArchiveStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const selected = broadcasts.find(broadcast => broadcast.id === selectedId) ?? broadcasts[0];

  useEffect(() => {
    fetch("/api/x-broadcasts")
      .then(response => response.ok ? response.json() as Promise<{ broadcasts?: XBroadcastReplay[] }> : Promise.reject())
      .then(data => {
        if (!data.broadcasts?.length) throw new Error("No replay sources");
        setBroadcasts(data.broadcasts);
        setArchiveStatus("ready");
      })
      .catch(() => {
        setBroadcasts(xBroadcasts.map(broadcast => ({ ...broadcast, hlsUrl: null })));
        setArchiveStatus("unavailable");
      });
  }, []);

  return <><SiteNavigation /><main className="panel light broadcasts-page">
    <p className="kicker">THE FILES WITH DUB / X BROADCASTS</p>
    <h1 className="broadcast-title">Can’t DUB Me <em>Radio.</em></h1>
    <p>Watch Dub’s public X broadcast replays directly inside The Files.</p>
    <section className="broadcast-viewer" aria-label="Selected X broadcast">
      <div className="broadcast-toolbar">
        <div>
          <p className="kicker">NOW PLAYING / X REPLAY</p>
          <h2>{selected.title}</h2>
        </div>
        <span className="broadcast-source-state">{archiveStatus === "loading" ? "Resolving replay…" : archiveStatus === "ready" ? "Files-native playback" : "Archive source unavailable"}</span>
      </div>
      {archiveStatus === "loading"
        ? <div className="broadcast-player"><Image src={selected.poster} alt="" fill priority sizes="(max-width: 760px) 100vw, 82vw" unoptimized /><div className="broadcast-player-status" role="status">Loading the Files replay…</div></div>
        : <HlsVideo key={selected.id} src={selected.hlsUrl} poster={selected.poster} title={selected.title} />}
    </section>
    <div className="broadcast-list">
      {broadcasts.map((broadcast, index) => <button className={broadcast.id === selected.id ? "active" : ""} key={broadcast.id} onClick={() => setSelectedId(broadcast.id)} aria-pressed={broadcast.id === selected.id}>
        <Image src={broadcast.poster} alt="" width={360} height={203} unoptimized />
        <span>REPLAY {String(index + 1).padStart(2, "0")}</span>
        <h2>{broadcast.title}</h2>
        <b>{broadcast.hlsUrl === null && archiveStatus !== "loading" ? "Source unavailable" : "Play replay"}</b>
      </button>)}
    </div>
    <p className="broadcast-note">Playback stays inside The Files. If a public source replay disappears, that broadcast remains listed with a clear unavailable state.</p>
    <Link className="outline" href="/">Back to The Files</Link>
  </main></>;
}
