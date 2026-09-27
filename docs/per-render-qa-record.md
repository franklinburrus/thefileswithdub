# Per-Render QA Record (template)

Copy this file per render. A render record is one gate, not a release verdict.
No post is scheduled while the production hold is in force. Canonical visual
standard: `~/workspace/qa/render-qa-standards.md` (runtime path; current file
and execution evidence must be checked before relying on it).

- **Render:** `<file path>`
- **Lane / platform:** `<tiktok|ig|x|youtube|threads|facebook>`
- **Date:** `<YYYY-MM-DD>`
- **Source of this render:** `<fresh render | cross-posted from <platform> — full checklist re-run per no-inherited-QA law>`
- **Source ID / preserved file / SHA-256:** `<identity, path, hash>`
- **Ingest proof:** `<source completeness receipt and playable probe>` — absent
  proof = BLOCKED before rendering.

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
7. **Source/output binding:** `<source ID and hash, render SHA-256, duration>`

## Render QA verdict

- **PASS** | **FAIL** | **UNKNOWN**
- **Reviewer / time / evidence paths:** `<person, timestamp, frame files, probe output>`
- **If FAIL:** reason + what must change before re-QA.
- **If UNKNOWN:** which check failed and why; never scheduled.

## Separate caption review

- **Verdict:** `<PASS | FAIL | UNKNOWN>`
- **Reviewer / time / evidence:** `<person, timestamp, transcript and caption comparison>`
- A caption PASS does not clear the render.

## Separate supervisor decision

- **Verdict:** `<APPROVED | REJECTED | PENDING>`
- **Reviewer / time / evidence:** `<person, timestamp, reference to the exact caption and render records>`
- A render PASS does not imply supervisor approval.

## Delivery readback

- **Provider / exact file ID / parent:** `<provider, ID, folder>`
- **Provider checksum / permissions / readback time:** `<hash, access level, timestamp>`
- **Result:** `<VERIFIED | BLOCKED>` — BLOCKED if any evidence is absent or
  differs from the approved render. A local file or upload start is not delivery.
- **Publication:** verify the destination post itself before recording LIVE.
- **Hold:** even complete records do not lift Frank's production hold.

## Asset integrity (Law 1)

- `verify_asset.sh` result: `<PASS — streams + 85% seek frame extracted>`
