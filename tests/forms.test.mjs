import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function worker() {
  const url = new URL("../dist/server/index.js", import.meta.url);
  url.searchParams.set("forms-test", `${process.pid}-${Date.now()}`);
  return (await import(url.href)).default;
}

const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const execution = { waitUntil() {}, passThroughOnException() {} };

test("keeps form collection fail-closed until explicitly enabled", async () => {
  const instance = await worker();
  for (const path of ["/api/contact", "/api/spill", "/api/newsletter/request"]) {
    const response = await instance.fetch(new Request(`https://www.thefileswithdub.com${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }), env, execution);
    assert.equal(response.status, 503, path);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});

test("exposes only non-secret form configuration", async () => {
  const instance = await worker();
  const response = await instance.fetch(new Request("https://www.thefileswithdub.com/api/forms/status"), env, execution);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.enabled, false);
  assert.equal(body.mode, "disabled");
  assert.equal(typeof body.sitekey, "string");
  assert.doesNotMatch(JSON.stringify(body), /secret|resend|token/i);
});

test("form implementation has server-side protections and no source credentials", async () => {
  const security = await readFile(new URL("../app/lib/form-security.ts", import.meta.url), "utf8");
  const contact = await readFile(new URL("../app/api/contact/route.ts", import.meta.url), "utf8");
  const spill = await readFile(new URL("../app/api/spill/route.ts", import.meta.url), "utf8");
  const newsletter = await readFile(new URL("../app/api/newsletter/request/route.ts", import.meta.url), "utf8");
  assert.match(security, /siteverify/);
  assert.match(security, /idempotency_key/);
  assert.match(security, /AES-GCM/);
  assert.match(contact, /verifyTurnstile\(request, "contact"/);
  assert.match(spill, /verifyTurnstile\(request, "spill"/);
  assert.match(newsletter, /verifyTurnstile\(request, "newsletter"/);
  assert.doesNotMatch(security, /re_[A-Za-z0-9]{10,}/);
});
