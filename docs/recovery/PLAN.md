# Recovery implementation plan

1. Preserve source and Git metadata outside Git; reconstruct from current main without changing surviving checkout.
2. Strict shared X worksheet validator and atomic CLI generation. Validate headers, source identities, verified title aliases, dates, duplicates, full identity preservation, no-op repeat runs.
3. Separate private Cloudflare coordinator. Per-feed durable atomic snapshots, lane generations, bounded upstream requests, X metadata/playback separate jobs, YouTube RSS/LKG/recovery and read-only operational health.
4. Website service-binding read path, content-versioned caching, Home/archive runtime metadata, archive-only Space links, client freshness polling, newest actually progressing video selection, proxied HLS chain repair.
5. Reconcile source titles to Sheets with metadata-grounded writes/readback. Generate candidate and explain all identity-set differences.
6. Lint/typecheck/build/full tests and independent review. Verify isolated Cloudflare preview, desktop/native-mobile playback, source publication/failure/recovery/cache proofs.
7. Record exact production rollback target, verify entitlements, deploy same tested commit jointly, public readback and logs. Roll back on acceptance failure. First scheduled runs remain pending until observed.
