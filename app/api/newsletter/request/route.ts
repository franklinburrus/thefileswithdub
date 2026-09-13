import { createNewsletterToken, emailField, formMode, jsonResponse, readJsonBody, sameOrigin, sendResendEmail, verifyTurnstile } from "../../../lib/form-security";

export async function POST(request: Request) {
  if (formMode() === "disabled") return jsonResponse({ ok: false, message: "The Dispatch is not accepting sign-ups yet." }, 503);
  if (!sameOrigin(request)) return jsonResponse({ ok: false, message: "Request rejected." }, 403);
  const body = await readJsonBody(request);
  const email = emailField(body?.email);
  if (!body || !email) return jsonResponse({ ok: false, message: "Enter a valid email address." }, 400);
  const verification = await verifyTurnstile(request, "newsletter", body.turnstileToken);
  if (!verification.ok) return jsonResponse({ ok: false, message: verification.message }, verification.status);
  const requestUrl = new URL(request.url);
  const token = await createNewsletterToken(email, requestUrl.hostname);
  if (!token) return jsonResponse({ ok: false, message: "Newsletter delivery is not configured." }, 503);
  const confirmationUrl = new URL("/api/newsletter/confirm", requestUrl);
  confirmationUrl.searchParams.set("token", token);
  const result = await sendResendEmail({
    destination: "RESEND_CONTACT_TO",
    subject: "Confirm The Dispatch signup",
    text: `Confirm your subscription to The Dispatch:\n\n${confirmationUrl.toString()}\n\nThis link expires in 24 hours. If you did not request it, you can ignore this message.`,
    ...(formMode() === "live" ? { to: email } : {}),
  });
  return result.ok ? jsonResponse({ ok: true, message: "Check your inbox to confirm your subscription." }) : jsonResponse({ ok: false, message: result.message }, result.status);
}
