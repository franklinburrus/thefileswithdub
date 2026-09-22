# Audio Clip Framework — THE FILES WITH DUB

**Law — effective 2026-09-17, amended 2026-09-18, per Frank.** Every audio-only
clip on the Apache pipeline (Instagram + X) follows this framework. No exceptions.

## The look (2026-09-18 rebuild)

Two platform templates, 1080p floor, both rendered from the canonical code in
the workspace pack `readme-x-audio-only-clips/` (`render_clip.py` — single
source of truth, no parallel implementations):

- **X:** 1920×1080, 16:9 landscape. Graffiti artwork cover-fills the left
  1080×1080 square, edge to edge. Right panel (x=1080→1920) is pure black:
  title bold white centered in safe box (1120,150)–(1880,640); one live
  yellow waveform at (1120,700), 760×300.
- **IG / Reels:** 1080×1920, 9:16 full-bleed (no black bars, ever). Artwork
  cover-fills the top 1080×960, edge to edge. Rest black: title bold white
  centered in safe box (60,975)–(920,1370), kept left of the right-side UI
  overlay; one live yellow waveform at (40,1390), 1000×470.
- Codecs: H.264 (libx264, yuv420p, 30 fps) + AAC 160 kbps; original clip
  audio untouched.

## The waveform rule

- Exactly **one** waveform per render, generated from the clip's **own audio
  stream** (`ffmpeg` `showwaves`: `mode=line`, `colors=yellow`, `volume=8dB`,
  `rate=15`), frame-synced.
- Decorative, baked-in, templated, or looped waveforms are **banned** — the
  2026-09-17 build's baked-in fake wave was removed 2026-09-18 on Frank's order.
- Every render gets a **two-frame sync check** before shipping: extract frames
  at two distant timestamps, crop the waveform band, confirm the MD5s differ.
  Identical = broken render, redo it.

## The title rule

- Short (≤45 chars), Title Case, derived from the clip's actual transcript —
  what it's really about.
- Auto-fit: starts large, shrinks until it fits, wraps to ≤3 lines. Fully
  inside the safe title box — never clipped, never under artwork, never under
  IG's right-side UI.
- Never invent. Flag `NEEDS_HUMAN_REVIEW` when the transcript is unclear.

## What never ships

- Static-logo-card videos, plain audiograms, floating artwork with dead black
  space, clipped titles, double waveforms, or any audio post not matching the
  template look. A queued post failing the look is `BLOCKED` until re-rendered.
- Format fixes never alter captions or schedule times — video asset only.

## Canonical render command

```bash
python3 render_clip.py --platform ig|x --title "TITLE" --audio in.m4a --out out.mp4
```

(`render_clip.py` in `~/workspace/readme-x-audio-only-clips/` — the pack also
holds `build_templates.py`, the prebuilt bases, and the full spec in its
README. The retired `RETIRED_replicate_poster.sh` rebuilt the rejected
baked-waveform build and is disabled.)

## Buffer swap notes

- New renders upload to the Drive `Apache` folder (`1UapV42Q92pvv9sg1t19LofrlDMw3R2oh`),
  get `anyone/reader` link sharing, and are named `<original>_TEMPLATE.mp4`.
- Asset swap via `editPost` with `assets: [{video: {url}}]`.
- IG posts also require `metadata: {instagram: {type: "reel", shouldShareToFeed: true}}`
  (without it the API rejects the edit: "Instagram posts require a type").
- X posts: assets only, no metadata.

## Origin

2026-09-17: 2 IG posts went live as static-logo cards and were deleted;
48 queued posts (23 IG + 25 X) were re-rendered into the template and swapped
via Buffer. Frank: the audio post has an established look that must be
followed.

2026-09-18: Frank flagged the 9-17 build on X and IG — title clipped
off-screen, artwork floating with dead space, and a fake templated waveform
stacked with the live one. Template rebuilt: X-specific 1920×1080 layout,
artwork fitted edge-to-edge, titles auto-fit inside safe boxes, decorative
waveform eliminated (one live yellow wave only), 1080p floor. 70 scheduled
posts using the broken build retracted from Buffer (45 deleted via API, 25
blocked by Buffer's 24h rate limit); all affected clips re-rendered.

Also recorded in: the Ledger (Project Decisions + Avoid List), Notion
("Audio Clip Framework — THE FILES WITH DUB"), and the workspace template
pack `readme-x-audio-only-clips/`.


---

**Canonical source — supersedes copies elsewhere.**
