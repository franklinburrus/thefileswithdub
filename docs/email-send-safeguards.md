# Email Send Safeguards — Verify, Don't Just Promise

**Law — recorded 2026-09-19.** When Frank says "leave it in drafts" / "don't
send", verify — don't just promise.

## The safeguards

- A send-approval card may still be pending — check `permissions.list_pending`
  and warn him explicitly not to tap it; let it expire. (2026-09-18: a recap
  email went out 3 min after "it stays in drafts, unsent" was said — the
  pending approval was almost certainly tapped late.)
- Never confirm "unsent" from the transcript alone — verify via the Gmail API
  that the draft still exists with DRAFT label before saying so.
- Duplicate sends (same recap 3 min apart, 2026-09-18) suggest approval-tap +
  manual-send doubling — when a send approval is live, tell Frank to use the
  card OR the Gmail app, not both.

**Canonical source — supersedes copies elsewhere.**
