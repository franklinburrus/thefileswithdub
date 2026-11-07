"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

type PlaybackState = "loading" | "ready" | "unavailable";

export default function HlsVideo({ src, poster, title, sourceVerified, autoPlay = false, onUnavailable, onProgress, onPlaybackStart }: { onPlaybackStart?: () => void; onUnavailable?: () => void; onProgress?: () => void; src: string | null | undefined; poster: string; title: string; sourceVerified: boolean; autoPlay?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<PlaybackState>(src ? "loading" : "unavailable");
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const callbacks = useRef({ onUnavailable, onProgress, onPlaybackStart });
  useEffect(() => { callbacks.current = { onUnavailable, onProgress, onPlaybackStart }; }, [onUnavailable, onProgress, onPlaybackStart]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) {
      setState("unavailable");
      return;
    }

    setState("loading");
    setAutoplayBlocked(false);
    let playbackRequested = false;
    let blocked = false;
    let failed = false;
    let disposed = false;
    let progressed = false;
    let previousTime = video.currentTime;
    let previousSample = performance.now();
    const unavailable = () => {
      if (failed || disposed) return;
      failed = true;
      setState("unavailable");
      callbacks.current.onUnavailable?.();
    };
    const advancing = () => {
      const now = performance.now();
      if (!video.paused && !video.seeking && video.readyState >= 2 && video.videoWidth > 0
        && video.currentTime > previousTime + 0.05 && now - previousSample >= 100 && !progressed) {
        progressed = true;
        callbacks.current.onProgress?.();
      }
      if (now - previousSample >= 100) {
        previousTime = video.currentTime;
        previousSample = now;
      }
    };
    // A gesture-denied autoplay remains available for the visitor to start.
    const deadline = autoPlay ? setTimeout(() => { if (!progressed && !blocked) unavailable(); }, 25_000) : undefined;
    const ready = () => {
      setState("ready");
      if (autoPlay && !playbackRequested) {
        playbackRequested = true;
        video.muted = true;
        void video.play().catch(error => {
          if (error.name === "NotAllowedError") { blocked = true; setAutoplayBlocked(true); }
          else if (error.name !== "AbortError") unavailable();
        });
      }
    };
    video.addEventListener("loadedmetadata", ready);
    video.addEventListener("error", unavailable);
    video.addEventListener("timeupdate", advancing);

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
      disposed = true;
      clearTimeout(deadline);
      video.removeEventListener("timeupdate", advancing);
      video.removeEventListener("loadedmetadata", ready);
      video.removeEventListener("error", unavailable);
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, autoPlay]);

  return <div className="broadcast-player">
    <video ref={videoRef} controls playsInline preload="metadata" autoPlay={autoPlay} muted={autoPlay} poster={poster} aria-label={`Play ${title}`} onPlay={() => { setAutoplayBlocked(false); callbacks.current.onPlaybackStart?.(); }} />
    {state === "loading" && <div className="broadcast-player-status" role="status">Loading the Files replay…</div>}
    {state === "ready" && autoplayBlocked && <div className="broadcast-player-status"><button className="outline" onClick={() => { void videoRef.current?.play().catch(() => setAutoplayBlocked(true)); }}>Play broadcast</button></div>}
    {state === "unavailable" && <div className="broadcast-player-status unavailable" role="status"><b>{sourceVerified ? "Replay temporarily unavailable." : "Archive entry."}</b><span>{sourceVerified ? "The Files will keep this broadcast in the archive and restore playback if the source returns." : "No verified playable source is available for this archive entry."}</span></div>}
  </div>;
}
