# CLAUDE.md — towos-web

TowOS dispatcher web app. Next.js App Router, one client, no mobile build. Read `FE-SPEC.md` for anything not covered here — this file is the invariant list, not the spec.

**Current phase: Phase 0 only.** No dispatch board, no New Job form, no Calls Inbox, no admin screens. If a task seems to need one of those, stop and say so instead of building it.

---

## Versions — do not substitute

Node 24.x · Next.js 16.3.3 · React 19.x · TypeScript 5.x (not 7.x — Next rejects it on some lines) · Tailwind 4

Full rationale in `FE-SPEC.md` §2. Pin the exact patch on `next`, never a caret range — the 2025–2026 security releases were frequent and several were Critical.

---

## Non-negotiable invariants

1. **Server state lives only in TanStack Query.** Never `useState(queryResult)`, never mirror a job/driver/dispatch into component state.
2. **The API client unwraps the envelope.** Components see `data`'s contents directly, never `{ data, meta, request_id }`.
3. **Every mutation gets a generated `Idempotency-Key`**, reused across retries of the same user action. The API rejects a POST without one.
4. **No timestamp formatting outside `lib/tz/`.** No component calls `toLocaleString`, `toLocaleDateString`, or `Intl.DateTimeFormat` directly. Every timestamp displays in the *job's* timezone, never the viewer's.
5. **The URL owns filters and selection** on any list screen. A colleague opening the same link sees the same view.
6. **No credential of any kind touches the browser.** Provider auth (Swoop, any future motor club) is entirely server-side, managed through an admin screen that calls the API — never present in this codebase as a token, session, or key.
7. **Permissions come from `GET /auth/me`, not from guessing.** The UI hides what a role can't do; the API is the actual enforcement. Don't build a client-side permission check that isn't backed by a server response.
8. **No screen interrupts the user.** Staleness is a banner, an aging indicator, a sort order — never a toast or modal that steals focus.

## Cut-scope guards — treat these as trip-wires

| Touching this | Means |
|---|---|
| A price/total/amount/invoice field on any component | Out of scope — no money handling |
| score/rank/confidence/risk level/recommended driver/predicted ETA anywhere | Out of scope — no AI, ADR-013 |
| A WebSocket or EventSource import | Out of scope — polling only, ADR-007 |
| A service worker, manifest file, or IndexedDB call | Out of scope — no offline support |
| A driver-facing route or a geolocation API call | Out of scope — no driver client, ADR-006 |

## Commands

`npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`. `npm run test` is not yet defined — no test framework is installed as of Phase 0 slice 1.

## When to stop and ask instead of proceeding

- Priority values, photo upload path, `expired` behavior, cancel reasons — all `[NEEDS TONY]` in `TowOS_MVP.md` §15. Build the token layer or the placeholder so the *shape* is right, don't guess the *values*.
- Any change to `lib/tz/` — every screen depends on this being correct.
- Any change to `lib/api/client.ts` — this is the single highest-blast-radius file in the repo.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
