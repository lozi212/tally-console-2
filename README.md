# Tally — merchant transactions console

A React console for browsing a merchant's transactions and issuing refunds, built against
the supplied MSW mock API.

## Requirements

Node **20.19+** (`.nvmrc` pins 20.20.2). Node 16 will not work: Vite 8, MSW 2 and the
mock's own `structuredClone` call all require Node 18 or newer.

```bash
nvm use
npm install
```

## Run

```bash
npm run dev      # http://localhost:5173
```

The mock API runs as a service worker and is started before the first render, so no
request escapes to the real network. It is development-only — a production build has no
backend.

Log in with **any username** and the password **`tally`**.

## Test

```bash
npm test         # single run
npm run test:watch
```

Tests run against the same handlers through `msw/node`. `.env.test` disables injected
latency and random failures so the suite is deterministic.

## Toggling the API's simulated failures

By default the mock adds 300–800 ms of latency to every request and fails ~5% of them
with a 500. To change that for the dev server, create `.env.development.local`:

```
VITE_API_FAILURES=off
VITE_API_LATENCY=0
```

These are read once at module load, so restart the dev server after changing them.
Leave them **on** for normal development — the loading and error states are part of the
brief.

## Checks

```bash
npm run lint         # ESLint, incl. react-hooks rules
npm run format:check # Prettier
npm run typecheck    # tsc, strict
npm run build
```

## Notes and decisions

- `src/mocks/` is the supplied mock, copied in **unmodified**. It is excluded from
  linting and formatting. Its types are declared separately in `src/mocks/mocks.d.ts`
  so the rest of the app stays strictly typed.
- `@faker-js/faker` stays on v9 as the mock's peer range requires. `npm audit` flags a
  high-severity advisory against it, but that advisory covers `faker.helpers.fake` with
  untrusted templates, which the mock never calls. It is also a dev-only dependency and
  is never shipped.

## What is not done

_(kept current as work progresses)_

- **Transaction detail and refund** are not built yet — the route exists but shows a
  placeholder.
- **The list loads all 5,000 rows at once**, because the mock returns everything and
  supports no server-side paging. Search, filtering, sorting and paging therefore run in
  the browser.

- **Session does not survive a page reload.** The mock stores sessions in an in-memory
  `Map`, which is recreated when the page reloads, so a persisted token is always
  rejected. The reload flow is still implemented as specified — bootstrap `GET /api/me`
  behind a full-page loader, with a 401 clearing the stored token — but it cannot be
  demonstrated against this mock.
