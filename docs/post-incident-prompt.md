# Post-Incident Hardening Prompt

Paste this after any incident, error rundown, or rework session. Fill the bracket.

For the incident(s): [describe, or say "today's error/rework rundown"]

1. **Enumerate** every error, failure, and rework instance. For each record:
   what happened, what the fix was, and the contributing factors (the root
   cause plus what allowed it to happen).
2. **Error log:** write it to `~/workspace/ops/error-log-<YYYY-MM-DD>.md`
   with one row per instance: Error | Fix | Contributing factors | Law/safeguard
   that now covers it.
3. **Prevention laws:** in `~/workspace/ops/error-prevention-laws.md`, for each
   instance write a law (the rule), a safeguard (the mechanism, script, or check
   that enforces it), and a process (the steps). Reference existing laws instead
   of duplicating them.
4. **Build the safeguards** where they are cheap and mechanical (verification
   scripts, checklists, templates) and test each one before claiming it works.
5. **Decision patterns:** append a dated entry to `~/memory/decision-patterns.md`
   capturing the ruling and the standing rule it produced.
6. **Ledger:** append Learning Log rows and Avoid List rows as applicable to the
   Ledger sheet (`1-ZlD9CYAX9ly14_FXbbps_5xjwC_UXmR09PowZEIcHw`), then read them
   back to verify.
7. **Notion:** update the relevant canonical page(s) under the Operations Index.
   Explanations live in Notion; law text stays in the workspace/GitHub. Never
   collapse the layers.
8. **GitHub:** if a repo holds the affected code or docs, commit the fix and
   the documentation there. If no repo applies, say so plainly instead of
   forcing it.
9. **Report back:** what was written where, with a read-back verification for
   every write.

Standing rules for the run: grade claims VERIFIED / REPORTED / INFERRED; failed
checks fail loudly and stay UNKNOWN; never claim COMPLETED without evidence;
nothing destructive without Frank's word.
