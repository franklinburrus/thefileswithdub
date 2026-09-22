# Backfill Law — Buffer Queues Stay Full

**Law — approved by Frank 2026-09-22.** Buffer queues stay FULL at all times.
If slots are empty, backfill automatically — no asking, no waiting for a
decision. An empty queue is a defect, not a question.

## The rule

- An empty Buffer queue is a DEFECT, not a question. If slots are empty,
  backfill automatically with ready, QA-passed content.
- Prior reservation windows (e.g., 7/31 reserved slots, 9/19 reserved slots)
  do not hold an empty queue hostage: when production hasn't delivered the
  reserved content, schedule ready content into those slots.
- This supersedes passive waiting on the 7/31 and 9/19 production deliveries.

## Backfill priorities

When backfilling empty slots, in this order:

1. Content already produced and QA-passed for the empty slots.
2. Any ready QA-passed content.
3. Never schedule substandard / un-QA'd content — report the blocking or
   missing production if the gap can't be filled.

## Guardrails

- Never move, reschedule, or alter already-scheduled posts to make room for
  backfill; only fill genuinely empty slots.
- Backfill content still goes through the lane's normal route (Apache: API
  only; Cherokee: website only).

Recorded 2026-09-22 in AGENTS.md and MEMORY.md. This doc is the canonical
text home.
