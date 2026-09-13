import { formMode, httpsUrlField, jsonResponse, optionalTextField, readJsonBody, sameOrigin, sendResendEmail, textField, verifyTurnstile } from "../../lib/form-security";

export async function POST(request: Request) {
  if (formMode() === "disabled") return jsonResponse({ ok: false, message: "The tip line is not active yet." }, 503);
  if (!sameOrigin(request)) return jsonResponse({ ok: false, message: "Request rejected." }, 403);
  const body = await readJsonBody(request);
  const message = textField(body?.message, 12_000);
  const source = body?.source ? httpsUrlField(body.source) : null;
  const followUp = optionalTextField(body?.followUp, 320);
  if (!body || !message || (body.source && !source) || body["safety-acknowledgement"] !== true) {
    return jsonResponse({ ok: false, message: "Complete the required fields and acknowledgement." }, 400);
  }
  const verification = await verifyTurnstile(request, "spill", body.turnstileToken);
  if (!verification.ok) return jsonResponse({ ok: false, message: verification.message }, verification.status);
  const result = await sendResendEmail({
    destination: "RESEND_SPILL_TO",
    subject: "The Files tip-line submission",
    text: [message, "", `Source: ${source ?? "Not provided"}`, `Follow-up: ${followUp || "Not provided"}`].join("\n"),
  });
  return result.ok ? jsonResponse({ ok: true, message: "Your tip was sent to The Files for review." }) : jsonResponse({ ok: false, message: result.message }, result.status);
}
