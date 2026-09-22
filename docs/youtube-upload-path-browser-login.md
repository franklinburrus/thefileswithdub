# YouTube Upload Path — Browser Login, No API Key

**Law — Frank's correction, 2026-09-22.** YouTube uploads go through a
BROWSER LOGIN to Dub's YouTube account on the shared browser profile. There
is NO API-key route — do not chase, request, or build around a YouTube API
key.

## The route

- Dub's Google login must land in the shared browser session ONCE: either Dub
  logs in himself, or the credential comes through the Secure Vault's
  login-capture route and the browser task signs in with the saved login.
  Never attempt password entry by hand, and never ask a browser task to sign
  in from scratch with credentials it doesn't have.
- Until Dub's login is in the session, the `dub-youtube-daily-upload` cron
  ends its run as blocked (log it, report to the main chat) — it does not
  fabricate an upload.
- In YouTube Studio the browser task must use Dub's YouTube account explicitly
  (switch accounts if the profile's default is another Google account).
  Frank's Google SSO session and its editor role are NOT the upload path.

## Monetization still applies

Monetization law (Watch Page ads ON, YouTube Premium ON, "None of the above",
"Not made for kids") applies on every browser upload.

**Canonical source — supersedes copies elsewhere.**
