// Vinext's Worker bundle imports Cloudflare tracing. Reuse its Node prerender
// loader so these tests can render the bundle while Worker bindings fail closed.
import { registerPrerenderCloudflareLoader } from '../../node_modules/vinext/dist/build/prerender-cloudflare-loader.js';

registerPrerenderCloudflareLoader();
