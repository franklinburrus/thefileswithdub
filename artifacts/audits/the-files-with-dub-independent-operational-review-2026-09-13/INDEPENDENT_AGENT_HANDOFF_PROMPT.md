# Independent Agent Handoff Prompt — The Files With Dub

You are the independent reviewer for The Files With Dub. Perform a read-only,
evidence-based audit. Do not implement fixes or change production.

## Objective

Determine whether the current Cloudflare website is operationally ready after
the parity, mobile, 4K readability, SEO, and security work. Verify every claim
from live behavior, this repository, authenticated deployment readback, and
fresh tests. Treat prior chat messages, screenshots without provenance, green
builds, and this prompt as leads rather than proof.

## Authoritative targets

- Production: https://www.thefileswithdub.com
- Isolated preview: https://thefileswithdub-preview.thefileswithdub.workers.dev
- Original visual reference: https://the-files-with-dub.franklinburrus.chatgpt.site
- Repository: https://github.com/franklinburrus/thefileswithdub.git
- Current source expected at handoff: `27d5bb18aef36f03ec7cd8a390b8c79297571518` (`27d5bb1`)
- Current production Worker expected at handoff: `thefileswithdub`, version `cf69445c-2966-4feb-9be8-e9162e3abb72`, route `www.thefileswithdub.com/*`
- Current preview Worker expected at handoff: `thefileswithdub-preview`, version `4a13f578-fe99-45ab-ac89-a69fa8c7618f`

Re-read all identity values with authenticated, non-secret commands before
using them. Historical Worker IDs in older manifests are not current identity.

## Scope boundaries

Include retained non-Game routes, content, navigation, direct-route behavior,
media, responsive layout, typography and spacing, mobile usability, 1080p/4K
readability, accessibility, SEO/indexability, Worker security boundaries,
forms/privacy truthfulness, deployment controls, and recovery evidence.

Ignore merchandise, Shopify, affiliate, checkout, payment, order-support, and
sales-funnel optimization. The Game page is intentionally retired: `/game`,
`/game/`, and nested Game paths must return a deliberate 404 and must have no
navigation, footer, homepage, sitemap, metadata, fallback, search, or shipped
Game resources.

Contact, Spill/tip, and newsletter flows are expected to remain non-delivering
while `FORMS_MODE=disabled`. Do not activate them or send test data to a real
recipient. Do not book through Calendly, subscribe, purchase, publish, or send
public messages.

## Evidence available in this project

Read these files from the current checkout before forming conclusions:

- `artifacts/audits/the-files-with-dub-independent-operational-review-2026-09-13/INDEPENDENT_OPERATIONAL_AUDIT.md`
- `artifacts/audits/the-files-with-dub-independent-operational-review-2026-09-13/HANDOFF-PROMPT.md`
- `artifacts/audits/the-files-with-dub-independent-operational-review-2026-09-13/INDEPENDENT_AGENT_HANDOFF_PROMPT.md` (this prompt)
- `audits/the-files-with-dub-cloudflare-parity-2026-09-12/INDEPENDENT_AUDIT_READINESS_2026-09-13.md` when present
- `audits/the-files-with-dub-cloudflare-parity-2026-09-12/manifests/independent-audit-readiness-2026-09-13.json` when present
- `audits/the-files-with-dub-cloudflare-parity-2026-09-12/CLOUDFLARE_PARITY_REBUILD_PLAN.md` when present
- `audits/the-files-with-dub-cloudflare-parity-2026-09-12/READINESS_CHECKLIST_AUDIT_2026-09-13.md` when present

Current execution manifests, when present, include:

- `audits/the-files-with-dub-cloudflare-parity-2026-09-12/manifests/production-deploy-readback-2026-09-13.json`
- `audits/the-files-with-dub-cloudflare-parity-2026-09-12/manifests/production-execution-2026-09-13.json`
- `audits/the-files-with-dub-cloudflare-parity-2026-09-12/manifests/preview-layout-smoke-2026-09-13.json`
- `audits/the-files-with-dub-cloudflare-parity-2026-09-12/manifests/production-interaction-2026-09-13.json`
- `audits/the-files-with-dub-cloudflare-parity-2026-09-12/manifests/production-home-captures-2026-09-13.json`
- `audits/the-files-with-dub-cloudflare-parity-2026-09-12/network/http-probes.json`

If an evidence file is absent in this checkout, record `BLOCKED` or `UNKNOWN`
and continue with the live/repository evidence that is available. The older
`security-readback.json` is historical evidence and must not establish current
Worker identity.

## Required checks

### Source and release identity

Run and record:

```sh
git status --short
git branch --show-current
git rev-parse HEAD
git remote -v
npm ci
npm run verify
npm audit --audit-level=high
git diff --check
```

Preserve any existing user changes. Do not reset, overwrite, commit, or clean
the working tree merely to make the audit look green.

### Deployment and infrastructure

Use Wrangler or the authenticated Cloudflare dashboard to confirm the account,
zone, Worker names, current version IDs, production route, preview isolation,
forms mode, and secret *names only*. Never print token, API-key, Turnstile,
Resend, Eventbrite, cookie, or callback values.

Obtain zone-admin readback for SSL/Always Use HTTPS, WAF, rate limits, bot
controls, managed robots behavior, exports, and backup/restore. If the current
token cannot read them, mark the controls `BLOCKED` or `UNKNOWN`; do not infer
them from Worker headers.

### Routes, content, and interactions

For every retained route, test direct entry, refresh, internal navigation,
back/forward, status, title, one H1, canonical, and required assets. Repeat at
390×844, 768×1024, 1440×900, 1920×1080, 2560×1440, and 3840×2160.

Verify mobile menu open/close and focus, Files search and zero-result state,
on-site player open/close and focus restoration, Broadcast/HLS behavior,
Outside calendar and Apple Music embed states, safe external destinations,
loading/empty/error states, and actual YouTube embed playback. A rendered
button or iframe is not proof of its outcome.

Verify `/game`, `/game/`, `/game/play`, and an arbitrary unknown route return the
specified 404 behavior and that no Game entry point or resource remains.

### Forms, privacy, and trust

Confirm `/api/forms/status` reports disabled and Contact, Spill, and newsletter
POST routes fail closed without collecting data. Review labels, validation,
same-origin checks, length bounds, Turnstile Siteverify, idempotency, provider
delivery, retention, deletion, unsubscribe, and legal copy only if an approved
sandbox/provider and owner/counsel evidence exists. Otherwise keep each item
open and do not invent a substitute.

### Performance, accessibility, and SEO

Separate controlled lab results from field data. Report real-user 75th
percentile LCP, INP, and CLS if available; otherwise use
`FIELD_DATA_INSUFFICIENT`. Check image dimensions and modern formats, font
readiness, client chunk size, layout shifts, contrast, axe-equivalent results,
full keyboard traversal, visible focus, skip link, modal containment, and
VoiceOver/TalkBack on physical devices when available.

Verify unique title/description, one H1, canonical, Open Graph/Twitter, JSON-LD,
sitemap, robots plus the Cloudflare managed overlay, HTTPS, internal links, and
Search Console/indexing evidence. Do not call Search Console or analytics
complete without authenticated property/event readback.

## Stop conditions

Stop and report the exact blocker if production identity is uncertain, a test
would mutate external state, a secret or personal data could be exposed, or a
requested check requires unavailable zone-admin, provider, legal,
analytics/Search Console, physical-device, or assistive-technology access.

## Required output

Return an independent report with these headings:

```text
STATUS:
AUDIT TARGET AND SCOPE:
PROCESS VERSION AND CRITERIA:
EVIDENCE MAP:
CONTROL AND STEP RESULTS:
FINDINGS:
COMPLETION CLAIM REVIEW:
LIMITATIONS AND UNVERIFIED ITEMS:
REMEDIATION OR NEXT ACTION:
```

Classify each item as `COMPLETED`, `PARTIAL`, `BLOCKED`, `UNKNOWN`, or
`NEEDS_HUMAN_REVIEW`. Include reproduction steps, expected versus actual
result, evidence path or URL, severity, confidence, and owner. End by clearly
separating what was inspected, verified, failed, unknown, and planned but not
implemented. Do not certify the site green while any material gate is
unverified.
