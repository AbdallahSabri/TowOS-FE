# towos-web

TowOS dispatcher web app. Read `CLAUDE.md` and `FE-SPEC.md` before making changes.

## Requirements

- Node 24.x (`nvm use`)

## Commands

```bash
npm run dev        # start the dev server
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run test       # vitest run
```

## Deploy

Coolify, Nixpacks build, no Dockerfile (ADR-010). `nixpacks.toml` pins the
Node version and gates the build phase on typecheck, lint, and test before
`next build` — a failure there blocks the deploy (FE-SPEC.md §12).

Still a manual step in Coolify's own dashboard, not expressible as a repo
file: the branch-based deploy rules (`main` → production, any other branch
→ a named preview against the shared `dev` database through the API's
preview URL) and the `NEXT_PUBLIC_API_URL` environment variable per
environment.

## Status

Phase 0. Login, the authenticated shell's session guard, and logout are in
place; no dispatch board, New Job form, Calls Inbox, or admin screens yet
(FE-SPEC.md §1, §6).
