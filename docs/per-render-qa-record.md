# Per-Render QA Record (template)

Copy this file per render. No post is scheduled until its render has one of
these with verdict PASS. Canonical standard: `~/workspace/qa/render-qa-standards.md`.

- **Render:** `<file path>`
- **Lane / platform:** `<tiktok|ig|x|youtube|threads|facebook>`
- **Date:** `<YYYY-MM-DD>`
- **Source of this render:** `<fresh render | cross-posted from <platform> — full checklist re-run per no-inherited-QA law>`

## Checks

1. **Dimensions:** `<e.g. 1080x1920 — ffprobe output or "see probe.txt">`
2. **Codecs:** `<e.g. H.264/AAC>`
3. **Format law:** `<full-bleed 1080x1920, no black bars | native 16:9>`
4. **Logo count (counted gate):** frames at 15/50/85% of decodable duration:
   - `<frame path>` — identities: `<n>` — `<what they are>`
   - `<frame path>` — identities: `<n>` — `<what they are>`
   - `<frame path>` — identities: `<n>` — `<what they are>`
   - Rule: >1 distinct identity on any frame = FAIL; 0 identities on any frame = FAIL.
5. **Audio** (where the Audio Clip Framework applies): `<one live waveform — two-frame sync check: crop MD5s differ/don't>`
6. **Title:** `<text>` — `<n> chars, Title Case, in safe box`
7. **Caption-vs-content:** `<caption verified against transcript/visual — evidence>`

## Verdict

- **PASS** | **FAIL** | **UNKNOWN**
- **Evidence paths:** `<frame files, probe output, transcript>`
- **If FAIL:** reason + what must change before re-QA.
- **If UNKNOWN:** which check failed and why; never scheduled.

## Asset integrity (Law 1)

- `verify_asset.sh` result: `<PASS — streams + 85% seek frame extracted>`
