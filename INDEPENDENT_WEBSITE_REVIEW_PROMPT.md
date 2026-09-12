# Independent Review: The Files With Dub website

Review the live website at https://www.thefileswithdub.com independently. Do not rely on prior migration notes or implementation claims.

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
