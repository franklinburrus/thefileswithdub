# 1080p Quality Floor — Dub Audio / Dub Video

**Law — effective 2026-09-22, per Frank.** Nothing from the Dub:Audio or
Dub:Video rooms ever goes out under 1080p. No exceptions.

## The rule

- Every video render shipping from Dub:Audio or Dub:Video must be **1080p
  minimum** on its shortest side:
  - Landscape (X): **1920×1080** minimum.
  - Vertical / IG Reels: **1080×1920** minimum.
- Sub-1080p sources are **rejected at intake** — they never enter the clip
  pipeline. A 360p or 480p pull is not "good enough for now"; it is
  unusable.
- When only a sub-HD source is available (e.g. a YouTube pull capped at
  360p by a flagged egress IP), the room **chases HD** before cutting:
  browser-task cookie export, a non-flagged IP, or another clean source.
  No clips are cut from the low-res file in the meantime.

## Why

Dub's brand is premium. A 360p clip next to 1080p clips reads as broken
to the viewer, and upscaling a 360p source does not restore detail — it
just makes bigger blur. The floor protects the brand at the cheapest
possible point: source selection.

## QA gate

Per-render QA already checks dimensions; this law makes **<1080p an
automatic FAIL**, not a judgment call:

- `ffprobe` the render; if width < 1920 (landscape) or width < 1080
  (vertical), FAIL with reason `UNDER_1080P_FLOOR`.
- The Media QA Supervisor rejects the batch item before it reaches Main,
  and it never reaches Frank.

## Precedent

2026-09-22: Episode 964 full-video re-fetch came back 640×360. Frank
rejected it on sight — "nothing ever goes out under 1080p" — and ordered
the HD chase. The 360p file was quarantined, not clipped.

## Related law

- `audio-clip-framework.md` — the Audio Post Template (already 1080p-native).
- `ig-reel-format.md` — 1080×1920 full-bleed for IG, no letterbox bars.
- Both assume 1080p sources; this document makes the floor explicit and
  universal across both rooms.


---

**Canonical source — supersedes copies elsewhere.**
