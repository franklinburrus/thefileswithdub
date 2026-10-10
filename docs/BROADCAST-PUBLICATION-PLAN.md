# Automatic broadcast publication plan

STATUS: PLANNED. Automatic replay additions are the agreed goal. Live playback is included as a second phase. No new publisher, schedule, or live player has been enabled by this plan.

OBJECTIVE AND SCOPE:
Every eligible Dub video broadcast reaches `/broadcasts` automatically after its public replay is ready. Visitors watch inside the website. Source records remain in the existing archive; unavailable entries remain hidden from public cards and broadcast search metadata. Keep the current design and the working HLS.js player.

TRIGGER AND DEFINITION OF DONE:
Register each broadcast when it ends, before clipping work. Run one serialized website publisher on that registration and a ten-minute catch-up scan. Target publication within ten minutes of verified replay readiness, plus the normal build and deployment time. Completion requires the exact broadcast to appear once on production and play there, with advancing video frames and working seeking.

ACTORS, PERMISSIONS, AND TOOLS:
Frank owns public eligibility and source authority. The existing broadcast intake owns registration; the website publisher owns validation, generation, preview, deployment, and readback. Reuse the existing Sheet reader, `broadcasts:sync`, Worker, KV, HLS player, and production Wrangler configuration. Verify unattended Sheet access and a suitably scoped deployment credential before enabling the publisher. Current interactive access does not establish unattended access.

INPUTS AND OUTPUTS:
The configured source is the Dub Clip Library Sheet: `Master Library!A1:K` and `Broadcast Titles!A1:B`. The repository reads the source URL from column I, type from J, episode key from K, date from A, and the title by episode key. This is the configured authority; current Sheet contents still require readback at implementation.

Output is a verified public roster, its source revision, a deployed Worker version, and a publication receipt bound to each canonical broadcast ID. Keep originals and failed candidates in the existing private source archive.

WORKFLOW:

| Step | Owner | Action and output | Verification |
| --- | --- | --- | --- |
| 1 Register | Broadcast intake | Record each completed `X Video Broadcast`, canonical X broadcast URL, title, date, and episode key immediately. | Read back the exact source record; do not wait for derivative clips. |
| 2 Validate identity | Website publisher | Accept Dub-owned public video broadcasts with matching `/i/broadcasts/` IDs. Deduplicate by provider and ID. Exclude audio Spaces, unrelated videos, unverified archive keys, and conflicting identities. | Confirm the recorded source, ownership, and title. Quarantine conflicts instead of choosing one silently. |
| 3 Verify replay | Website publisher | Confirm the source is ended and has an available replay. Validate the approved media host, manifest, video rendition, and media segments. | Browser playback has nonzero dimensions and advancing time; seek near the end. A found HTTPS playlist alone is insufficient. |
| 4 Stage roster | Website publisher | Generate only verified entries in a temporary checkout. Compare the normalized roster to the deployed roster. | Identical input is a no-op. Failed reads cannot replace the last good roster. Validate before writing the generated source. |
| 5 Publish | Website publisher | Build and run the existing checks, preview `/broadcasts`, then use the existing production deployment path. | Preserve stylesheet bytes, other page behavior, routes, bindings, and source records. Require a passing preview before deployment. |
| 6 Confirm | Website publisher | Read back production cards, search metadata, and actual playback. Save the source ID, roster hash, Worker version, and result. | The new broadcast appears exactly once; no external navigation is required. A deployment receipt alone is insufficient. |

DECISION GATES AND BRANCHES:
The existing ten-minute Worker cron refreshes URLs for the compiled roster; it does not discover new Sheet records. The first implementation should automate the existing source-sync and deployment path with one publisher. Keep a lock so runs cannot publish over one another. No new storage service or paid X API is required by this design. New broadcasts still require reliable registration; the first implementation gate must prove every broadcast reaches that source.

EXCEPTIONS, RECOVERY, AND ESCALATION:
A delayed replay stays pending and hidden. Retry after ten minutes, thirty minutes, two hours, then the following day. Treat rate limits, authentication failures, and transient upstream errors separately from confirmed source removal. Preserve the last good roster on an infrastructure failure; remove a published source only after its unavailability is confirmed. Keep failed IDs and reasons in the receipt. If a deployment or public readback fails, restore the prior known-good Worker version without changing bindings or deleting archive data.

LIVE PLAYBACK PHASE:
X officially supports off-site broadcast embeds. Capture the canonical ID and public broadcast post as the stream starts; use X's supported broadcast widget/player for the live window. Confirm that anonymous visitors can watch the live video inside `/broadcasts`, then transition the same identity to the verified replay after it ends. Any frame-policy allowance must be isolated to this page. Do not pass a live stream through the current replay extractor or invent a replay from the first playlist found. Validate this phase during a real Dub live broadcast, including reconnects, desktop/mobile playback, and the end-to-replay transition. Live playback is feasible; it is not verified or enabled on the current page.

HANDOFF AND RETENTION:
The existing intake retains originals and source identity. The website publisher retains each publication or failure receipt with the deployed version. Publishing the full broadcast and producing or scheduling social clips remain separate operations.

ASSUMPTIONS, RISKS, AND UNVERIFIED CAPABILITIES:
The current promise is automatic publication of registered, eligible public video replays. X can later withdraw a replay. Permanent availability would require a separately approved copy of the verified full recording on a supported host, with rights, storage, and delivery costs resolved first. No archive migration is included here.

DESIGN CHECKS:
Normal path: registering the same ready video twice produces one card, and the second publisher run performs no deployment. Failure path: an audio Space, incomplete replay, or missing title never becomes a public video card. A failed source read retains the prior roster. These are design walkthroughs; unattended execution and live playback still need implementation tests.

NEXT ACTIONS:
First replace the fixed cover-count assertions in `tests/rendered-html.test.mjs` with per-entry cover validation that retains existing custom artwork. Those assertions currently require exactly 46 branded covers and 10 custom covers, which would reject a new broadcast even when its source is valid. Then implement the registration connection and one automated replay publisher. Prove one new source reaches the live website without manual source edits. Implement and verify live playback at the next actual Dub video broadcast after the replay publisher passes.

REFERENCES:
- Existing implementation: `scripts/broadcasts-sync.mjs`, `app/lib/broadcasts-catalog.ts`, `worker/index.ts`, and `.github/workflows/verify.yml`.
- [Configured source Sheet](https://docs.google.com/spreadsheets/d/17uhDO06vmVEz96YrUnA6aHyV5fL_3AAs3ylOjrYRLwI/edit).
- [X Media Studio broadcast embedding](https://help.x.com/en/using-x/how-to-use-live-producer).
- [X Publish](https://publish.x.com/).
