"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import HlsVideo from "./hls-video";
import { useBroadcastReplays } from "./use-broadcast-replays";
import { displayTitleFor, xBroadcasts, type XBroadcastReplay } from "../lib/x-broadcasts";

export default function HomeBroadcast() {
  const { broadcasts, archiveStatus } = useBroadcastReplays();
  const candidates = useMemo(() => broadcasts.filter(item => item.hlsUrl && item.sourceUrl?.includes("/broadcasts/")).slice(0, 5), [broadcasts]);
  const [playing, setPlaying] = useState<XBroadcastReplay | null>(null);
  const [failed, setFailed] = useState<{ snapshot: XBroadcastReplay[]; ids: string[] }>({ snapshot: [], ids: [] });
  const failedIds = failed.snapshot === broadcasts ? failed.ids : [];
  const [verified, setVerified] = useState(false);
  // Freeze a verified playing source during polling; new visitors start newest.
  const selected = playing ?? candidates.find(item => !failedIds.includes(item.id)) ?? null;
  const unavailable = useCallback(() => {
    if (!selected) return;
    setFailed(previous => ({ snapshot: broadcasts, ids: [...(previous.snapshot === broadcasts ? previous.ids : []), selected.id] }));
    setPlaying(null);
    setVerified(false);
  }, [selected, broadcasts]);
  const progressing = useCallback(() => { setVerified(true); setPlaying(selected); }, [selected]);
  const loading = archiveStatus === "loading";
  const title = selected ? displayTitleFor(selected) : loading ? displayTitleFor(xBroadcasts[0]) : "X broadcast replays";
  return <section className="panel light" aria-label="Latest X broadcast">
    <div className="broadcast-viewer">
      <div className="broadcast-toolbar">
        <div><p className="kicker">LATEST / X REPLAY</p><h2>{title}</h2></div>
        <span className="broadcast-source-state">{loading ? "Resolving replay…" : selected ? verified ? "Files-native playback" : "Checking playback…" : "Replay unavailable"}</span>
      </div>
      {selected
        ? <HlsVideo key={selected.id} src={selected.hlsUrl} poster={selected.poster} title={title} sourceVerified autoPlay onUnavailable={unavailable} onProgress={progressing} />
        : <div className="broadcast-player">
          {loading && <Image src={xBroadcasts[0].poster} alt="" fill sizes="(max-width: 760px) 100vw, 82vw" unoptimized />}
          <div className="broadcast-player-status" role="status">{loading ? "Loading the Files replay…" : archiveStatus === "unavailable" ? "Replays could not be loaded. Please try again later." : "No public replays are available right now."}</div>
        </div>}
    </div>
  </section>;
}
