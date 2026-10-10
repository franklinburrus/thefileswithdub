"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

type PlaybackState = "loading" | "ready" | "unavailable";

export default function HlsVideo({ src, poster, title, sourceVerified, autoPlay = false }: { src: string | null | undefined; poster: string; title: string; sourceVerified: boolean; autoPlay?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<PlaybackState>(src ? "loading" : "unavailable");
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) {
      setState("unavailable");
      return;
    }

    setState("loading");
    setAutoplayBlocked(false);
    let playbackRequested = false;
    const ready = () => {
      setState("ready");
      if (autoPlay && !playbackRequested) {
        playbackRequested = true;
        video.muted = true;
        void video.play().catch(error => {
          if (error.name === "NotAllowedError") setAutoplayBlocked(true);
        });
      }
    };
    const unavailable = () => setState("unavailable");
    video.addEventListener("loadedmetadata", ready);
    video.addEventListener("error", unavailable);

    let hls: Hls | null = null;
    // Chrome's native HLS can reject replay timestamps that Hls.js remuxes.
    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, ready);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) unavailable();
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else {
      queueMicrotask(unavailable);
    }

    return () => {
      video.removeEventListener("loadedmetadata", ready);
      video.removeEventListener("error", unavailable);
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, autoPlay]);

  return <div className="broadcast-player">
    <video ref={videoRef} controls playsInline preload="metadata" autoPlay={autoPlay} muted={autoPlay} poster={poster} aria-label={`Play ${title}`} onPlay={() => setAutoplayBlocked(false)} />
    {state === "loading" && <div className="broadcast-player-status" role="status">Loading the Files replay…</div>}
    {state === "ready" && autoplayBlocked && <div className="broadcast-player-status"><button className="outline" onClick={() => { void videoRef.current?.play().catch(() => setAutoplayBlocked(true)); }}>Play broadcast</button></div>}
    {state === "unavailable" && <div className="broadcast-player-status unavailable" role="status"><b>{sourceVerified ? "Replay temporarily unavailable." : "Archive entry."}</b><span>{sourceVerified ? "The Files will keep this broadcast in the archive and restore playback if the source returns." : "No verified playable source is available for this archive entry."}</span></div>}
  </div>;
}
