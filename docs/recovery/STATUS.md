# The Files with Dub recovery — 2026-11-07

PARTIALLY COMPLETE. Implementation and source reconciliation are committed as a release candidate after local verification. Remote preview and production release await the gates below.

## Mission and authority

Repair automatic X/YouTube publication and preserve accepted content during failure. Authorized investigation, implementation, tests, commits, source reconciliation, required Cloudflare configuration and deployment after release gates. Preserve source work, originals and credentials. Obtain approval before activating a paid dependency. Exclude redesign and social publication.

Acceptance requires preserved source identity sets, both target X IDs once, invalid-source rejection, atomic/idempotent runtime updates, independent jobs, accurate health, complete checks, isolated preview, advancing desktop/native-mobile playback, exact tested commit, confirmed rollback and observed first scheduled runs.

## Verified implementation

Base GitHub main c2f1b97465dd492883e9f06cfd618de4b9b87dc2. Missing checkpoint commits06e11c7/cf0bcda/198e95c were unavailable in GitHub and surviving Git metadata; reconstructed against current authoritative sources. Authoritative working branch codex/recovery-automation-20261107 at /Users/frank/.codex/workspaces/thefileswithdub-release-20261107.

Original source archive SHA256 3e3c3d0b6730d4f6f954bbd026229919813c67441ddd734e2e69f3088b501eaa; full Git metadata archive1fb799ca7e1a91b190fc65d79997879ed50466a8950fa3e043af34b77e2a75f6. Archives and original metadata evidence are outside Git in /Users/frank/Documents/Codex/2026-11-07/mission-finish-the-remaining-repair-automation/recovery.

Reconciled79 catalog entries,23 additions,all56 baseline entries preserved,0 removals/metadata changes. Verified22 missing baseline source mappings and an additional status-linked Space. Preserved3 approved titles; added20 titles at BroadcastTitles A62:C81 with exact readback. Canonicalized MasterLibrary J4264 with original status retained in cellnote. Both targetIDs appear once. Identical live sync returns no changes.

Implemented separate private coordinator with per-feed SQLite Durable Objects, generation checks, atomic publication, YouTube last-known-good/recovery, per-source playback ages, health and versioned cache content. Public APIs cannot invoke private refresh paths. Private loopback warming verifies staged feeds before cutover while schedules remain disabled. Original production KV stays outside new jobs.

Repaired verified /a/Transcoding rendition paths with shared URL validation. Actual October master/rendition/segment each returned200. Desktop playback advanced for October29 and November5. Browser fixtures verified publication after one61-second poll, preserved active playback, YouTube outage/recovery, failed-candidate retry and frequent progress events. Mobile390x844 layout/playback passed desktop emulation; native mobile remains pending.

npm run verify passed lint, typecheck, build and107 tests after adding the isolated preview worksheet selector. Lint retains2 pre-existing image warnings. Preview website/coordinator/bootstrap dry runs pass. Preview config targets its own service/DO namespace with no production KV or route. Full scoped evidence is in VERIFICATION.json.

## Release gates and access

Production active deployment observed eb7d4812-117b-4ea3-bac9-e0313e8bd38a; active/rollback version06fbc414-4b3f-4ab7-8152-26c447347c0d (112). Original KV and10-minute cron verified. Live tail connection works. Historical telemetry, billing allowance and existing alert-policy reads returned403/code10000. No alert destination or delivery was verified.

Signed-in dashboard review verified Workers Paid at5USD/month plus usage. Billing period October9–November9 showed44.96k/10M requests,1.71M/30M CPU milliseconds,70.3k/20M observability events and18/6000 build minutes. Durable Objects usage was0 before staging. The existing plan includes the required services, and bounded preview work fits the unused allowances. No subscription upgrade is required.

Remote private preview coordinator version c63886cb-811d-40b9-95c0-27d675e2ae1a and website preview version0e7cb7d1-6518-4152-9a4d-c40be17b387a were deployed and provider readback confirmed isolated bindings, private coordinator ingress and no production KV on the website preview. Remote warming accepted79X entries and15YouTube uploads. Remote desktop playback advanced from45.92to47.06seconds at1920x1080. Native phone/browser confirmation has been requested.

The recovery branch's automatic Cloudflare build compiled successfully, but its production-bound version upload failed with code10143 because the production coordinator is not staged yet. It created no website version. Production remains on the recorded baseline.

Next gates are controlled source publication/failure/repeat proofs in the isolated remote preview, native mobile playback, then joint production staging/readback and observed scheduled runs. The labeled source fixture contains only public catalog fields and uses its own spreadsheet and preview feed store. Production uses the original Master Link List default. See RELEASE.md.

## Implementation rulings

- Used a separate coordinator, as selected, to preserve the website's exact rollback across the new storage migration.
- Retained approved BroadcastTitles dates over conflicting derivative-row dates, keeping original UTC/NewYork metadata in source evidence.
- Moved the isolated working checkout to local Codex storage after dependency reads in Documents stalled; reinstalled the same lockfile without upgrades. Original checkout and recovery archives remain preserved.
- Added private staging warm-up because disabled schedules otherwise produced an empty YouTube feed and unplayable X seed at cutover. Loopback operator checks prevent browser-origin refresh requests.

- Added deployment-controlled CLIP_LIBRARY_SHEET_ID using the existing CLI naming pattern so remote preview source tests can use an isolated worksheet. IDs are validated before requests; Google origin and tab gids remain fixed. The production configuration selects the original Master Sheet.
