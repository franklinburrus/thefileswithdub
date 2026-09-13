"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (container: HTMLElement, options: { sitekey: string; action: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => string;
  remove?: (widgetId: string) => void;
};

declare global {
  interface Window { turnstile?: TurnstileApi; }
}

export default function TurnstileWidget({ sitekey, action, onToken }: { sitekey: string; action: string; onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sitekey || !containerRef.current) return;
    let cancelled = false;
    const mount = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetRef.current) return;
      widgetRef.current = window.turnstile.render(containerRef.current, {
        sitekey,
        action,
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    };
    if (window.turnstile) mount();
    else {
      const script = document.querySelector<HTMLScriptElement>("script[data-turnstile]") ?? document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.turnstile = "true";
      script.addEventListener("load", mount, { once: true });
      if (!script.parentNode) document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
      if (widgetRef.current && window.turnstile?.remove) window.turnstile.remove(widgetRef.current);
      widgetRef.current = null;
    };
  }, [action, onToken, sitekey]);

  return sitekey ? <div ref={containerRef} aria-label="Bot verification" /> : <p className="form-message">Verification is not configured for this environment.</p>;
}
