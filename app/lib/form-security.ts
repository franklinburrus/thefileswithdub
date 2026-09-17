import { fetchWithTimeout } from "./http";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RESEND_API_URL = "https://api.resend.com";
const MAX_BODY_BYTES = 32 * 1024;
const MAX_TOKEN_LENGTH = 2_048;
const TOKEN_TTL_SECONDS = 24 * 60 * 60;

export type FormMode = "disabled" | "test" | "live";

export function formMode(): FormMode {
  const mode = String(process.env.FORMS_MODE ?? "disabled");
  return mode === "test" || mode === "live" ? mode : "disabled";
}

export function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") return null;
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) return null;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return null;
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  // Browsers always send Origin on same-origin POSTs. A missing Origin means
  // a non-browser client — reject rather than wave it through.
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function textField(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
  return normalized.length > 0 && normalized.length <= maxLength ? normalized : null;
}

export function optionalTextField(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function emailField(value: unknown): string | null {
  const email = textField(value, 320)?.toLowerCase() ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(email) ? email : null;
}

export function httpsUrlField(value: unknown, maxLength = 2_048): string | null {
  const candidate = textField(value, maxLength);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function verifyTurnstile(request: Request, action: string, token: unknown): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, status: 403, message: "Verification is required." };
  }
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: false, status: 503, message: "Form verification is not configured." };

  const expectedHostnames = new Set((process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? "www.thefileswithdub.com,thefileswithdub.com")
    .split(",").map(value => value.trim().toLowerCase()).filter(Boolean));
  if (!expectedHostnames.size) return { ok: false, status: 503, message: "Form verification is not configured." };

  const form = new URLSearchParams({
    secret,
    response: token,
    idempotency_key: crypto.randomUUID(),
  });
  const clientIp = request.headers.get("CF-Connecting-IP");
  if (clientIp) form.set("remoteip", clientIp.slice(0, 128));
  try {
    const response = await fetchWithTimeout(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    if (!response.ok) return { ok: false, status: 503, message: "Verification is temporarily unavailable." };
    const result: unknown = await response.json();
    if (!result || typeof result !== "object") return { ok: false, status: 403, message: "Verification failed." };
    const data = result as { success?: unknown; action?: unknown; hostname?: unknown };
    if (data.success !== true || data.action !== action || typeof data.hostname !== "string" || !expectedHostnames.has(data.hostname.toLowerCase())) {
      return { ok: false, status: 403, message: "Verification failed." };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 503, message: "Verification is temporarily unavailable." };
  }
}

function configuredDestination(name: "RESEND_CONTACT_TO" | "RESEND_SPILL_TO" | "RESEND_TEST_TO"): string | null {
  const mode = formMode();
  const value = mode === "test" ? process.env.RESEND_TEST_TO : process.env[name];
  return emailField(value) ?? (typeof value === "string" && value.includes(",") && value.split(",").every(item => emailField(item.trim())) ? value : null);
}

export async function sendResendEmail(input: {
  destination: "RESEND_CONTACT_TO" | "RESEND_SPILL_TO" | "RESEND_TEST_TO";
  subject: string;
  text: string;
  replyTo?: string;
  to?: string;
}): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = textField(process.env.RESEND_FROM, 320);
  const to = input.to ?? (formMode() === "test" ? configuredDestination("RESEND_TEST_TO") : configuredDestination(input.destination));
  if (!apiKey || !from || !to) return { ok: false, status: 503, message: "Form delivery is not configured." };
  try {
    const response = await fetchWithTimeout(`${RESEND_API_URL}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ from, to: to.split(",").map(item => item.trim()), subject: input.subject.slice(0, 160), text: input.text.slice(0, 24_000), ...(input.replyTo ? { reply_to: input.replyTo } : {}) }),
    });
    if (!response.ok) return { ok: false, status: 502, message: "Form delivery is temporarily unavailable." };
    return { ok: true };
  } catch {
    return { ok: false, status: 502, message: "Form delivery is temporarily unavailable." };
  }
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function tokenKey(): Promise<CryptoKey | null> {
  const secret = process.env.NEWSLETTER_TOKEN_SECRET;
  if (!secret) return null;
  const material = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", material, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function createNewsletterToken(email: string, hostname: string): Promise<string | null> {
  const key = await tokenKey();
  if (!key) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = JSON.stringify({ email, hostname, exp: Math.floor(Date.now() / 1_000) + TOKEN_TTL_SECONDS });
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as unknown as BufferSource }, key, new TextEncoder().encode(payload));
  return `v1.${base64Url(iv)}.${base64Url(new Uint8Array(ciphertext))}`;
}

export async function readNewsletterToken(token: string, hostname: string): Promise<string | null> {
  if (!/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u.test(token)) return null;
  const key = await tokenKey();
  if (!key) return null;
  try {
    const [, encodedIv, encodedCiphertext] = token.split(".");
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64Url(encodedIv) as unknown as BufferSource }, key, fromBase64Url(encodedCiphertext) as unknown as BufferSource);
    const value: unknown = JSON.parse(new TextDecoder().decode(plaintext));
    if (!value || typeof value !== "object") return null;
    const data = value as { email?: unknown; hostname?: unknown; exp?: unknown };
    const email = emailField(data.email);
    if (!email || data.hostname !== hostname || typeof data.exp !== "number" || data.exp < Math.floor(Date.now() / 1_000)) return null;
    return email;
  } catch {
    return null;
  }
}

export async function addNewsletterContact(email: string): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const topicId = textField(process.env.RESEND_NEWSLETTER_TOPIC_ID, 200);
  const segmentId = textField(process.env.RESEND_NEWSLETTER_SEGMENT_ID, 200);
  if (!apiKey || (!topicId && !segmentId)) return { ok: false, status: 503, message: "Newsletter delivery is not configured." };
  const body = {
    email,
    unsubscribed: false,
    ...(topicId ? { topics: [{ id: topicId, subscription: "opt_in" }] } : {}),
    ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
  };
  try {
    const response = await fetchWithTimeout(`${RESEND_API_URL}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `newsletter-${crypto.randomUUID()}`,
      },
      body: JSON.stringify(body),
    });
    if (response.ok || response.status === 409) return { ok: true };
    return { ok: false, status: 502, message: "Newsletter delivery is temporarily unavailable." };
  } catch {
    return { ok: false, status: 502, message: "Newsletter delivery is temporarily unavailable." };
  }
}
