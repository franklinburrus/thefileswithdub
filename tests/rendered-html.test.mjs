import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders The Files With Dub media platform", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /The Files With Dub/i);
  assert.match(html, /THE CULTURE/i);
  assert.match(html, /BOOK THE STUDIO/i);
  assert.match(html, /https:\/\/www\.patreon\.com\/cw\/CANTDUBME/i);
  assert.doesNotMatch(html, /Watch it\.\s*Listen close/i);
  assert.doesNotMatch(html, /Your site is taking shape/i);
  assert.doesNotMatch(html, /codex-preview/i);
});

test("uses the live Shopify storefront instead of simulated commerce", async () => {
  const page = await readFile(new URL("../app/components/files-platform.tsx", import.meta.url), "utf8");
  assert.match(page, /https:\/\/9p7whp-1k\.myshopify\.com/i);
  assert.match(page, /Shop the drop/i);
  assert.doesNotMatch(page, /Add to demo bag/i);
  assert.doesNotMatch(page, /SIMULATED COMMERCE/i);
});

test("places X immediately after The Files in navigation", async () => {
  const navigation = await readFile(new URL("../app/components/site-navigation.tsx", import.meta.url), "utf8");
  assert.ok(navigation.indexOf('["The Files", "/files"]') < navigation.indexOf('["X", "/broadcasts"]'));
  assert.ok(navigation.indexOf('["X", "/broadcasts"]') < navigation.indexOf('["Patreon", "/patreon"]'));
  assert.ok(navigation.indexOf('["Patreon", "/patreon"]') < navigation.indexOf('["Outside", "/outside"]'));
  assert.ok(navigation.indexOf('["Spill", "/spill"]') < navigation.indexOf('["Shop", "/affiliate"]'));
  assert.ok(navigation.indexOf('["Shop", "/affiliate"]') < navigation.indexOf('["Contact", "/contact"]'));
  assert.doesNotMatch(navigation, /X Broadcasts|\?page=/);
});

test("keeps standalone pages in the Files navigation", async () => {
  const navigation = await readFile(new URL("../app/components/site-navigation.tsx", import.meta.url), "utf8");
  const affiliate = await readFile(new URL("../app/affiliate/page.tsx", import.meta.url), "utf8");
  const broadcasts = await readFile(new URL("../app/broadcasts/page.tsx", import.meta.url), "utf8");
  const patreon = await readFile(new URL("../app/patreon/page.tsx", import.meta.url), "utf8");
  assert.match(navigation, /\["X", "\/broadcasts"\]/);
  assert.match(navigation, /\["Shop", "\/affiliate"\]/);
  assert.match(navigation, /menu-button/);
  assert.match(navigation, /Escape/);
  assert.match(affiliate, /<SiteNavigation \/>/);
  assert.match(broadcasts, /<SiteNavigation \/>/);
  assert.match(patreon, /<SiteNavigation \/>/);
});

test("uses real routes for every internal destination", async () => {
  const navigation = await readFile(new URL("../app/components/site-navigation.tsx", import.meta.url), "utf8");
  const platform = await readFile(new URL("../app/components/files-platform.tsx", import.meta.url), "utf8");
  const appFiles = [
    navigation,
    platform,
    await readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ].join("\n");
  assert.doesNotMatch(appFiles, /\?page=|requestedPage|window\.history\.pushState/);
  for (const destination of ["/files", "/outside", "/studio", "/consulting", "/spill", "/contact", "/about"]) {
    assert.match(navigation, new RegExp(`"${destination}"`));
  }
  assert.match(platform, /router\.push\(pageRoutes\[next\]\)/);
});

test("each public route server-renders its unique page content", async () => {
  const expectations = new Map([
    ["/files", /THE FILES \/ ALL CLIPS/i],
    ["/outside", /OUTSIDE \/ NYC NIGHTS/i],
    ["/studio", /THE STUDIO \/ SCHEDULING/i],
    ["/consulting", /DUB CONSULTING \/ SCHEDULING/i],
    ["/spill", /THE TIP LINE/i],
    ["/contact", /Find the right/i],
    ["/about", /ABOUT THE FILES/i],
  ]);
  for (const [path, pattern] of expectations) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), pattern, path);
  }
});

test("retained pages expose one primary heading and labeled form controls", async () => {
  const routes = ["/", "/files", "/outside", "/studio", "/consulting", "/spill", "/contact", "/about", "/broadcasts", "/patreon"];
  for (const path of routes) {
    const response = await render(path);
    const html = await response.text();
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${path} should have one h1`);
    assert.match(html, /href="#main-content"/);
    assert.match(html, /id="main-content"/);
  }

  const forms = await readFile(new URL("../app/components/site-forms.tsx", import.meta.url), "utf8");
  for (const id of ["contact-purpose", "contact-name", "contact-email", "contact-message", "tip-message", "tip-source", "tip-follow-up"]) {
    assert.match(forms, new RegExp(`htmlFor=\\"${id}\\"`));
  }
  const contact = await (await render("/contact")).text();
  const spill = await (await render("/spill")).text();
  assert.match(contact, /CONTACT DELIVERY PENDING/);
  assert.match(spill, /TIP LINE DELIVERY PENDING/);
});

test("redirects external HTTP requests to HTTPS at the Worker boundary", async () => {
  const worker = (await import(new URL("../dist/server/index.js", import.meta.url).href)).default;
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const response = await worker.fetch(new Request("http://www.thefileswithdub.com/files?from=http"), env, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.thefileswithdub.com/files?from=http");

  for (const path of ["/game", "/game/", "/game/anything"]) {
    const retired = await worker.fetch(new Request(`https://www.thefileswithdub.com${path}`), env, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(retired.status, 404, path);
    assert.match(retired.headers.get("content-type") ?? "", /text\/plain/);
  }
});

test("retires the Game route and every source entry point", async () => {
  const response = await render("/game");
  assert.equal(response.status, 404);

  const navigation = await readFile(new URL("../app/components/site-navigation.tsx", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(navigation, /\bGame\b|\/game/);
  assert.doesNotMatch(layout, /\bGame\b|\/game/);
});

test("routes Patreon members to the native signed-in experience", async () => {
  const page = await readFile(new URL("../app/patreon/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/start-here.css", import.meta.url), "utf8");
  assert.match(page, /https:\/\/www\.patreon\.com\/cw\/CANTDUBME/i);
  assert.match(page, /Watch on Patreon/i);
  assert.match(page, /Join or sign in/i);
  assert.match(page, /target="_self"/i);
  assert.match(page, /already signed in/i);
  assert.match(page, /cant-dub-me-logo\.png/);
  assert.match(page, /width=\{2400\}/);
  assert.match(page, /height=\{2400\}/);
  assert.match(page, /patreon-feature-image/);
  assert.match(styles, /\.patreon-card\{display:grid;grid-template-columns:minmax\(0,1\.05fr\) minmax\(340px,\.95fr\)/i);
  assert.match(styles, /\.patreon-feature-image\{position:relative;display:grid;place-items:center;min-height:420px[^}]*background:#050505/);
  assert.match(styles, /\.patreon-feature-image img\{display:block;width:min\(88%,680px\)[^}]*object-fit:contain;object-position:center/);
});

test("renders Dub's Amazon products as a native sponsored grid", async () => {
  const page = await readFile(new URL("../app/affiliate/page.tsx", import.meta.url), "utf8");
  const catalog = await readFile(new URL("../app/affiliate/catalog.ts", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/start-here.css", import.meta.url), "utf8");
  assert.match(catalog, /https:\/\/www\.amazon\.com\/shop\/dubhere\/list\/297YHKL7CRWUL/i);
  assert.equal((catalog.match(/sponsoredDestination: cantDubUsStore/g) ?? []).length, 12);
  assert.match(page, /amazonProducts\.map/);
  assert.match(page, /amazon-product-grid/i);
  assert.match(page, /amazon-product-card/i);
  assert.match(catalog, /amazon-african-black-soap\.png/i);
  assert.match(catalog, /amazon-raw-rolling-papers\.png/i);
  assert.match(catalog, /amazon-herb-pharm-damiana\.png/i);
  assert.match(page, /amazon-native-bar/i);
  assert.match(page, /As an Amazon Associate, The Files With Dub earns from qualifying purchases/i);
  assert.match(page, /rel="sponsored noreferrer"/i);
  assert.doesNotMatch(page, /<iframe/i);
  assert.match(styles, /\.amazon-product-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/i);
  assert.match(styles, /@media\(max-width:520px\)\{\.amazon-product-grid\{grid-template-columns:1fr\}/i);
});

test("publishes a full-size X broadcast replay view with the official X player", async () => {
  const page = await readFile(new URL("../app/broadcasts/page.tsx", import.meta.url), "utf8");
  const player = await readFile(new URL("../app/components/hls-video.tsx", import.meta.url), "utf8");
  const api = await readFile(new URL("../app/api/x-broadcasts/route.ts", import.meta.url), "utf8");
  const proxy = await readFile(new URL("../app/api/x-media/route.ts", import.meta.url), "utf8");
  const catalog = await readFile(new URL("../app/lib/x-broadcasts.ts", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/start-here.css", import.meta.url), "utf8");
  const ids = catalog.match(/id: "1[^"]+"/g) ?? [];
  assert.equal(ids.length, 11);
  assert.match(catalog, /id: "1AKEmmrYnnnKL"/);
  assert.ok(catalog.indexOf('id: "1AKEmmrYnnnKL"') < catalog.indexOf('id: "1pJkOOzwOZjJj"'));
  assert.match(page, /<HlsVideo/);
  assert.match(player, /<video ref=\{videoRef\} controls playsInline preload="metadata"/);
  assert.match(player, /Hls\.isSupported\(\)/);
  assert.match(player, /application\/vnd\.apple\.mpegurl/);
  assert.match(api, /extractReplayHlsUrl/);
  assert.match(api, /\/api\/x-media\?url=/);
  assert.match(proxy, /rewriteManifest/);
  assert.match(proxy, /video\.pscp\.tv/);
  assert.doesNotMatch(page, /https:\/\/x\.com|Open on X|Watch the full replay on X/i);
  assert.doesNotMatch(page, /platform\.twitter\.com\/embed\/Tweet\.html/);
  assert.match(page, /broadcast\.poster/);
  assert.match(page, /Can.t DUB Me/i);
  assert.doesNotMatch(page, /Can.t DUB Me<br/i);
  assert.match(page, /REPLAY \{String\(index \+ 1\)/);
  assert.match(page, /Play replay/i);
  assert.match(page, /Playback stays inside The Files/i);
  assert.match(player, /Replay temporarily unavailable/i);
  assert.match(styles, /\.broadcast-title\{white-space:nowrap/);
  assert.match(styles, /\.broadcast-player\{position:relative;display:grid;place-items:center;width:100%;aspect-ratio:16\/9;max-height:78vh/);
  assert.match(styles, /\.broadcast-player video,\.broadcast-player>img\{display:block;width:100%;height:100%;object-fit:contain/);
});

test("routes Studio and Consulting through the official Calendly home without simulated confirmations", async () => {
  const page = await readFile(new URL("../app/components/files-platform.tsx", import.meta.url), "utf8");
  assert.match(page, /https:\/\/calendly\.com\/dubwiththefiles/);
  assert.match(page, /Book studio time/);
  assert.match(page, /Book a consulting session/);
  assert.doesNotMatch(page, /DEMO INQUIRY FILED/);
  assert.doesNotMatch(page, /REQUEST RECEIVED/);
});

test("places the studio booking destination directly after the session options", async () => {
  const page = await readFile(new URL("../app/components/files-platform.tsx", import.meta.url), "utf8");
  const studio = page.match(/function StudioBooking\(\) \{([\s\S]*?)function ConsultingFlow/);
  assert.ok(studio);
  assert.ok(studio[1].indexOf("studioPackages.map") < studio[1].indexOf('<ScheduleDestination kind="studio"'));
  assert.doesNotMatch(studio[1], /<\/div><ScheduleDestination kind="studio" \/>/);
});

test("keeps Outside current and balances the Apple Music panel with the calendar", async () => {
  const page = await readFile(new URL("../app/components/files-platform.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/start-here.css", import.meta.url), "utf8");
  assert.match(page, /Loading the current New York nightlife listings/i);
  assert.match(page, /useState<Array<\{ title: string; when: string; venue: string; note: string; href: string \}>>\(\[\]\)/i);
  assert.match(styles, /\.live-files-grid\{align-items:stretch\}/i);
  assert.match(styles, /\.nightlife-calendar,\.apple-playlist\{height:100%;display:flex;flex-direction:column\}/i);
});

test("presents every clip in one unified Files feed", async () => {
  const page = await readFile(new URL("../app/components/files-platform.tsx", import.meta.url), "utf8");
  assert.match(page, /THE FILES \/ ALL CLIPS/i);
  assert.match(page, /One feed\./i);
  assert.match(page, /\{media\.length\}<\/b> clips/i);
  assert.doesNotMatch(page, /setFilter|filter-list|item\.type|item\.topic/);
});

test("keeps the newly verified YouTube uploads at the beginning of the feed", async () => {
  const page = await readFile(new URL("../app/components/files-platform.tsx", import.meta.url), "utf8");
  const newIds = ["yf4qP6dZ7M0", "KWn3uHMDCf4", "ri9SYZpj6ug", "fE11p3Fg4ck"];
  for (const videoId of newIds) {
    assert.match(page, new RegExp(`videoId: "${videoId}"`));
    assert.match(page, new RegExp(`https://i\\.ytimg\\.com/vi/${videoId}/hqdefault\\.jpg`));
  }
  assert.ok(page.indexOf('videoId: "yf4qP6dZ7M0"') < page.indexOf('videoId: "Z1uHcI-CLKU"'));
});

test("keeps the Outside calendar and playlist equal-height on desktop", async () => {
  const styles = await readFile(new URL("../app/start-here.css", import.meta.url), "utf8");
  assert.match(styles, /@media\(min-width:761px\)\{\.live-files-grid\{align-items:stretch\}/i);
  assert.match(styles, /\.apple-playlist\{display:flex;flex-direction:column\}/i);
  assert.match(styles, /\.apple-playlist iframe\{flex:1 1 auto;height:auto;min-height:300px\}/i);
  assert.match(styles, /@media\(max-width:760px\)\{\.live-files-grid\{grid-template-columns:1fr\}/i);
});

test("uses an on-site player and provides a cautious tip line", async () => {
  const page = await readFile(new URL("../app/components/files-platform.tsx", import.meta.url), "utf8");
  const forms = await readFile(new URL("../app/components/site-forms.tsx", import.meta.url), "utf8");
  assert.match(page, /youtube-nocookie\.com\/embed/);
  assert.match(page, /autoplay=1/);
  assert.match(page, /THE TIP LINE/);
  assert.match(forms, /not an anonymous reporting channel/i);
  assert.doesNotMatch(page, /goToFeatured/);
  assert.doesNotMatch(page, /start-here/);
});

test("keeps the active identity free of discontinued show language", async () => {
  const page = await readFile(new URL("../app/components/files-platform.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(page, /files-logo-seal/);
  assert.doesNotMatch(page, /morning-show/i);
  assert.doesNotMatch(page, /on spaces/i);
  assert.match(styles, /object-fit:contain/i);
});

test("refreshes the Files feed from Dub's YouTube uploads", async () => {
  const page = await readFile(new URL("../app/components/files-platform.tsx", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/videos/route.ts", import.meta.url), "utf8");
  assert.match(page, /fetch\("\/api\/videos"\)/);
  assert.match(page, /live YouTube updates/);
  assert.match(route, /UCPydZggyK7qQRp4VNUGXNgg/);
  assert.match(route, /feeds\/videos\.xml\?channel_id=/);
  assert.match(route, /Cache-Control.*s-maxage=300/);
  assert.match(route, /videosFromFeed/);
});

test("publishes crawlable metadata for retained routes", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const seo = await readFile(new URL("../app/seo.ts", import.meta.url), "utf8");
  const sitemap = await readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  const robots = await readFile(new URL("../app/robots.ts", import.meta.url), "utf8");
  assert.match(layout, /metadataBase: new URL\(SITE_URL\)/);
  assert.match(layout, /application\/ld\+json/);
  assert.match(layout, /Organization/);
  assert.match(seo, /https:\/\/www\.thefileswithdub\.com/);
  for (const route of ["/", "/files", "/broadcasts", "/patreon", "/outside", "/studio", "/consulting", "/spill", "/contact", "/about"]) {
    assert.match(seo, new RegExp(`path: "${route.replace("/", "\\/")}"`));
  }
  assert.doesNotMatch(sitemap, /affiliate|game/i);
  assert.match(robots, /disallow/);
  assert.match(robots, /sitemap\.xml/);

  const response = await render("/about");
  const html = await response.text();
  assert.match(html, /<title>About \| The Files With Dub<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.thefileswithdub\.com\/about"\/>/);
  assert.match(html, /<meta name="description"/);
});

test("serves sitemap and robots metadata routes and keeps Game out", async () => {
  const sitemapResponse = await render("/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemapResponse.headers.get("content-type") ?? "", /application\/xml/i);
  const sitemap = await sitemapResponse.text();
  assert.match(sitemap, /https:\/\/www\.thefileswithdub\.com\/broadcasts/);
  assert.doesNotMatch(sitemap, /\/game|\/affiliate/);

  const robotsResponse = await render("/robots.txt");
  assert.equal(robotsResponse.status, 200);
  const robots = await robotsResponse.text();
  assert.match(robots, /Disallow: \/api\//);
  assert.match(robots, /Disallow: \/game/);
  assert.match(robots, /Sitemap: https:\/\/www\.thefileswithdub\.com\/sitemap\.xml/);
});

test("keeps newsletter and policy language truthful while making the player responsive", async () => {
  const platform = await readFile(new URL("../app/components/files-platform.tsx", import.meta.url), "utf8");
  const forms = await readFile(new URL("../app/components/site-forms.tsx", import.meta.url), "utf8");
  const privacy = await readFile(new URL("../app/privacy/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(platform, /function Newsletter\(\)/);
  assert.match(forms, /No newsletter information is collected or sent from this form/);
  assert.doesNotMatch(forms, /accept the privacy policy/);
  assert.match(privacy, /pending owner and counsel approval/);
  assert.match(platform, /closeOnEscape/);
  assert.match(platform, /closeButtonRef/);
  assert.match(platform, /previousFocusRef/);
  assert.match(platform, /loading="eager"/);
  assert.match(platform, /referrerPolicy="strict-origin-when-cross-origin"/);
  assert.match(platform, /loading="lazy"/);
  assert.match(platform, /decoding="async"/);
  assert.match(styles, /max-height:calc\(100dvh - 40px\)/);
  assert.match(styles, /overflow-wrap:anywhere/);
  assert.match(styles, /@media\(max-width:760px\)\{\.modal-bg\{padding:12px\}/);
  assert.match(styles, /\.contact-card \.text-button/);
  assert.match(styles, /\.policy-page h1\{overflow-wrap:anywhere;word-break:break-word\}/);
});

test("adds a guarded Worker boundary for headers, secrets, and upstream fetches", async () => {
  const worker = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");
  const config = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  const ignore = await readFile(new URL("../.gitignore", import.meta.url), "utf8");
  const http = await readFile(new URL("../app/lib/http.ts", import.meta.url), "utf8");
  const media = await readFile(new URL("../app/api/x-media/route.ts", import.meta.url), "utf8");
  const videos = await readFile(new URL("../app/api/videos/route.ts", import.meta.url), "utf8");
  const nightlife = await readFile(new URL("../app/api/nightlife/route.ts", import.meta.url), "utf8");

  for (const header of ["Content-Security-Policy", "Strict-Transport-Security", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy"]) {
    assert.match(worker, new RegExp(header));
  }
  assert.match(worker, /script-src 'self' 'unsafe-inline'/);
  assert.match(config, /"routes": \[\]/);
  assert.match(config, /"production"/);
  assert.match(config, /"redact_query_string": true/);
  assert.match(config, /"logs"[\s\S]*"enabled": true/);
  assert.match(config, /"traces"[\s\S]*"head_sampling_rate": 0\.1/);
  for (const pattern of [".env", ".env.*", ".dev.vars", "*.pem", "*.key"]) assert.match(ignore, new RegExp(`^${pattern.replace("*", "\\S*")}$`, "m"));
  assert.match(http, /AbortController/);
  assert.match(http, /readTextWithLimit/);
  assert.match(media, /APPROVED_REPLAY_HOST/);
  assert.match(media, /MAX_MANIFEST_BYTES/);
  assert.match(media, /url\.username \|\| url\.password \|\| url\.port \|\| url\.hash/);
  assert.match(videos, /YOUTUBE_VIDEO_ID/);
  assert.match(videos, /attempt < 3/);
  assert.match(videos, /X-Data-Status/);
  assert.match(nightlife, /approvedEventUrl/);
});
