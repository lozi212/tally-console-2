import { afterAll, afterEach, beforeAll } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { server } from './mocks/server'
import { resetDb } from './mocks/handlers'

// The app trees are lazy-loaded and the mock adds latency, so the 1s default
// is too tight for the first query in a file when suites run in parallel.
configure({ asyncUtilTimeout: 5000 })

// onUnhandledRequest: 'error' makes a typo'd URL fail loudly instead of hanging.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  cleanup()
  server.resetHandlers()
  // NOTE: this also clears db.sessions, so every test must log in for itself.
  resetDb()
  // The session token lives here; a leftover one would log the next test in.
  window.localStorage.clear()
  window.history.replaceState(null, '', '/')
})

afterAll(() => server.close())
