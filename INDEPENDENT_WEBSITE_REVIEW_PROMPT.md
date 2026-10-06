# Independent Review: The Files With Dub website

Review the live website at https://www.thefileswithdub.com independently. Do not rely on prior migration notes or implementation claims.

## Approved release acceptance checklist — 2026-10-06

This checklist preserves the current owner-approved scope. Do not add or remove
acceptance criteria without Frank's approval.

- [ ] **Routes and responsive shell:** `/`, `/files`, `/broadcasts`, `/outside`, `/studio`, `/consulting`, `/spill`, `/contact`, `/about`, `/affiliate`, `/patreon`, `/links`, `/privacy`, `/terms`, and `/accessibility` retain approved content/navigation and work on direct navigation, refresh, history, keyboard, desktop, tablet, and mobile. `/game` and an arbitrary unknown route return normal HTTP 404. Production browser inspection on 2026-10-06 covered the 15 retained routes at 1440×900, 768×1024, and 390×844 on Cloudflare Worker version 82 (`8ff2839a-f8a0-4a70-b11a-aa17e033c3d6`); all had an H1 and no horizontal overflow. The exact production HTTP response for `/game` remains unverified; candidate route test is `tests/rendered-html.test.mjs`.
- [x] **Media and replay:** the production Files feed refreshed to 15 current uploads; searching “Kino” returned one match, and the on-site YouTube player for `JXxDsy_OqLE` reported `readyState=4`, `paused=false`, and playback at 41.1 seconds on 2026-10-06. The X archive replay loaded and played in the production browser in the same QA session.
- [ ] **Outside and music:** production Eventbrite listings rendered 10 current events on 2026-10-06. Candidate empty/unavailable status branches are implemented in `app/components/files-platform.tsx`; current tests assert those branches and messages, but an empty-list fixture was not run. The Apple Music iframe loaded; full-track playback was not tested with a signed-in Apple account.
- [ ] **Approved integrations:** Patreon opened the public DUB page and Amazon opened “DUB's Amazon Page” in read-only browser checks on 2026-10-06. Shopify currently opens a public starter store titled “My Store” with placeholder products, so the approved storefront destination is unresolved. Calendly's 1-hour URL is invalid; the public account exposed only a 4-hour studio event, while consulting also points to the account root. Do not invent URLs or alter provider accounts.
- [ ] **Parked launches:** newsletter expansion was explicitly parked in `docs/process-upgrades-eleven-2026-09-22.md`; podcast launch remains a deferred “Bet” without a public episode. Production version 82 still says newsletter signup opens October 21 and podcast links are “coming soon,” contradicting that record. Candidate source (`app/links/page.tsx`) now labels both inactive, with a rendered-page regression in `tests/rendered-html.test.mjs`; the correction is not yet deployed.
- [ ] **Contact and tip delivery:** production forms remain fail-closed. They are not complete until the approved receiving workflow, privacy/terms, retention rules, and sandbox delivery proof in `README.md` are resolved. No collection or delivery is authorized by this checklist.
- [ ] **Security and dependencies:** production dependencies currently report zero vulnerabilities. Full `npm audit` reports nine high findings that all trace to the same dev-only `braces@3.0.3` advisory; the current upstream advisory lists no patched release. Preserve this residual visibly and do not force a breaking downgrade. See [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- [ ] **Release:** current candidate `npm run verify` passes 43 tests on the working tree; lint has two existing `<img>` warnings and the build retains Vite import/chunk-size warnings. Run GitHub checks and independent QA against the exact pushed candidate, retain provider readbacks, then obtain production approval. Production currently assigns version 82 (100%, deployment `d7444995-5da4-46c4-afd3-983aeaa7db3a`, 2026-10-06 13:10 UTC). `README.md` documents rollback. No production deployment is authorized by this checklist.

## Scope

Treat the current live site as the review target. The intended product rule is that every public page and feature should work as designed, except that the former Game page is intentionally retired and must return a normal 404.

## Review tasks

1. Visit the homepage and every reachable internal route. Inventory navigation, footer links, direct-route access, refresh behavior, and browser back/forward behavior.
2. Test at desktop, tablet, and mobile breakpoints. Record layout defects, overflow, responsive navigation problems, inaccessible controls, and visual regressions.
3. Verify meaningful interactions rather than only confirming that controls render:
   - Files search and on-site video playback
   - X broadcast archive and media playback where safely possible
   - Patreon, Shopify, Calendly, Amazon, Apple Music, and other external destinations
   - Newsletter validation only; do not submit a public form or create an account
   - Outside / nightlife calendar content
4. Check the console and network panel for unexplained errors, failed assets, broken fonts, or failed required requests.
5. Confirm `/game` and an arbitrary unknown route return 404, and confirm that no navigation or homepage entry point leads to Game.
6. Compare visual and functional behavior against the original reference only when available: https://the-files-with-dub.franklinburrus.chatgpt.site. Clearly label observations that cannot be compared.

## Safety boundaries

Do not change DNS, Cloudflare configuration, production content, source code, or third-party accounts. Do not purchase, book, publish, submit forms, or send messages. Do not expose credentials or secret values.

## Deliverable

Return an evidence-based report with:

- Executive outcome: PASS, PASS WITH ISSUES, or BLOCKED.
- A route and feature matrix with expected behavior, observed result, evidence, and severity.
- Exact reproduction steps for each issue.
- Screenshots at desktop (1440 x 900), tablet (768 x 1024), and mobile (390 x 844) for material visual defects.
- Separate lists for confirmed defects, suspected defects, environment limitations, and items not tested.
- A prioritized remediation list. Do not implement fixes.

End by stating exactly what was inspected, verified, not verified, and recommended.
