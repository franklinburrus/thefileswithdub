# Process Upgrades — the Eleven (2026-09-22)

**Law — approved by Frank 2026-09-22.** Five original Project Manager
recommendations plus six practices stolen from Meta's engineering org
(dartai.com, engineering.fb.com, blog.kirillov.cc). All eleven are standing
process law; they live alongside the project map
(`~/workspace/project-map.md`) and the operating manual (`~/AGENTS.md`).

---

## The five PM recommendations

### 1. Definition of Done

Every project carries a written Definition of Done — checkable, no
interpretation needed. Projects had finish lines but no checkable condition,
so closure was a judgment call and work drifted. A project is not closed
until its DoD reads true on the live destination, verified, not asserted.

### 2. Drift register with aging

Every ACTIVE project carries a `last-movement` date. On the daily PM pass
each project is aged; 48 hours of silence without a named reason fires the
kill/chill pop-up AUTOMATICALLY — no waiting for somebody to notice.
Each pop-up is logged with the date fired (the map's Pop-up log).
Parked projects are not aged — their re-check dates fire instead.

### 3. WIP limit

The active project list is capped at TEN. Everything beyond ten gets
explicitly PARKED with a one-line reason and a re-check date — not running
warm, not half-alive, parked. On 2026-09-22 the list sat at 12, so the
newsletter and the dubwiththefiles expansion were parked. Half-alive
projects burn owner bandwidth silently.

### 4. Dependency mapping

Every project lists what it is waiting on — people, assets, approvals,
sign-ins. Hidden blockers (a missing HD file, captions clearance) were
killing downstream work without anyone seeing the chain. The map is scanned
daily; a blocker is a named item, not a rumor.

### 5. Retros

Short retro at the start of every planning cycle — planned / shipped /
worked / didn't. Plus an incident retro after every incident: owner named,
check-back date set. Incidents recurred because nobody logged the fix with
an owner. Open retros stay visible until their check-back closes.

---

## The six Meta steals

### 6. Outcome owners

Every project names ONE person accountable for the OUTCOME — not the
producing lane, the result. Lanes were doing their part while stalls had
no single throat to choke. The owner is the person who escalates when the
outcome is at risk.

### 7. Escalation timeframes

Written windows: lanes → Main within one day; Main → Frank within one
day. Nothing burns longer than a day at any level before it goes up.
A blocker that survives 24h at one level is escalated, not sat on.
Stragglers — anything blocking a downstream project — escalate on the same
clock.

### 8. Contingency playbooks

Recurring failures get pre-written responses. Nobody improvises.

- **P1 — Buffer publish failure.** Recheck the post's status via API/website
  FIRST — Buffer often auto-retries within minutes (the 2026-09-21 8:30 PM
  X "failure" posted 38 seconds later; a false alarm). If genuinely failed,
  retry the publish. If retry fails, backfill the slot with ready QA-passed
  content per the backfill law — never leave an empty slot waiting for a
  decision. Report to Main with evidence (post id, due time, what failed).
- **P2 — Dead render batches.** Verify what is ACTUALLY on disk/Drive — a
  coordinator's "completed" is not completion. Identify the orphaned stage
  (renders done? QA passed? uploaded? reported?). Re-dispatch ONLY the
  missing stage — never restart the whole batch blind. QA re-gates anything
  that moves downstream.
- **P3 — Missed QA gates.** The gate is a wall, not a suggestion. Production
  re-works against the FAIL reasons with evidence. QA re-gates;
  PASS-with-evidence or FAIL-with-reasons only. No self-declared passes,
  no going around the gate. A gate red past 24h → Main; past 48h → Frank.

### 9. Roadmap buckets

Every project and every effort sits in one of three buckets, so the client
sees where the energy goes:

- **Mandates** — the machine keeps running: posting cadences, backfill law,
  queue floors, recaps, briefings, snapshots.
- **Bets** — new upside: voice clone, newsletter, new platforms, daily
  YouTube cadence, podcast launch.
- **Hygiene** — keeps the machine clean: audits, tech debt, re-fetches,
  provenance checks, retros.

### 10. Straggler detection

The dependency map is scanned daily for stragglers — anything blocking a
downstream project. Stragglers escalate on the 1-day clock, named and dated.
Representative stragglers at adoption time: a missing HD episode file
(blocked Patreon video + the YouTube test clip), captions clearance (blocked
Patreon week 1), the client's Apple ID + cover art (blocked the podcast
Apple submission), un-produced MP3s (blocked the podcast launch), stalled
production jobs (blocked Titan pipeline output).

### 11. Incident retros in the standing flow

The standing retros (see #5) already carry the two live incident retros:

- **Wrong-source QA pass (2026-09-22).** A treatment sample was built and
  QA-passed from a local render instead of the canonical Drive folder;
  Frank caught it. Fix locked into law: canonical-source law + mandatory
  QA provenance check before PASS. Owner: Main. Check-back 2026-09-23.
- **Duplicate email sends (2026-09-18).** The same recap went out twice,
  3 minutes apart — send-approval card tapped late plus a manual send.
  Fix: use the card OR the app, never both; never confirm "unsent" without
  a Gmail API check. Owner: Main. Check-back 2026-09-23.

---

## Overlaps, stated plainly

#4 (dependency mapping) and #10 (straggler detection) are one mechanism
seen from two sides: the map names the blockers, the scan escalates them.
#5 (retros) and #11 (incident retros in the flow) are the same practice;
#11 records that the flow is live. Both pairs were approved independently
and are kept separate so each reviewer's list reads complete.

## Where this lives

- **GitHub (source):** this doc — the law, in full, version-controlled.
- **Notion (explanations):** "Eleven Process Upgrades (2026-09-22)" — the
  why, in plain language.
- **The Ledger (learning index):** the learning stories behind each upgrade.
- **Project map:** the per-project wiring (owners, movement dates,
  dependencies, pop-up log).


---

**Canonical source — supersedes copies elsewhere.**
