import { formMode, jsonResponse } from "../../../lib/form-security";

export async function GET() {
  return jsonResponse({ enabled: formMode() !== "disabled", mode: formMode() === "test" ? "test" : formMode() === "live" ? "live" : "disabled", sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? process.env.TURNSTILE_SITE_KEY ?? "" });
}
