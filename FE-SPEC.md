# TowOS — FE Spec (Phase 0 Bootstrap)

**Repo:** `towos-web`
**Scope:** Phase 0 only (build plan §12, E2 column). App shell, routing, auth screens, design system, TanStack Query setup.
**Source of truth:** `TowOS_MVP.md` v0.7. Where this file and that disagree, that wins, **except for the version table in §2**, which supersedes ADR-003 and ADR-005.
**Out of scope here:** dispatch board, New Job form, Job Detail drawer, Calls Inbox, admin screens, exports. Those are Phase 1 to 3.
**Companion:** `BE-SPEC.md`.

---

## 1. Phase 0 exit condition

**A user logs in through this app against the deployed API, lands on an authenticated shell, and logs out.** Nothing else renders real data yet.

---

## 2. Versions

Checked 3 September 2026. Pin these exactly. Re-check before Phase 1 starts.

| Component | Pin | Status | Notes |
|---|---|---|---|
| Node.js | **24.x** | Active LTS | Same pin as the API repo. Node 26 enters Active LTS late Oct 2026; bump both repos together, in Phase 1. |
| Next.js | **16.3.3** | Active LTS | The 25 Aug 2026 security release. Next.js 15 is Maintenance LTS until Oct 2026 and is not a starting point for a new project. |
| React | 19.x | | Whatever ships as the peer of Next 16.3. |
| TypeScript | **5.x** | | **Not 7.x.** Some Next.js lines reject TS 7.0+ outright. Hold at 5.x here and in the API repo so one compiler serves both. |
| Tailwind CSS | 4.x | | Via `@tailwindcss/postcss`. v4 config differs from v3; do not copy a v3 setup. |

**Next.js patches security on a monthly cadence and the 2025–2026 advisories were severe, several rated Critical.** Pin an exact patch, not a caret range, and put the version bump on someone's calendar. A pinned-but-stale minor carries the same exposure as an unsupported version.

---

## 3. Stack

| Concern | Choice | Locked by |
|---|---|---|
| Framework | Next.js 16, App Router | ADR-005, §2 |
| Language | TypeScript 5.x, strict mode | ADR-003 |
| Styling | Tailwind CSS 4 | ADR-005 |
| Components | shadcn/ui on Radix primitives | ADR-005 |
| Server state | TanStack Query v5 | ADR-005 |
| Auth transport | Session cookie, credentials included | §6.4 |
| Hosting | Coolify, Nixpacks build, no Dockerfile | ADR-010 |

**Operational screens are client components.** No server-side data fetching for the board, job screens, or admin. SSR is reserved for the marketing half of the product, which is not in this MVP but which this framework choice exists to serve later.

There is one client. No mobile build, no React Native, no service worker, no install manifest (ADR-006).

Set the Node version explicitly in the Nixpacks configuration so the build does not drift.

---

## 4. Dependencies

**Runtime**

```
next@16.3.3 react@19 react-dom@19
@tanstack/react-query @tanstack/react-query-devtools
tailwindcss@4 @tailwindcss/postcss
class-variance-authority clsx tailwind-merge
@radix-ui/react-*        (as shadcn/ui pulls them)
lucide-react
zod                      form and API response validation
react-hook-form @hookform/resolvers
@internationalized/date  or date-fns-tz, for job-timezone rendering
```

**Dev**

```
typescript@5 @types/*
eslint eslint-config-next
prettier prettier-plugin-tailwindcss
vitest @testing-library/react
playwright               login flow only in Phase 0
```

Not installed in Phase 0: any charting library (no reporting, §8.6), any WebSocket or SSE client (ADR-007), any offline or IndexedDB library (§9.2), any map library. Google Maps arrives in Phase 1 with the intake form.

---

## 5. Folder structure

```
towos-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx            root layout, providers
│   │   ├── (public)/
│   │   │   └── login/page.tsx
│   │   └── (app)/
│   │       ├── layout.tsx        authenticated shell: nav, user menu, banner slot
│   │       └── page.tsx          placeholder; Phase 1 replaces with the board
│   ├── components/
│   │   ├── ui/                   shadcn primitives, unmodified
│   │   └── shell/                nav, user menu, integration banner slot
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts         fetch wrapper: credentials, envelope unwrap, error mapping
│   │   │   ├── errors.ts         maps §7.2 codes to user-facing copy
│   │   │   └── idempotency.ts    generates and attaches Idempotency-Key on mutations
│   │   ├── query/
│   │   │   ├── provider.tsx      QueryClient + defaults
│   │   │   └── keys.ts           query key factory
│   │   ├── auth/                 session hook, route guard
│   │   └── tz/                   format in a job's timezone, never the viewer's
│   ├── types/
│   │   └── api.ts                hand-written to match the API contract
│   └── styles/
├── .env.example
└── FE-SPEC.md
```

`types/api.ts` is written by hand in Phase 0. If the API repo starts publishing generated types, switch to those and delete this file. Do not build a codegen pipeline now.

---

## 6. API client conventions

**Every request** sends `credentials: 'include'`. No token is ever stored in `localStorage`, `sessionStorage`, or a cookie this app sets.

**Envelope.** The client unwraps `{ data, meta, request_id }` and returns `data`. Components never see the envelope. Keep `request_id` on the error object so a user can quote it in a bug report.

**Errors.** One mapper from the §7.2 code to display copy. A 401 or `SESSION_EXPIRED` clears the query cache and redirects to login. A 403 renders a permission message, not a redirect.

**Idempotency.** The client generates a ULID `Idempotency-Key` for every mutation and reuses it across retries of that same user action. Build this in Phase 0. Phase 1's assignment flow depends on it and the API rejects a POST without it.

---

## 7. TanStack Query rules

Set the defaults once in `lib/query/provider.tsx`. These are the rules from §9.2, encoded rather than remembered.

| Setting | Value | Why |
|---|---|---|
| `refetchOnWindowFocus` | `true` | §8.6 |
| `retry` | 1 for reads, 0 for writes | A retried write is a double-dispatch risk |
| `staleTime` | 0 on operational data | The board is a monitor |
| `refetchInterval` | set per query in Phase 1, not globally | Board 10s, integration status 60s, everything else on navigation |

**Server state lives in TanStack Query and is never copied into component state.** No `useState` holding a job, a driver, or a list of anything the API owns.

**The URL owns filters and selection** on list screens. A dispatcher sends a colleague a link and they see the same view. Phase 1 relies on this; set the pattern in Phase 0 with `useSearchParams`.

**Optimistic updates are allowed on two things only:** dispatch assignment and dispatch status advance. Everything else waits for the server. Phase 0 has neither, so the rule is documented here rather than implemented.

**No screen pushes anything at the user.** Staleness shows up as aging indicators, sort order, and persistent banners. Never a toast that interrupts, never a modal that steals focus mid-task.

---

## 8. Design system

Desktop first, **1440px primary**. A dispatcher works at a desk on a wired connection. Do not build a mobile breakpoint for the board.

Set these in Phase 0 as tokens, not per-component values:

- Type scale, spacing scale, radii
- Status colors for the job lifecycle: `draft`, `open`, `assigned`, `en_route`, `on_scene`, `complete`, `cancelled`, `expired`, `goa`, `unable_to_complete`
- Priority treatment for `high`, `normal`, `low`. **Placeholder values, blocked on §15 Q12.** Build the token layer so a change to the value list touches one file.
- Source badge treatment for `manual` and `agero`
- A past-due state, rendered red (§9.1)

Install shadcn/ui components as you need them. Leave the generated primitives unmodified in `components/ui/` and wrap them for TowOS-specific behavior.

---

## 9. Timezone rendering

**Display every timestamp in the job's timezone, not the viewer's, explicitly labeled.** A Louisiana dispatcher looking at a Colorado job sees Colorado time (§5.3).

`lib/tz/` exposes one formatter that takes a UTC instant plus the job's `service_timezone` and returns a labeled string. Nothing else in the app formats a timestamp. No component calls `toLocaleString` directly, and a lint rule enforces that.

Phase 0 has no job data. Build the utility and its tests anyway, with a fixture crossing the Central/Mountain boundary. Fast Stop spans both, and getting this wrong later means auditing every screen.

---

## 10. Auth screens

- `/login`. Email and password, react-hook-form plus zod.
- On success the API sets the session cookie; redirect to the app shell. This app stores nothing.
- `GET /auth/me` on shell mount populates the user and permission list. A failure sends the user to `/login`.
- The `(app)` route group guards on that call. No page inside it renders before it resolves.
- Logout clears the query cache and calls `POST /auth/logout`.
- **No password reset flow in Phase 0.** An admin sets passwords. `POST /auth/password` for a signed-in user is the only change path.

**Permissions come from the server**, on `/auth/me`. The UI hides what a `dispatcher` cannot do, and the API rejects it independently. Hiding a control is not an access control.

Motor-club provider credentials never touch this app. An admin manages them through a Phase 2 screen that reads and writes them via the API; the browser never holds a Swoop session or any provider secret.

---

## 11. Configuration

```
NEXT_PUBLIC_API_URL
```

That is the whole list in Phase 0. Anything secret belongs in the API repo, not here. A `NEXT_PUBLIC_` variable is visible to anyone with devtools, so nothing sensitive ever gets that prefix.

Google Maps keys arrive in Phase 1 with the intake form. Do not add a placeholder now.

---

## 12. Deploy

Push to `main` deploys production. Push to any other branch deploys a named preview against the shared `dev` database, through the API's preview URL.

Type check, lint, and tests run in the Coolify build step. A failure blocks the deploy. No external pipeline, no Dockerfile.

---

## 13. Guards against reintroducing cut scope

Encode these in Phase 0 as lint rules or tests.

| Guard | Fails the build if |
|---|---|
| No AI surface | Any component or type references score, rank, confidence, risk level, recommended driver, or predicted ETA |
| No money | Any component renders a price, total, amount, or invoice field |
| No realtime | Any import of a WebSocket or EventSource client |
| No offline | Any service worker registration, manifest file, or IndexedDB call |
| No driver client | Any route under a driver path, or any GPS or geolocation API call |
| Timezone discipline | Any direct `toLocaleString`, `toLocaleDateString`, or `Intl.DateTimeFormat` call outside `lib/tz/` |
| Query discipline | Any `useState` initialized from a query result |

---

## 14. Phase 0 Definition of Done

- [ ] A user logs in at `/login` and lands on the authenticated shell.
- [ ] An invalid password shows an error and does not reveal whether the email exists.
- [ ] A logged-out user hitting any `(app)` route is redirected to `/login`.
- [ ] An expired session mid-use clears the cache and redirects, without a stuck loading state.
- [ ] Logout clears the query cache and the shell no longer renders.
- [ ] The API client attaches an `Idempotency-Key` to every mutation, verified by a test.
- [ ] The API client unwraps the envelope; no component sees `data`, `meta`, or `request_id`.
- [ ] Every §7.2 error code maps to display copy, with an unmapped code falling back to a generic message plus the request ID.
- [ ] The timezone formatter renders a Colorado timestamp correctly for a Louisiana viewer, with the label, verified by a test.
- [ ] The app ships no service worker, no manifest, and no offline queue.
- [ ] Type check, lint, and tests all run in the build and block a failing deploy.
- [ ] `main` deploys to production and a branch deploys to its own preview, both from a git push.

---

## 15. Open items that shape Phase 1, not Phase 0

Listed so nobody designs around a placeholder without knowing it is one.

| Item | Effect on this repo | Blocked on |
|---|---|---|
| Priority values (§15 Q12) | The priority token set and the board sort control | Tony, needed week 3 |
| Photo upload path (§15 Q5) | Whether the upload UI is a dispatcher screen or an unauthenticated per-job link | Tony and CEO, needed week 3 |
| `expired` definition (§15 Q10) | Whether Done Today renders an `expired` state at all | Tony |
| Cancel reason values (§15 Q11) | The cancel dialog's pick list | Tony |
| Node 26 LTS (late Oct 2026) | Runtime bump, coordinated with the API repo | Calendar |