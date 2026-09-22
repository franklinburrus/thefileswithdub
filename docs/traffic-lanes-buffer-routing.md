# Traffic Lanes â Buffer Access Routing

**Law â approved by Frank 2026-09-18.** Each pipeline has exactly one way to
touch Buffer. Crossing lanes causes session/account collisions on the shared
Chromium profile.

## The routes

| Lane | Route | Never |
|---|---|---|
| Buffer:Apache | Buffer **API key only** | Never the browser, never the provider session |
| Buffer:Cherokee | **buffer.com website** via the shared browser only | Never the API |
| Dub:Video | Drive uploads only â any Buffer scheduling of Dub clips goes through the Apache lane's API-key path | Never the browser |

- No lane spawns buffer.com browser tasks except Cherokee.
- No lane uses the Buffer API except Apache.
- Cherokee owns the browser's Buffer session (signed into the Taxstone/Cherokee
  account â thejailcallwithtaxstone IG / JailCallwithTax X).

## Hard constraint (2026-09-18, Frank)

The Buffer skill stores exactly ONE API key â Apache's. There is no second
slot, so Cherokee can NEVER use the API; all Cherokee Buffer work goes through
the browser, permanently. Any job that checks or touches Cherokee's Buffer
queue must use the website, not the skill.

Recorded 2026-09-18 in AGENTS.md. Canonical source — supersedes copies elsewhere.
