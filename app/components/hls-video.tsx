"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

type PlaybackState = "loading" | "ready" | "unavailable";

export default function HlsVideo({ src, poster, title }: { src: string | null | undefined; poster: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<PlaybackState>(src ? "loading" : "unavailable");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) {
      setState("unavailable");
      return;
    }

    setState("loading");
    const ready = () => setState("ready");
    const unavailable = () => setState("unavailable");
    video.addEventListener("loadedmetadata", ready);
    video.addEventListener("error", unavailable);

    let hls: Hls | null = null;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, ready);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) unavailable();
      });
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
  }, [src]);

  return <div className="broadcast-player">
    <video ref={videoRef} controls playsInline preload="metadata" poster={poster} aria-label={`Play ${title}`} />
    {state === "loading" && <div className="broadcast-player-status" role="status">Loading the Files replay…</div>}
    {state === "unavailable" && <div className="broadcast-player-status unavailable" role="status"><b>Replay temporarily unavailable.</b><span>The Files will keep this broadcast in the archive and restore playback if the source returns.</span></div>}
  </div>;
}
