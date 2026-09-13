"use client";

import { useCallback, useEffect, useState } from "react";
import TurnstileWidget from "./turnstile-widget";

function useFormsEnabled() {
  const [enabled, setEnabled] = useState(false);
  const [sitekey, setSitekey] = useState("");
  useEffect(() => {
    fetch("/api/forms/status").then(response => response.ok ? response.json() as Promise<{ enabled?: boolean; sitekey?: string }> : Promise.reject()).then(data => { setEnabled(data.enabled === true); setSitekey(typeof data.sitekey === "string" ? data.sitekey : ""); }).catch(() => { setEnabled(false); setSitekey(""); });
  }, []);
  return { enabled, sitekey };
}

function useProtectedSubmit(endpoint: string, onNotice: (message: string) => void) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload: Record<string, unknown> = Object.fromEntries(form.entries());
    payload.turnstileToken = token;
    for (const key of ["routing-consent", "safety-acknowledgement"]) payload[key] = form.get(key) === "on";
    setBusy(true);
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { message?: string };
      onNotice(data.message ?? (response.ok ? "Done." : "Something went wrong."));
      if (response.ok) formElement.reset();
    } catch {
      onNotice("The request could not be completed. Try again.");
    } finally {
      setBusy(false);
      setToken("");
    }
  }, [busy, endpoint, onNotice, token]);
  return { submit, setToken, busy, token };
}

export function ContactForm({ onNotice }: { onNotice: (message: string) => void }) {
  const { enabled: formsEnabled, sitekey } = useFormsEnabled();
  const { submit, setToken, busy, token } = useProtectedSubmit("/api/contact", onNotice);
  if (!formsEnabled) return <div className="form-pending" role="status"><p className="kicker">CONTACT DELIVERY PENDING</p><p>Contact delivery is not active until the approved inbox, privacy terms, and provider test are in place.</p></div>;
  return <form onSubmit={submit}><label className="visually-hidden" htmlFor="contact-purpose">What is this about?</label><select id="contact-purpose" name="purpose" defaultValue="" required><option disabled value="">What is this about?</option><option>General inquiry</option><option>Event promotion</option><option>Studio booking</option><option>Consulting</option><option>Guest submission</option><option>Sponsorship or partnership</option><option>Press or media</option><option>Order support</option></select><div className="form-grid"><div><label className="visually-hidden" htmlFor="contact-name">Name</label><input id="contact-name" name="name" required autoComplete="name" placeholder="Name" /></div><div><label className="visually-hidden" htmlFor="contact-email">Email</label><input id="contact-email" name="email" required type="email" autoComplete="email" placeholder="Email" /></div></div><label className="visually-hidden" htmlFor="contact-organization">Organization or brand (optional)</label><input id="contact-organization" name="organization" placeholder="Organization or brand (optional)" /><label className="visually-hidden" htmlFor="contact-message">How can we help?</label><textarea id="contact-message" name="message" required placeholder="How can we help?" /><label className="check"><input name="routing-consent" type="checkbox" required /> I agree to have this inquiry routed to the relevant team workflow.</label><TurnstileWidget sitekey={sitekey} action="contact" onToken={setToken} /><button className="solid" disabled={busy || !token}>{busy ? "Sending…" : "Send message ↗"}</button></form>;
}

export function TipForm({ onNotice }: { onNotice: (message: string) => void }) {
  const { enabled: formsEnabled, sitekey } = useFormsEnabled();
  const { submit, setToken, busy, token } = useProtectedSubmit("/api/spill", onNotice);
  if (!formsEnabled) return <div className="form-pending" role="status"><p className="kicker">TIP LINE DELIVERY PENDING</p><p>A secure, owner-approved intake is required before tips can be delivered. Do not submit sensitive information.</p></div>;
  return <form onSubmit={submit}><p className="kicker">SHARE INFORMATION</p><label className="visually-hidden" htmlFor="tip-message">What should The Files know?</label><textarea id="tip-message" name="message" required placeholder="What should The Files know? Include useful context, dates, and relevant details." /><label className="visually-hidden" htmlFor="tip-source">Source or reference link (optional)</label><input id="tip-source" name="source" type="url" placeholder="Source or reference link (optional)" /><label className="visually-hidden" htmlFor="tip-follow-up">How can we follow up? (optional)</label><input id="tip-follow-up" name="followUp" placeholder="How can we follow up? (optional)" /><label className="check"><input name="safety-acknowledgement" type="checkbox" required /> I understand this is not an anonymous reporting channel and I should not include sensitive personal information.</label><TurnstileWidget sitekey={sitekey} action="spill" onToken={setToken} /><button className="solid" disabled={busy || !token}>{busy ? "Sending…" : "Send tip ↗"}</button></form>;
}

export function NewsletterSignup() {
  const { enabled: formsEnabled, sitekey } = useFormsEnabled();
  const [notice, setNotice] = useState("");
  const { submit, setToken, busy, token } = useProtectedSubmit("/api/newsletter/request", setNotice);
  if (!formsEnabled) return <div className="newsletter-pending" role="status"><p className="kicker">SIGN-UPS NOT ACTIVE</p><p>The Dispatch is not accepting sign-ups yet. No newsletter information is collected or sent from this form.</p></div>;
  return <div className="newsletter-form"><form onSubmit={submit}><label className="visually-hidden" htmlFor="dispatch-email">Email address</label><input id="dispatch-email" name="email" type="email" autoComplete="email" required placeholder="Email address" /><TurnstileWidget sitekey={sitekey} action="newsletter" onToken={setToken} /><button className="outline" disabled={busy || !token}>{busy ? "Sending…" : "Confirm by email ↗"}</button></form>{notice && <p className="form-message" role="status">{notice}</p>}</div>;
}
