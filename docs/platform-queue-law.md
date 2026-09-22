# Platform Queue Law

**Law — approved by Frank 2026-09-22. This doc is the canonical text home.**


Standing law: **every platform carries four things** — a production cadence, a
replenishment cadence, a posting cadence, and a problem-solving matrix.
**No queue ever drops below its floor.** When inventory falls below the floor,
the owning production room gets a same-day production order. Backfill law
(AGENTS.md) still applies — empty slots are filled automatically with ready,
QA-passed content.

---

## 1. TikTok — @dubwiththefiles

**Production cadence:** Storm engine renders vertical 1080×1920 clips from
approved Titan selects. ≥5 clips/day, batched daily. Storm vertical spec is law
(full-bleed, no black bars). Every render QA-passed before it enters the queue.

**Replenishment cadence:** Daily depth check (PM's morning verification).
Floor: 15 clips (3 days). Below floor → same-day Storm production order.
Current (2026-09-22): 12 ready → 2.4 days. BELOW FLOOR. Storm owes ≥5/day
starting 2026-09-23.

**Posting cadence:** 5/day — 9:00 AM, 12:00 PM, 3:00 PM, 6:00 PM, 9:00 PM ET.
Method: manual browser post through the saved TikTok login ("just log in and
post"). No API, no Buffer. Oldest ready Storm clip first, captions cleared by
the Captions lane.

**Problem-solving matrix:**

| Symptom | Diagnosis | Fix | Escalate to |
|---|---|---|---|
| CAPTCHA or verification challenge on sign-in | TikTok bot-flagged the session/IP | Stop. Ask Frank (preference: ask). Never solve blind | Main → Frank |
| 6-digit code requested after submit | Email verification | Pull code from ApacheEcho@icloud inbox via Gmail skill, enter within the challenge | Main |
| Password rejected | Rotation or typo | Report rejection; request replacement via secure card | Frank |
| Upload page unreachable / post fails | Account restriction or app-side fault | Screenshot, report; do not retry more than twice | Main |
| Queue below floor | Storm production shortfall | Same-day production order to Storm/Dub:Video | PM |
| Clip fails QA | Spec drift in Storm renders | Reject render, route to Dub:Video for re-render; never post substandard | Media Manager |

---

## 2. YouTube — DUB HERE (@TheFilesWithDub)

**Production cadence:** Dub:Video produces JBP Titan clips with the corrected
YouTube treatment (bottom-left badge + closing clip) from the canonical Drive
folder only ("Joe Budden" → Clips → per-episode folders). ≥1 clip/day,
batched weekly. Titles approved by the Captions lane before treatment.

**Replenishment cadence:** Daily depth check. Floor: 7 title-approved clips.
Below floor → same-day production order to Dub:Video.
Current (2026-09-22): queue 0. Treatment batch in build.

**Posting cadence:** 1/day ~10:06 AM ET. Method: browser upload via the
ApacheEcho Google session (API key deferred). Oldest ready title-approved
clip. **Monetization is law (2026-09-22, Frank):** Watch Page ads ON, YouTube
Premium ON, ad suitability "None of the above", audience "Not made for kids".
Verify monetization before leaving the studio page; an unmonetized published
video is a defect, fixed same run. Description links thefileswithdub.com.

**Problem-solving matrix:**

| Symptom | Diagnosis | Fix | Escalate to |
|---|---|---|---|
| Upload rejected / copyright claim | Content-ID match on JBP material | Review claim, dispute if fair-use clip; hold batch if systemic | Main → Frank |
| Processing stuck >1h | YouTube-side backlog | Wait, re-check; do not re-upload a duplicate | Main |
| Saved Google login expired | Session rotation | Re-run secure sign-in flow | Frank |
| Queue below floor | Dub:Video shortfall | Same-day production order | PM |
| Title not approved | Captions lane backlog | Hold the clip; never post unapproved titles | Captions lane |

---

## 3. Patreon — DUB / CANTDUBME

**Production cadence:** Dub:Video produces X Video Titan clips (1/day);
Dub:Audio produces X Audio Titan clips (1/day). Full episodes → Collections.

**Replenishment cadence:** Daily depth check. Floor: 7 videos + 7 audios.
Below floor → same-day production order to the owning room.
Current (2026-09-22): first post live; queue building.

**Posting cadence:** 2/day — 12:00 PM ET video, 6:00 PM ET audio. Free access
/ visible to everyone (per Frank's standing directive). Method: browser post
via the creator session (Frank's Google SSO).

**Problem-solving matrix:**

| Symptom | Diagnosis | Fix | Escalate to |
|---|---|---|---|
| Video stuck "Loading content" | Patreon player processing | Wait for processing to finish; post stays live meanwhile | Main |
| Session expired / SSO loop | Google session rotation | Re-auth via Frank's Google SSO | Frank |
| Post visible to wrong tier | Audience mis-set | Fix to free access; verify publicly | Main |
| Queue below floor | Production shortfall | Same-day production order | PM |

---

## 4. Apache — X + Instagram (Buffer API only)

**Production cadence:** Dub:Video (video pairs) + Dub:Audio (audio template
clips) deliver finished, QA-passed bundles to Main; Main routes to Apache.
≥5 posts/day sustained (X + IG variants each).

**Replenishment cadence:** Daily depth check via Buffer API. Floor: 35 posts
(7 days). Below floor → backfill automatically per backfill law; production
order to Dub rooms same day.
Current (2026-09-22): 84 scheduled, covers through Sep 27 2:00 PM ET.
Gap Sep 27 2p–Sep 30 11:30a (14 slots) blocked on 14 Sep-19 recuts due Sep 26.

**Posting cadence:** 5/day per the standing Apache slot grid. Method: Buffer
API ONLY — never the browser, never the provider session.

**Problem-solving matrix:**

| Symptom | Diagnosis | Fix | Escalate to |
|---|---|---|---|
| IG editPost rejects caption-only edit | API requires assets/type on IG | Retry with assets + metadata.instagram{type:reel} re-attached | Main |
| Publish-failure email from Buffer | Often a false alarm — Buffer auto-retries | Re-read post status via API first; escalate only if still failed | Main |
| Queue gap with no ready content | Production shortfall | Backfill law: fill with ready QA-passed content; report blocking production | PM |
| X video >2:20 rejected | Duration cap | Cut to cap in production; never ship over | Dub:Video |
| IG video >3:00 rejected | Duration cap | Cut to cap in production | Dub:Video |

---

## 5. Cherokee — X + Instagram (Buffer website only)

**Production cadence:** Cherokee production (Taxstone clips), X + IG pairs.
≥12 posts/day sustained.

**Replenishment cadence:** Daily depth check via buffer.com website (never
the API — Cherokee owns the browser's Buffer session). Floor: 36 posts
(3 days). Below floor → production order to Cherokee room same day.
Current (2026-09-22): full through Sep 30 11:00 AM ET. Replenishment must
land by Sep 28.

**Posting cadence:** 12/day — X: 8:00a, 10:30a, 1:00p, 3:30p, 6:00p, 8:30p ET;
IG: 8:30a, 11:00a, 1:30p, 4:00p, 6:30p, 9:00p ET. Method: Buffer website via
the shared browser ONLY — never the API (single-key constraint).

**Problem-solving matrix:**

| Symptom | Diagnosis | Fix | Escalate to |
|---|---|---|---|
| Buffer session signed into wrong account | Shared-profile collision | Verify Cherokee/Taxstone session before any action; never touch Apache's key | Main |
| Queue below floor | Production shortfall | Production order to Cherokee room | PM |
| Caption/content mismatch | Caption writing error | Flag NEEDS_HUMAN_REVIEW; corrections via Captions lane, held for approval | QA Supervisor |

---

## 6. Threads — @dubwiththefiles (tabled to 2026-09-23)

**Production cadence:** Captions lane supplies copy; video reuses approved
IG variants. 3 posts/day.

**Replenishment cadence:** Daily depth check. Floor: 3 days (9 posts).

**Posting cadence:** 3/day — 9:00 AM, 1:00 PM, 6:00 PM ET.

**Problem-solving matrix:**

| Symptom | Diagnosis | Fix | Escalate to |
|---|---|---|---|
| Account not yet created | Tabled | Create 2026-09-23 with Frank's direction | Main |
| Instagram linkage required | Threads needs IG/Meta access | Resolve at account setup | Frank |

---

## 7. Facebook — @dubwiththefiles (tabled to 2026-09-23)

**Production cadence:** Reuses approved full-bleed 1080×1920 IG variants.
2 posts/day.

**Replenishment cadence:** Daily depth check. Floor: 3 days (6 posts).

**Posting cadence:** 2/day — 11:00 AM, 6:00 PM ET.

**Problem-solving matrix:**

| Symptom | Diagnosis | Fix | Escalate to |
|---|---|---|---|
| Page not yet created | Tabled | Create 2026-09-23 — requires personal FB login | Frank |
| Personal login unavailable | No credential on file | Secure sign-in or Frank takeover | Frank |

---

## Mechanics (all platforms)

1. **Daily depth check** (PM's morning verification pass): inventory ÷ burn
   rate per platform. Below floor → production order to the owner, same day.
2. **Backfill law** stays: empty slots fill automatically with ready,
   QA-passed content — never held hostage by reserved windows.
3. **QA-before-post**: every clip PASS-with-evidence (Media QA) and every
   caption cleared by the Captions lane before scheduling.
4. **Lane discipline**: Apache = API only; Cherokee = website only; Dub rooms
   produce, never schedule; Main owns handoffs.

## Finish line

Every platform above floor, every deficit cleared, daily depth check green
for 7 consecutive days.

## Kill condition

Frank says stop, or a platform is sunset.
