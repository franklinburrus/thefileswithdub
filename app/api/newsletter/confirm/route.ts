import { addNewsletterContact, formMode, readNewsletterToken } from "../../../lib/form-security";

function page(message: string, status = 200): Response {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Dispatch | The Files With Dub</title></head><body style="font-family:Arial,sans-serif;background:#0d0e0d;color:#f1eadc;padding:3rem;max-width:42rem;margin:auto"><h1>The Dispatch</h1><p>${message}</p><p><a href="/" style="color:#eeb51b">Return to The Files</a></p></body></html>`, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

export async function GET(request: Request) {
  if (formMode() === "disabled") return page("The Dispatch is not accepting sign-ups yet.", 503);
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const email = await readNewsletterToken(token, new URL(request.url).hostname);
  if (!email) return page("This confirmation link is invalid or expired.", 410);
  const result = await addNewsletterContact(email);
  return result.ok ? page("Your subscription is confirmed.") : page(result.message, result.status);
}
