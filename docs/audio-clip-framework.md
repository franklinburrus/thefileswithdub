# Audio Clip Framework — THE FILES WITH DUB

**Law — effective 2026-09-17, per Frank.** Every audio-only clip on the Apache
pipeline (Instagram + X) follows this framework. No exceptions.

## The look

- Approved template: **Audio Post Template**
  (Drive `1bieNxpsiJf32ZHULw4GZrikeaIKMpGqI`) — graffiti artwork top, empty
  black middle band for the title, gold waveform bottom. 9:16.
- Render at 1080×1920, H.264 video + AAC audio.
- Title in bold white, centered in the black band
  (DejaVu Sans Bold, ~72px, y≈1170).
- Live waveform over the bottom waveform zone
  (1008×280, centered, y≈1470).

## The waveform rule

- The waveform **must** be generated from the clip's own audio stream
  (e.g. `ffmpeg` `showwaves` fed by the clip audio), frame-synced.
  Decorative or looped waveforms are banned.
- Every render gets a **two-frame sync check** before shipping: extract frames
  at two distant timestamps, crop the waveform band, confirm they differ.
  Identical = broken render, redo it.

## The title rule

- Short (≤45 chars), Title Case, derived from the clip's actual transcript —
  what it's really about.
- Never invent. Flag `NEEDS_HUMAN_REVIEW` when the transcript is unclear.

## What never ships

- Static-logo-card videos, plain audiograms, or any audio post not matching
  the template look. A queued post failing the look is `BLOCKED` until
  re-rendered.
- Format fixes never alter captions or schedule times — video asset only.

## Proven render recipe

```bash
printf '%s' "TITLE" > title.txt
ffmpeg -y -loglevel error -loop 1 -framerate 30 -i template.jpg -i src.mp4 \
 -filter_complex "[0:v]scale=1080:1920[bg]; \
  [1:a]showwaves=s=1008x280:mode=line:rate=30:colors=0xF5A623[wave]; \
  [bg][wave]overlay=(W-w)/2:1470[v1]; \
  [v1]drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf: \
  textfile=title.txt:fontcolor=white:fontsize=72:x=(w-text_w)/2:y=1170, \
  format=yuv420p[v]" \
 -map "[v]" -map 1:a -c:v libx264 -preset medium -crf 20 \
 -c:a aac -b:a 128k -shortest out.mp4
```

Sync check:

```bash
ffmpeg -ss 10 -i out.mp4 -frames:v 1 f1.png
ffmpeg -ss 40 -i out.mp4 -frames:v 1 f2.png
# crop waveform band from each, md5sum — must differ
```

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

Also recorded in: the Ledger (Project Decisions + Avoid List, 2026-09-17),
Notion ("Audio Clip Framework — THE FILES WITH DUB"), and the workspace
template pack `readme-x-audio-only-clips/`.
