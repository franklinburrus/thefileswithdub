# Coordinated release procedure

## Recorded baseline

Website Worker `thefileswithdub`, account `ea7a77735549fff1fba3e54e742e6e7b`, route `www.thefileswithdub.com/*`. Active deployment `eb7d4812-117b-4ea3-bac9-e0313e8bd38a`, version112 `06fbc414-4b3f-4ab7-8152-26c447347c0d` at100%. Original `BROADCASTS_KV` namespace `b6d04834005e47f09602c7a671915747`, cron `*/10 * * * *`. Recheck immediately before release. Full redacted captures and original-source evidence are in the task's external recovery directory, with checksums.

## Preconditions

Run `npm run verify`. Review the source reconciliation, provider failures, credentials and cache tests. Confirm Cloudflare entitlement or obtain approval before activating a paid dependency. Signed-in dashboard review confirmed the existing Workers Paid plan and unused Durable Objects allowances. The API-only subscription read returned403. Historical telemetry reads returned403, so inspect a permitted live tail or restore log-read access for release evidence. Confirm native mobile playback in addition to desktop proof.

## Stage preview

1. Run `wrangler deploy --config wrangler.feeds.jsonc --env preview --dry-run`. Confirm private ingress, preview service name and new preview-only SQLite namespace. Deploy that coordinator only after entitlement approval or verified included allowance. Its scheduled refresh remains disabled.
2. Start a loopback bootstrap relay with `wrangler dev --config wrangler.feed-bootstrap.jsonc --env preview --ip 127.0.0.1 --port 8790`. The relay uses a remote service binding. Execute `curl --fail -X POST -H 'X-Dub-Operator: bootstrap' http://127.0.0.1:8790/bootstrap`. Stop the relay after successful readback.
3. Build with `CLOUDFLARE_ENV=preview npm run build`. Inspect generated `dist/server/wrangler.json` for the preview Worker, preview coordinator service, no production KV and no production route. Deploy this generated configuration. Record exact commit, lockfile/bundle hashes and both Worker versions.
4. The preview coordinator reads the labeled fixture spreadsheet configured in `env.preview.vars.CLIP_LIBRARY_SHEET_ID`. It contains only public catalog fields. Use its row81 for controlled valid/invalid/repeated source tests. Production omits that override and reads the original Master Link List.
5. Test Home, `/broadcasts`, `/files`, `/api/x-broadcasts`, `/api/videos`, `/api/feed-health`, external-only Space links, actual media advancement and seeking on desktop/native mobile. Exercise a controlled source addition, invalid source and repeat run against isolated preview fixtures. Confirm120-second publication visibility, outage preservation and recovery. Never inject failure rows into the live Master Link List.

## Stage production and cut over

1. Reconfirm baseline version and original KV binding. Use the same tested commit and dependency lockfile. Keep coordinator refresh disabled.
2. Deploy production coordinator with `--config wrangler.feeds.jsonc --env production`. It is private and has no website traffic yet. Repeat the loopback relay using `--env production`, warm both feeds, and verify required source identities and newest replay readiness before switching the website.
3. Build with `CLOUDFLARE_ENV=production npm run build`. Inspect emitted config for exact production Worker, route, original KV and production coordinator. Review environment-only differences from the tested preview artifact, then deploy the generated configuration.
4. In a fresh session verify both APIs, all three pages, intended items and advancing playback. Match deployment metadata to the tested commit. Read provider logs through permitted access.
5. After acceptance set coordinator production `FEED_REFRESH_ENABLED` to `true`, deploy that same commit/config, and read back schedules. Record the configuration version. Observe first metadata, playback and YouTube scheduled executions. Future runs remain pending until observed.

## Rollback

On production acceptance failure, restore website version `06fbc414-4b3f-4ab7-8152-26c447347c0d` using the project-local Wrangler rollback command and exact Worker name. Verify route, original KV, public API counts and restored public behavior. The coordinator's resources are separate, so their migration does not cross the website rollback boundary. Disable coordinator scheduled publication and retain its state for diagnosis. Do not delete snapshots or change original KV data during rollback.

Commands shown without an executable prefix use `./node_modules/.bin/wrangler`. Keep OAuth files and all secret values outside Git and tool output. The bootstrap configuration is local-only and must never be deployed.
