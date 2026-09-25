# EsportM — Sales Demo

A standalone, backend-free build of the EsportM product for showing to
prospective customers. It is a copy of `apps/frontend` with one change: the
single axios instance in `src/api/http.ts` is pointed at an in-memory mock
adapter (`src/api/mock/adapter.ts`) instead of a real API. Every screen —
Dashboard, Admin, Marketplace, and everything else — runs against realistic
seeded data for a fictional club, "Phoenix FC Academy".

## Why a separate app instead of a flag on the real frontend

- **Nothing can leak.** There is no `VITE_API_BASE_URL`, no real database, and
  no login required — a prospect gets a link and lands straight in the
  product.
- **Nothing can break mid-call.** No dependency on a live staging backend
  being up during a sales call.
- **It stays in sync automatically.** Because it's a copy of the real UI
  (components, layouts, styling), redeploying after copying over frontend
  changes keeps it looking identical to production.

## How the mock backend works

- `src/api/mock/fixtures.ts` — static seed data (club, players, squads,
  matches, schedule, notifications, marketplace listings, billing plan).
- `src/api/mock/store.ts` — a mutable in-memory copy of the fixtures, so
  actions taken during a demo (marking a notification read, creating a
  match, saving an analytics entry, adding a squad member) visibly persist
  for the rest of the session.
- `src/api/mock/adapter.ts` — a custom axios adapter that pattern-matches
  every request URL the app makes and answers it from the store. Anything
  not explicitly handled falls back to an empty-but-safe response instead of
  erroring.
- `src/demo/bootstrap.ts` — seeds `localStorage` with a fake session token on
  first load so the visitor skips the login screen entirely.

The demo club is billed on the "Professional" plan with Advanced Analytics,
Medical Management, and Marketplace Recruiting unlocked. AI Assistant and
Social Publishing are intentionally left locked so the pricing upsell screen
is part of the demo too.

All state resets on a full page reload — there's nothing to clean up between
demo calls.

## Run locally

```bash
pnpm install
pnpm --filter demo dev
```

## Build

```bash
pnpm --filter demo build
```

Output goes to `apps/demo/dist`.

## Deploy to Vercel (separate link from production)

1. Import this repo as a **new** Vercel project (don't reuse the production
   frontend's project).
2. In the project's settings, set **Root Directory** to `apps/demo`.
3. Framework preset: Vite. The included `vercel.json` sets the install/build
   commands to run through pnpm at the workspace root so the shared
   `packages/*` dependencies resolve correctly.
4. No environment variables are required — the app never calls a real API.
5. Deploy. You'll get an independent `*.vercel.app` URL (or a custom domain
   you attach) to hand to the customer, completely separate from the
   production app's URL.

## Keeping it up to date

When the real product's UI changes meaningfully, re-copy the changed files
from `apps/frontend/src` into `apps/demo/src` (everything except
`src/api/http.ts`, `src/api/mock/*`, and `src/demo/*`, which are demo-only)
and redeploy.
