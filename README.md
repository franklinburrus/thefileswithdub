# The Files With Dub

Cloudflare Workers source for The Files With Dub, reconstructed from the verified GPT Sites export. The Game feature is intentionally retired: `/game` must return a normal 404.

## What is included

- Website pages, styles, components, API routes, and static media
- Worker configuration with an asset binding
- Route and source-retirement checks, including `/game` returning 404

## What is not included

- Installed dependencies (`node_modules`)
- Generated builds and local runtime caches
- Git history
- Environment files or account credentials

## Run locally

Use Node.js 22.13 or later, then:

```bash
npm ci
npm run dev
```

To produce a production build:

```bash
npm run build
```

## Cloudflare deployment guardrails

The repository pins the intended Cloudflare account and disables `workers.dev` production exposure. A deployment must be verified against the intended account, previewed, and then separately authorized before any custom-domain route or DNS change.

`EVENTBRITE_PUBLIC_TOKEN` is required only to populate the live nightlife listings. It must be set as a Cloudflare secret; do not commit it or put it in a source-controlled vars file.

The Worker applies a baseline security policy to every response (CSP, HSTS,
frame protection, MIME sniffing protection, referrer policy, and a restricted
permissions policy). Third-party feed requests have timeouts and response-size
limits. The replay proxy accepts only HTTPS HLS URLs on the approved
`*.video.pscp.tv` host pattern and rewrites only approved replay resources.

The default Wrangler configuration is intentionally unrouted. Use
`npx @vinext/cloudflare deploy --preview` for QA. A production cutover must
explicitly use `--env production` after the preview and infrastructure checks
pass. Cloudflare account-level WAF, rate limiting, and zone security settings
remain managed outside this repository.

## Verify locally

```bash
npm run verify
```

Source snapshot: `3646ec97c3afca82cf809ec63341ee0837a3a67c`
