# Dependency security remediation

## Mission and acceptance

Resolve the 21-package baseline audit while preserving feeds, playback and monitoring. Critical/high findings must be zero. Any remaining moderate finding needs evidence, an owner and a dated follow-up. Production requires candidate-specific native-mobile acceptance and the existing guarded deployment. Token rotation remains scheduled for January 22–29, 2027.

## Preserved baseline

- Source commit `870ebc5bb8ae99a15b3d50183a3d297a927384a9`.
- Production website and rollback version `997885fa-9df7-43ea-82b0-b8bfe73e0577`, verified through Wrangler deployment and version readbacks before edits.
- Account `ea7a77735549fff1fba3e54e742e6e7b`, original KV `b6d04834005e47f09602c7a671915747`, private production feed service and existing route are retained by deployment guards.
- Fresh browser baseline has 77 X entries, 14 Spaces and 15 YouTube uploads. Newest YouTube upload is `CHn78k5opc8`. Compare identities with the live accepted snapshot because publication continues independently.
- Audit reports 21 affected package names, including inherited findings. GitHub reports 36 open advisory alerts. These count different units.

## Package dispositions

| Package | Baseline severity | Resolved versions | Exposure and disposition |
| --- | --- | --- | --- |
| `@cloudflare/vite-plugin` | high | 1.67.0 | Build and development integration, inherits Miniflare/Wrangler advisories. |
| `@typescript-eslint/eslint-plugin` | moderate | 8.70.0 | Lint/type parsing toolchain, inherits the typescript-estree/minimatch advisory. |
| `@typescript-eslint/parser` | moderate | 8.70.0 | Lint/type parsing toolchain, inherits the typescript-estree/minimatch advisory. |
| `@typescript-eslint/type-utils` | moderate | 8.70.0 | Lint/type parsing toolchain, inherits the typescript-estree/minimatch advisory. |
| `@typescript-eslint/typescript-estree` | moderate | 8.70.0 | Lint/type parsing toolchain, inherits the typescript-estree/minimatch advisory. |
| `@typescript-eslint/utils` | moderate | 8.70.0 | Lint/type parsing toolchain, inherits the typescript-estree/minimatch advisory. |
| `@vercel/og` | moderate | 1.0.3 | Vinext OG shim delegates here. Patched Satori and fflate remove inherited alerts. |
| `eslint-config-next` | moderate | 16.4.1 | Lint/type parsing toolchain, inherits the typescript-estree/minimatch advisory. |
| `fast-uri` | moderate | 3.1.9 | Build-time schema URI resolution through Webpack/Ajv. |
| `miniflare` | high | 5.20261101.0-beta | Local Worker simulator used in development and tests, inherits Undici/Sharp advisories. |
| `minimatch` | moderate | 11.0.1, 3.1.5 | TypeScript ESLint project-service glob matching. Scope override to typescript-estree preserves minimatch 3. |
| `next` | critical | 16.4.1 | Manifest/runtime dependency. Worker router resolves through Vinext. No application OG, Server Action, use-cache or Draft Mode declarations. Next is patched regardless of reachability. |
| `satori` | moderate | 0.33.5 | OG rendering dependency through Vinext. No application OG route or ImageResponse call found. Patched with its pinned ZIP dependency. |
| `sharp` | high | 0.35.5 | Next and Miniflare native image dependency. Worker image path uses Vinext passthrough with no IMAGES binding. SVG remains blocked by default. |
| `source-map-js` | high | 1.2.2 | Build source-map parsing through PostCSS and Next. |
| `typescript-eslint` | moderate | 8.70.0 | Lint/type parsing toolchain, inherits the typescript-estree/minimatch advisory. |
| `undici` | high | 7.30.1 | Cloudflare local runtime HTTP client through Miniflare. Production Workers use platform fetch. |
| `vinext` | moderate | 1.4.4 | Production router and framework shims. Upgrade and test actual emitted handlers. |
| `vite` | high | 8.3.6 | Build and local development server. Public production serves compiled Worker output. |
| `wrangler` | high | 4.156.1 | Deployment and local development tool, inherits Miniflare advisories. |
| `zod` | high | 4.6.7 | Lint-time schema validation through eslint-plugin-react-hooks. |

## GitHub advisory inventory

Every baseline open alert is mapped below. A dependency declaration alone does not demonstrate exploitability. All affected package versions are nevertheless replaced.

| Alert | GHSA | Package | Fixed baseline | Disposition |
| --- | --- | --- | --- | --- |
| 63 | [GHSA-8436-99hf-9mmv](https://github.com/advisories/GHSA-8436-99hf-9mmv) | `undici` | 7.29.1 | Patched dependency tree. Cloudflare local runtime HTTP client through Miniflare. Production Workers use platform fetch. |
| 64 | [GHSA-w293-vg96-wgc3](https://github.com/advisories/GHSA-w293-vg96-wgc3) | `undici` | 7.29.1 | Patched dependency tree. Cloudflare local runtime HTTP client through Miniflare. Production Workers use platform fetch. |
| 65 | [GHSA-2gqq-gqf2-x968](https://github.com/advisories/GHSA-2gqq-gqf2-x968) | `undici` | 7.29.1 | Patched dependency tree. Cloudflare local runtime HTTP client through Miniflare. Production Workers use platform fetch. |
| 66 | [GHSA-2jfj-6hjv-fm6j](https://github.com/advisories/GHSA-2jfj-6hjv-fm6j) | `undici` | 7.29.1 | Patched dependency tree. Cloudflare local runtime HTTP client through Miniflare. Production Workers use platform fetch. |
| 69 | [GHSA-r53p-7pc4-xj5r](https://github.com/advisories/GHSA-r53p-7pc4-xj5r) | `undici` | 7.29.1 | Patched dependency tree. Cloudflare local runtime HTTP client through Miniflare. Production Workers use platform fetch. |
| 70 | [GHSA-pmjh-fq2x-6v4x](https://github.com/advisories/GHSA-pmjh-fq2x-6v4x) | `undici` | 7.29.1 | Patched dependency tree. Cloudflare local runtime HTTP client through Miniflare. Production Workers use platform fetch. |
| 71 | [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j) | `next` | 16.3.6 | Patched dependency tree. Manifest/runtime dependency. Worker router resolves through Vinext. No application OG, Server Action, use-cache or Draft Mode declarations. Next is patched regardless of reachability. |
| 73 | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | `source-map-js` | 1.2.2 | Patched dependency tree. Build source-map parsing through PostCSS and Next. |
| 74 | [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) | `sharp` | 0.35.5 | Patched dependency tree. Next and Miniflare native image dependency. Worker image path uses Vinext passthrough with no IMAGES binding. SVG remains blocked by default. |
| 75 | [GHSA-cjq9-62q9-8jv4](https://github.com/advisories/GHSA-cjq9-62q9-8jv4) | `next` | 16.3.8 | Patched dependency tree. Manifest/runtime dependency. Worker router resolves through Vinext. No application OG, Server Action, use-cache or Draft Mode declarations. Next is patched regardless of reachability. |
| 76 | [GHSA-mcj8-r9mp-w47p](https://github.com/advisories/GHSA-mcj8-r9mp-w47p) | `next` | 16.3.8 | Patched dependency tree. Manifest/runtime dependency. Worker router resolves through Vinext. No application OG, Server Action, use-cache or Draft Mode declarations. Next is patched regardless of reachability. |
| 77 | [GHSA-f87g-xv8r-7p7x](https://github.com/advisories/GHSA-f87g-xv8r-7p7x) | `next` | 16.3.8 | Patched dependency tree. Manifest/runtime dependency. Worker router resolves through Vinext. No application OG, Server Action, use-cache or Draft Mode declarations. Next is patched regardless of reachability. |
| 78 | [GHSA-39w2-rjm5-chcv](https://github.com/advisories/GHSA-39w2-rjm5-chcv) | `next` | 16.3.8 | Patched dependency tree. Manifest/runtime dependency. Worker router resolves through Vinext. No application OG, Server Action, use-cache or Draft Mode declarations. Next is patched regardless of reachability. |
| 79 | [GHSA-4jqv-mc3x-m676](https://github.com/advisories/GHSA-4jqv-mc3x-m676) | `next` | 16.3.8 | Patched dependency tree. Manifest/runtime dependency. Worker router resolves through Vinext. No application OG, Server Action, use-cache or Draft Mode declarations. Next is patched regardless of reachability. |
| 80 | [GHSA-3w37-wq28-93x7](https://github.com/advisories/GHSA-3w37-wq28-93x7) | `next` | 16.3.8 | Patched dependency tree. Manifest/runtime dependency. Worker router resolves through Vinext. No application OG, Server Action, use-cache or Draft Mode declarations. Next is patched regardless of reachability. |
| 82 | [GHSA-698v-4r3x-3vcv](https://github.com/advisories/GHSA-698v-4r3x-3vcv) | `vite` | 8.3.3 | Patched dependency tree. Build and local development server. Public production serves compiled Worker output. |
| 84 | [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm) | `vite` | 8.3.3 | Patched dependency tree. Build and local development server. Public production serves compiled Worker output. |
| 86 | [GHSA-r825-w8mm-5pxw](https://github.com/advisories/GHSA-r825-w8mm-5pxw) | `vite` | 8.3.3 | Patched dependency tree. Build and local development server. Public production serves compiled Worker output. |
| 88 | [GHSA-vfpm-58rq-9qcg](https://github.com/advisories/GHSA-vfpm-58rq-9qcg) | `vite` | 8.3.3 | Patched dependency tree. Build and local development server. Public production serves compiled Worker output. |
| 90 | [GHSA-9jrq-w75r-8gcw](https://github.com/advisories/GHSA-9jrq-w75r-8gcw) | `vite` | 8.3.3 | Patched dependency tree. Build and local development server. Public production serves compiled Worker output. |
| 92 | [GHSA-rq7h-c2jc-7f22](https://github.com/advisories/GHSA-rq7h-c2jc-7f22) | `vite` | 8.3.3 | Patched dependency tree. Build and local development server. Public production serves compiled Worker output. |
| 93 | [GHSA-wjr9-j795-jxcr](https://github.com/advisories/GHSA-wjr9-j795-jxcr) | `fast-uri` | 3.1.9 | Patched dependency tree. Build-time schema URI resolution through Webpack/Ajv. |
| 95 | [GHSA-xjj6-f33q-929c](https://github.com/advisories/GHSA-xjj6-f33q-929c) | `undici` | 7.30.1 | Patched dependency tree. Cloudflare local runtime HTTP client through Miniflare. Production Workers use platform fetch. |
| 96 | [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw) | `next` | 16.4.1 | Patched dependency tree. Manifest/runtime dependency. Worker router resolves through Vinext. No application OG, Server Action, use-cache or Draft Mode declarations. Next is patched regardless of reachability. |
| 97 | [GHSA-p3m5-59mp-jv5r](https://github.com/advisories/GHSA-p3m5-59mp-jv5r) | `next` | 16.4.1 | Patched dependency tree. Manifest/runtime dependency. Worker router resolves through Vinext. No application OG, Server Action, use-cache or Draft Mode declarations. Next is patched regardless of reachability. |
| 98 | [GHSA-673q-mjm6-r5xr](https://github.com/advisories/GHSA-673q-mjm6-r5xr) | `next` | 16.4.1 | Patched dependency tree. Manifest/runtime dependency. Worker router resolves through Vinext. No application OG, Server Action, use-cache or Draft Mode declarations. Next is patched regardless of reachability. |
| 99 | [GHSA-w74x-v6f9-j3xg](https://github.com/advisories/GHSA-w74x-v6f9-j3xg) | `fast-uri` | 3.1.9 | Patched dependency tree. Build-time schema URI resolution through Webpack/Ajv. |
| 100 | [GHSA-333x-w4r6-6crp](https://github.com/advisories/GHSA-333x-w4r6-6crp) | `fast-uri` | 3.1.9 | Patched dependency tree. Build-time schema URI resolution through Webpack/Ajv. |
| 101 | [GHSA-xhq7-xmqj-769h](https://github.com/advisories/GHSA-xhq7-xmqj-769h) | `fast-uri` | 3.1.9 | Patched dependency tree. Build-time schema URI resolution through Webpack/Ajv. |
| 102 | [GHSA-wx4j-mvgx-mqwp](https://github.com/advisories/GHSA-wx4j-mvgx-mqwp) | `satori` | 0.33.5 | Patched dependency tree. OG rendering dependency through Vinext. No application OG route or ImageResponse call found. Patched with its pinned ZIP dependency. |
| 104 | [GHSA-4w7w-5xrc-9h26](https://github.com/advisories/GHSA-4w7w-5xrc-9h26) | `undici` | 7.30.1 | Patched dependency tree. Cloudflare local runtime HTTP client through Miniflare. Production Workers use platform fetch. |
| 105 | [GHSA-qrxm-fqhp-jwvm](https://github.com/advisories/GHSA-qrxm-fqhp-jwvm) | `undici` | 7.30.1 | Patched dependency tree. Cloudflare local runtime HTTP client through Miniflare. Production Workers use platform fetch. |
| 106 | [GHSA-9fm3-97px-rjf6](https://github.com/advisories/GHSA-9fm3-97px-rjf6) | `undici` | 7.30.1 | Patched dependency tree. Cloudflare local runtime HTTP client through Miniflare. Production Workers use platform fetch. |
| 107 | [GHSA-2m5v-pch6-74hx](https://github.com/advisories/GHSA-2m5v-pch6-74hx) | `undici` | 7.30.1 | Patched dependency tree. Cloudflare local runtime HTTP client through Miniflare. Production Workers use platform fetch. |
| 109 | [GHSA-h694-7cp9-m8p3](https://github.com/advisories/GHSA-h694-7cp9-m8p3) | `next` | 16.3.8 | Patched dependency tree. Manifest/runtime dependency. Worker router resolves through Vinext. No application OG, Server Action, use-cache or Draft Mode declarations. Next is patched regardless of reachability. |
| 111 | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) | `minimatch` | 11.0.1 | Patched dependency tree. TypeScript ESLint project-service glob matching. Scope override to typescript-estree preserves minimatch 3. |

## Vinext reachability review

- `worker/index.ts` imports `vinext/server/app-router-entry`. Built output includes Vinext image handling and tracing. It does not execute the Next CLI server.
- Application code uses `next/image`. `next.config.ts` has no custom image options, SVG allowance or remote patterns. Both image endpoint aliases reject remote, protocol-relative and recursive sources. SVG content is rejected before transformation.
- No application `use cache`, `use server`, `next/og`, `ImageResponse` or dynamic OG image declaration was found. Vinext owns its compatibility implementations. This observation limits demonstrated reachability and does not substitute for patching Next.
- The SVG optimization RCE advisory requires the vulnerable native rendering path, including the stated glibc prerequisites. The Worker uses a passthrough handler without an IMAGES binding, and the native Sharp package is upgraded to 0.35.5 for local tools.
- Three critical Next advisories are covered by Next 16.4.1. Their identities are GHSA-673q-mjm6-r5xr, GHSA-2464-fhr4-w9xw and GHSA-vcvr-r3jv-pc5j. Cache/SSG/ISR, image SSRF and action DoS advisories are tracked individually in the inventory.

## Compatibility decisions

- Next and ESLint configuration stay aligned at 16.4.1. Cloudflare plugin 1.67.0 and Wrangler 4.156.1 share Miniflare 5.20261101.0-beta, Undici 7.30.1 and Sharp 0.35.5.
- Vinext 1.4.4 requires the React/React DOM/RSC 19.3.1 family and RSC plugin 0.5.37. Its OG 1.0.3 dependency supplies Satori 0.33.5.
- Latest checked typescript-estree 8.72.1 still requests minimatch ^10.2.2. The scoped override selects 11.0.1 only under typescript-estree. Tests exercise dot-file matching, nested paths and TypeScript parsing.
- Satori 0.33.5 pins fflate 0.7.3, introducing GHSA-px8p-9vwx-vf98 and four inherited moderate findings after the planned upgrades. A Satori-scoped override selects patched 0.7.5. ZIP round-trip and OG rendering checks validate this compatible patch upgrade.
- Vinext now statically imports Cloudflare tracing. Existing Node bundle tests initially failed with ERR_UNSUPPORTED_ESM_URL_SCHEME. Their bootstrap reuses Vinext’s own Node prerender loader. Real SQLite Worker and monitor runtime tests continue running through Miniflare.

## Verification and release state

Clean `npm ci`, `npm ls --all`, lint, type checking, build and all 155 tests passed. The count increased from 149 through six image/action/OG/parser/ZIP tests. Two existing image lint warnings remain. Fresh npm audit reports zero vulnerabilities at every severity. An independent review found no critical, important or minor issues. Evidence is stored outside Git under `.wrangler/security`.

Preview testing found a homepage title compatibility change because the root layout title template no longer applies to the same-segment page. `metadataFor` now supplies absolute branded titles, preserving prior public titles. The homepage regression assertion failed before this fix and passed after it, with all 155 tests passing.

Production remains gated on preview acceptance and fresh candidate-specific native-mobile playback. Record exact commit, versions and acceptance in the existing external checkpoint before release. No credential values belong in these records.
