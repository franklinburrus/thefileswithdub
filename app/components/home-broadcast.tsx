"use client";

import Image from "next/image";
import HlsVideo from "./hls-video";
import { useBroadcastReplays } from "./use-broadcast-replays";
import { displayTitleFor, xBroadcasts } from "../lib/x-broadcasts";

export default function HomeBroadcast() {
  const { broadcasts, archiveStatus } = useBroadcastReplays();
  const selected = broadcasts[0];
  const loading = archiveStatus === "loading";
  const title = selected ? displayTitleFor(selected) : loading ? displayTitleFor(xBroadcasts[0]) : "X broadcast replays";

  return <section className="panel light" aria-label="Latest X broadcast">
    <div className="broadcast-viewer">
      <div className="broadcast-toolbar">
        <div><p className="kicker">LATEST / X REPLAY</p><h2>{title}</h2></div>
        <span className="broadcast-source-state">{loading ? "Resolving replay…" : selected ? "Files-native playback" : "Replay unavailable"}</span>
      </div>
      {selected
        ? <HlsVideo key={selected.id} src={selected.hlsUrl} poster={selected.poster} title={title} sourceVerified={!!selected.sourceUrl} autoPlay />
        : <div className="broadcast-player">
          {loading && <Image src={xBroadcasts[0].poster} alt="" fill sizes="(max-width: 760px) 100vw, 82vw" unoptimized />}
          <div className="broadcast-player-status" role="status">{loading ? "Loading the Files replay…" : archiveStatus === "unavailable" ? "Replays could not be loaded. Please try again later." : "No public replays are available right now."}</div>
        </div>}
    </div>
  </section>;
}
