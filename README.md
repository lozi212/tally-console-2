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

Log in with **any username** and the password **`tally`**.

The mock API runs as a service worker, started before the first render so no request can
escape to the real network. It is development-only — a production build has no backend.

## Test

```bash
npm test         # single run, 51 tests
npm run test:watch
```

Tests run against the same handlers through `msw/node`, not stubs, so they exercise the
real request and response shapes. `.env.test` removes the injected latency and random
failures so the suite is deterministic.

## Checks

```bash
npm run lint         # ESLint, incl. react-hooks rules
npm run format:check # Prettier
npm run typecheck    # tsc, strict
npm run build
```

## Toggling the API's simulated failures

By default the mock delays every request by 300–800 ms and fails ~5% of them with a 500.
Both are deliberate and both are worth leaving on: the loading, error and retry states
are part of the brief. To turn them off while working on something else, create
`.env.development.local` (gitignored):

```
VITE_API_FAILURES=off
VITE_API_LATENCY=0
```

## What it does

| Screen           | Behaviour                                                                                                                                                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Login**        | Required-field validation, a pending state, and the server's own error message. The token is stored with `useLocalStorageState` and verified with `GET /api/me` behind a full-page loader before anything renders. Logged-out visitors are redirected and returned to the page they asked for. |
| **Transactions** | All 5,000 rows with search, a status and method filter, sorting and paging. The whole view lives in the URL, so a reload or a shared link rebuilds it. Status chips, relative dates within 7 days, loading skeletons, an empty state and an error state with Retry.                            |
| **Transaction**  | Header, gross/refunded/refundable amounts and line items with a total. Cached data renders at once and revalidates behind a progress bar. A missing transaction is explained in place; anything else goes to an error boundary with Retry.                                                     |
| **Refund**       | Validates the amount against the refundable balance and requires a reason, shows the server's refusal message, then patches the transaction **and its row in the list** from the response — the 5,000-row list is never refetched.                                                             |
| **Extras**       | The transaction is prefetched when the pointer rests on its row, and a light/dark choice is remembered across reloads and tabs.                                                                                                                                                                |

## Stack

TypeScript · Vite · React · MUI · Material React Table · TanStack Query (with devtools,
loaded in development only) · React Router · React Hook Form + zod · Vitest, React
Testing Library and user-event · ESLint + Prettier.

Every request goes through one client, `src/lib/api.ts`, which attaches the bearer token
and turns failures into an `ApiError` carrying the status and the server's message. The
query hooks call that client; nothing calls `fetch` directly.

The versions match the brief: React 18, MUI 6, Material React Table 2, TanStack Query 5
and React Router 6. The scaffold had started on newer majors; aligning them also removed
two workarounds, because MRT 2 and MUI 6 are built for each other.

## Notes and decisions

- **The URL is the table's state.** Search, filters, sort and page are parsed from the
  query string and written back to it; nothing is duplicated in React state, so the two
  cannot disagree. Typing replaces the history entry (otherwise every keystroke would
  need its own Back press) while filters, sorting and paging push one. The setters read
  the live URL rather than the values from the last render, so two clicks in the same
  tick cannot lose one.
- **Refunds patch the cache.** The response carries the updated transaction, so
  `setQueryData` updates the detail and the one list row. `invalidateQueries` would have
  refetched all 5,000 rows for a one-row change; a test asserts no such request is made.
- **Errors are separated by kind.** `ApiError` carries the status, so a 401 logs out, a
  404 is explained in place, and anything else reaches the error boundary. Client errors
  are never retried — a 404 is the server's considered answer — while 500s are retried
  once, which hides most of the mock's random failures.
- **The auth context value is memoised**, and both `login` and `logout` are wrapped in
  `useCallback`, so consumers re-render only when the session actually changes.
- **Two route trees rather than route guards.** A signed-out visitor has no route to the
  transactions pages at all, and the split gives the lazy loading a natural seam: the
  signed-out bundle is ~2 kB against ~590 kB signed in.
- **The table's own controls are used as the brief asks**: MRT's global search, its
  multi-select status filter, its sorting and its pagination. Only the state lives
  outside it, in the URL.
- **Every row is the same height.** Rows sized to their content changed the table's
  height from page to page, which moved the pagination controls: a second click aimed at
  Next could land on a row and open that transaction instead.
- **`src/mocks/` is the supplied mock, copied in unmodified.** It is excluded from
  linting and formatting, and its types are declared separately in `src/mocks/mocks.d.ts`
  so the rest of the app stays strictly typed.
- **`public/mockServiceWorker.js` carries one local patch**: its fetch listener returns
  early for anything outside `/api/`. The worker otherwise forwarded Vite's modules, page
  navigations and browser prefetches, and threw `TypeError: Failed to fetch` from
  `passthrough()` whenever the browser abandoned one of them. **Re-running `msw init`
  overwrites this** — the patch is commented in the file.
- **A lost mock session is recovered rather than relied upon.** The mock holds sessions
  in memory, so a reload, a hot reload or a second tab can leave a stored token with no
  session behind it; every request then 401s and the user lands back on the login page
  mid-task. `src/auth/devSessionRecovery.ts` signs the same user back in when that
  happens and the request is retried once. It does nothing in production, where a 401
  means what it says, and nothing after an explicit logout — both are covered by tests.
- **Every tab runs its own copy of the mock**, so a token minted in one tab was unknown
  to the next: the tabs invalidated each other's sessions in turn and the user was
  bounced to the login page again and again. The shim shares the sessions through
  `localStorage`, looks them up when a token is missed, and merges what another tab
  writes.
- **Sessions are also persisted in development by a shim.** The mock holds sessions in an
  in-memory `Map`, so every page load — a reload, or one of Vite's hot reloads — began
  with none; the stored token was then rejected and the next request logged the user out
  mid-task. `src/mocks/dev-session-persistence.ts` copies them to `localStorage` and
  restores them on the next load. Development only, and the supplied mock is untouched:
  `db.sessions` is a plain `Map`, and the shim only writes to it and wraps `set`/`delete`.
- **`@faker-js/faker` stays on v9** as the mock's peer range requires. `npm audit` flags a
  high-severity advisory against it, but that advisory covers `faker.helpers.fake` with
  untrusted templates, which the mock never calls. It is also a dev-only dependency and is
  never shipped.

## What is not done

- **The summary cards and a Playwright flow** were left out: the brief allows at most two
  stretch goals, and prefetching and the theme were the better value.
- **The signed-in bundle is large** (~590 kB, 169 kB gzipped) because Material React
  Table brings the MUI date pickers with it. A signed-out visitor downloads none of it.
  Trimming further would mean replacing the table.
- **The list loads all 5,000 rows at once**, because the mock returns everything and
  supports no server-side paging. Search, filtering, sorting and paging therefore run in
  the browser. With a real API these would move to the server, and the URL state this app
  already keeps would map onto the query parameters directly.
