# Error-Prevention Laws — created 2026-09-26 (Frank's order)

Every error or rework item from 2026-09-26 gets a law, a safeguard (mechanism),
and a process (steps). Laws already written earlier the same day are referenced,
not repeated.

**Recovery annotation — 2026-09-27:** Paths under `~/workspace/` below refer
to Muse's runtime and are not portable source locations or proof that a check
ran. The audio template source is versioned in LaunchPad at
`templates/audio-post/`; its portability repair is pending in LaunchPad PR #43.
The report, ingest, and delivery guardrails claimed in the Ledger still need
their runtime files, execution logs, and item-level outputs independently
verified. Caption, render, and supervisor verdicts are separate records in
`per-render-qa-record.md`. Production remains held.

## 1. Asset decodability gate (truncated TikTok downloads)

**The error:** 6 of 16 TikTok assets downloaded truncated; container durations
lied, and the first audit pass ran on corrupt bytes.

**Law:** No downloaded media enters QA, transcription, or production until it
passes the decodability check.

**Safeguard:** `~/workspace/ops/verify_asset.sh <file>` — ffprobe must report
video+audio streams and a nonzero duration, AND a frame must extract cleanly at
85% of decodable duration. Either fails → asset is corrupt.

**Process:** download → verify → on fail, re-download (curl `--retry-all-errors`),
re-verify → never proceed on unverified bytes. The 85% seek (not 0%) is the
check that catches truncation.

## 2. Bulk mutation protocol (Buffer delete loop PARSE-ERR)

**The error:** A 13-post delete loop ran with a GraphQL selection set invalid
for the `DeletePostSuccess` union — 13 parse errors, zero confirmed deletes,
then a scramble to determine what actually happened.

**Law:** No unattended batch of writes or deletes runs without a proven shape.

**Safeguard:** Known-good mutation recipes live in AGENTS.md (Buffer GraphQL
notes). A new mutation shape is validated against the API docs or a test call
before batch use.

**Process:**
1. Run ONE mutation; read the full response.
2. Confirm the effect with an INDEPENDENT read (re-query the queue).
3. Only then run the batch, with a short sleep between calls (rate limits).
4. Re-read the full state after and reconcile every ID: present or absent.
5. Any ID whose state can't be proven is UNKNOWN — never "probably deleted."

## 3. Presence claims need fresh live checks (unverified "still live" claim)

**The error:** Stated an X post with the wrong caption was "still live" with no
fresh check behind it.

**Law:** "Post is gone," "post is still live," "queue is empty," "account is
connected" are presence claims. They require a live read in the same run.
Memory, earlier reads, and "last checked" never support them. (Extends the
evidence-before-claims law, 2026-09-25.)

**Safeguard:** Verification scripts prove their own check succeeded (HTTP 200,
non-error payload) before interpreting the result — never convert a missing
response into a clean result (AGENTS.md, 2026-09-25).

## 4. Render timeouts verify outputs before declaring failure (video batch)

**The error:** `batch_render.py`'s 1800s wrapper killed healthy renders AFTER
the MP4s were written but BEFORE the rename step — complete clips were declared
failures and nearly re-rendered.

**Law:** A timeout is a signal to inspect, not a verdict of failure.

**Safeguard:** Render jobs write to temp filenames and rename to final names
only on success — completion is unambiguous on disk.

**Process:** on timeout → ffprobe every output → complete + valid outputs get
promoted/renamed, not re-rendered → only genuinely incomplete outputs rerun.
Wrapper timeouts must exceed the worst-case observed duration with margin.

## 5. Scratch hygiene (/tmp filled to 98%)

**The error:** Stale audit dirs from prior runs filled the 512MB /tmp tmpfs;
large downloads had nowhere to stage.

**Law:** Jobs clean their scratch when done. GB-scale staging never goes to
/tmp.

**Safeguard:** Pre-flight disk check before any GB-scale download.

**Process:** scratch under the goal's `hidden_files/` for large media; remove
intermediate dirs (`/tmp/audit_*`, chunk dirs) at job end. A job that fills the
disk fails loudly instead of producing corrupt partial outputs.

## 6. State files: validate on load, backup on write (Downie mover)

**The error:** `downie-move-state.json` corrupted; recovery required a repair.

**Law:** State files are validated on load and backed up before every write.

**Safeguard:** Load = JSON parse + schema check (expected keys/types). Write =
timestamped backup first (`state.json.bak-YYYYMMDD-HHMM`), then atomic replace.

**Process:** corrupt or unparseable state → restore from the newest valid
backup, re-validate → never hand-edit blind, never write a half-known state.

## 7. Cross-account probes assert identity (Cherokee wrong-account read)

**The error:** A queue probe matched the ambiguous "My Organization" name and
read Apache's queue as Cherokee's state.

**Law:** A probe that reads account state must assert expected identifiers in
the response before treating the data as that lane's state. (Extends the
verify-org/tenant law, 2026-09-25.)

**Safeguard:** Probe scripts hard-code the expected channel names / org ID and
reject the read on mismatch — a rejected read is reported, never recorded.

## 8. Access prerequisites verified before promising (Sean invite)

**The error:** "Give him the invite" couldn't execute — no GitHub username
existed for Sean, and the blocker wasn't surfaced until asked.

**Law:** Before promising access, an invite, or a connection, verify the
prerequisite exists (username, account, email).

**Process:** prerequisite missing → ask the identity holder directly through
the established channel (mailbox for Sean) → report the blocker and the ask
plainly in the same breath. Never stall silently waiting for a missing fact.

## Already law (referenced, not repeated)

- **One-logo gate + no inherited QA** — `~/workspace/qa/render-qa-standards.md`
  (2026-09-26): one brand identity per frame, counted; >1 or 0 identities on
  any checked frame = FAIL; publishing lane re-runs the full checklist.
- **Counts Frank decides on** get verified from transcripts across all surfaces
  before they go out — AGENTS.md (2026-09-26, three-surface rule).
- **Time-triggered remediations re-verify their premise** at fire time —
  AGENTS.md (2026-09-25).
- **Failed checks stay UNKNOWN and loud** — never convert a missing response
  into a clean result — AGENTS.md (2026-09-25).
- **Verify org/tenant after login, before any write** — AGENTS.md (2026-09-25).
- **Per-render QA record** — template: `~/workspace/qa/qa-record-template.md`;
  no post is scheduled without a recorded PASS citing frame evidence.
