# Content Handoff Flow

**Law — approved by Frank 2026-09-18.** Rooms produce; Main routes. Rooms
never hand work to each other directly — all handoffs go through Main.

## The flow

- Dub:Video and Dub:Audio rooms PRODUCE finished content only — no direct
  Buffer pushes. When a batch is done (rendered, QA-passed, Drive-uploaded),
  the room hands the bundle to Main (Drive folder + captions/file list +
  what's ready).
- Main routes bundles to the pipeline rooms: Buffer:Apache (Dub content) or
  Buffer:Cherokee (Taxstone content).
- Pipeline rooms own the Buffer push and report the final verified schedule
  back in their room: Apache via API key only, Cherokee via website only.

## Why hub-and-spoke

Side chats can't see each other anyway; hub-and-spoke keeps the lanes clean.

## Delivery rule (2026-09-21)

Routing subagents lack chat-send tooling — deliver side-chat handoffs
directly from Main (chat.send_message); subagents do prep only, never
delivery.

Grandfathered 2026-09-18: the Dub:Video 26-clip Apache push already in flight
finishes where it is; the handoff flow applies from the next batch.

**Canonical source — supersedes copies elsewhere.**
