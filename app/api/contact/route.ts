import { emailField, formMode, jsonResponse, optionalTextField, readJsonBody, sameOrigin, sendResendEmail, textField, verifyTurnstile } from "../../lib/form-security";

const purposes = new Set(["General inquiry", "Event promotion", "Studio booking", "Consulting", "Guest submission", "Sponsorship or partnership", "Press or media", "Order support"]);

export async function POST(request: Request) {
  if (formMode() === "disabled") return jsonResponse({ ok: false, message: "Contact delivery is not active yet." }, 503);
  if (!sameOrigin(request)) return jsonResponse({ ok: false, message: "Request rejected." }, 403);
  const body = await readJsonBody(request);
  const purpose = textField(body?.purpose, 80);
  const name = textField(body?.name, 120);
  const email = emailField(body?.email);
  const message = textField(body?.message, 8_000);
  if (!body || !purpose || !purposes.has(purpose) || !name || !email || !message || body["routing-consent"] !== true) {
    return jsonResponse({ ok: false, message: "Complete the required fields and consent." }, 400);
  }
  const verification = await verifyTurnstile(request, "contact", body.turnstileToken);
  if (!verification.ok) return jsonResponse({ ok: false, message: verification.message }, verification.status);
  const result = await sendResendEmail({
    destination: "RESEND_CONTACT_TO",
    subject: `The Files contact: ${purpose}`,
    replyTo: email,
    text: [`Name: ${name}`, `Email: ${email}`, `Purpose: ${purpose}`, `Organization: ${optionalTextField(body.organization, 160) || "Not provided"}`, "", message].join("\n"),
  });
  return result.ok ? jsonResponse({ ok: true, message: "Your message was sent to The Files." }) : jsonResponse({ ok: false, message: result.message }, result.status);
}
