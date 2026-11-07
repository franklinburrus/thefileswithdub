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

npm run verify passed lint, typecheck, build and105 tests. Lint retains2 pre-existing image warnings. Preview website/coordinator/bootstrap dry runs pass. Preview config targets its own service/DO namespace with no production KV or route. Full scoped evidence is in VERIFICATION.json.

## Release gates and access

Production active deployment observed eb7d4812-117b-4ea3-bac9-e0313e8bd38a; active/rollback version06fbc414-4b3f-4ab7-8152-26c447347c0d (112). Original KV and10-minute cron verified. Live tail connection works. Historical telemetry, billing allowance and existing alert-policy reads returned403/code10000. No alert destination or delivery was verified.

Next required input is confirmation that coordinator usage fits the existing Cloudflare allowance, or explicit authorization for metered usage. Then stage isolated remote preview, warm/read back both feeds, verify real native-mobile playback, deploy the exact accepted commit jointly, verify production, enable schedules and observe their first runs. See RELEASE.md. No new scheduled production runs have occurred because release is gated.

## Implementation rulings

- Used a separate coordinator, as selected, to preserve the website's exact rollback across the new storage migration.
- Retained approved BroadcastTitles dates over conflicting derivative-row dates, keeping original UTC/NewYork metadata in source evidence.
- Moved the isolated working checkout to local Codex storage after dependency reads in Documents stalled; reinstalled the same lockfile without upgrades. Original checkout and recovery archives remain preserved.
- Added private staging warm-up because disabled schedules otherwise produced an empty YouTube feed and unplayable X seed at cutover. Loopback operator checks prevent browser-origin refresh requests.
