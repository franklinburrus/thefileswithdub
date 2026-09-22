# IG Reel Format — Apache / Cherokee Video

**Law — effective 2026-09-18, per Frank.** No black letterbox bars on
Instagram, ever. Every IG video post ships as full-bleed 1080×1920 (9:16).
No exceptions.

## The rule

- Instagram: **1080×1920 full-bleed**, H.264 video + AAC audio.
- 16:9 sources convert via **blur-fill**: the sharp 16:9 footage centered in
  front of a blurred, scaled-to-fill copy of the same frame. Never black
  padding, never a destructive hard crop.
- X keeps the native **16:9 landscape** version.
- Audio-only template clips are already native 1080×1920 full-bleed —
  unchanged by this law.

## Why blur-fill, not a crop

A 16:9→9:16 hard center crop keeps only ~31% of the frame width. On
talking-head footage it destroys the framing — faces get cut. Tested and
rejected 2026-09-18. Blur-fill keeps 100% of the frame visible.

## Pipeline contract

Every video clip renders **two variants**:

| Variant | File suffix | Spec | Channel |
|---|---|---|---|
| Landscape | `*_x.mp4` | 16:9, native | X |
| Vertical | `*_ig.mp4` | 1080×1920, blur-fill | Instagram |

Scheduling code must send each variant to its own channel — the old
pattern of one URL for both channels is banned.

## Proven render recipe

```bash
ffmpeg -y -i landscape.mp4 -vf \
 "split[a][b]; \
  [a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,\
  scale=270:480,gblur=sigma=25,scale=1080:1920[bg]; \
  [b]scale=1080:-2[fg]; \
  [bg][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p" \
 -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 128k \
 -movflags +faststart vertical_ig.mp4
```

(The downscale → blur → upscale on the background is ~6× faster than a
full-res gaussian blur and visually identical behind the foreground.)

## Format-fix rules

- Swaps change the **video asset only** — never the caption, never the
  schedule time.
- Already-published posts can't be fixed; only still-scheduled ones get
  swapped.
- Swap via Buffer `editPost` with `assets: [{video: {url}}]`; IG posts also
  require `metadata: {instagram: {type: "reel", shouldShareToFeed: true}}`.

## Origin

2026-09-18: Frank: "transition to posting on IG without the black boxes at
the top and bottom… I want to continue that going forward." 7-27 campaign
clips 1–5 had already published with letterboxing (unfixable); clips 7–8
got vertical re-renders swapped into their scheduled IG posts before
publishing; clip 6's 8:30 AM post published with the letterbox asset
before Buffer's API rate limit cleared and could not be fixed after
publishing; all later clips ship both variants from the start.

Also recorded in: the Ledger (Project Decisions + Avoid List, 2026-09-18),
Notion, AGENTS.md, and MEMORY.md.


---

**Canonical source — supersedes copies elsewhere.**
