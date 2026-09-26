import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

const RELOADED_FOR_WORKER = 'tally.mock-worker-reload'

/**
 * The mock API only runs in development. Awaiting worker.start() before the
 * first render guarantees no request can escape to the real network.
 */
async function enableMocking() {
  if (!import.meta.env.DEV) return
  const { worker } = await import('./mocks/browser')
  const { keepMockSessionsAcrossReloads } = await import('./mocks/dev-session-persistence')
  keepMockSessionsAcrossReloads()
  // Says which code this tab is running: if this line is missing from the
  // console, the tab is serving an older bundle and needs a hard reload.
  console.info('[dev] Mock API ready — session recovery armed.')

  // Type tallyDiagnose() in the console to see why a session was lost.
  Object.assign(window, {
    tallyDiagnose: async () => {
      const read = (key: string) => {
        try {
          return localStorage.getItem(key)
        } catch {
          return '<unreadable>'
        }
      }
      const token = read('tally.token')
      const sessions = read('tally.mock-sessions')
      const parsed = sessions ? (JSON.parse(sessions) as [string, unknown][]) : []
      const me = await fetch('/api/me', {
        headers: token ? { Authorization: `Bearer ${JSON.parse(token) as string}` } : {},
      })
      return {
        build: 'session-recovery',
        token: token ? `${(JSON.parse(token) as string).slice(0, 12)}…` : null,
        username: read('tally.username'),
        knownSessions: parsed.map(([t]) => `${t.slice(0, 12)}…`),
        tokenIsKnown: parsed.some(([t]) => token !== null && t === (JSON.parse(token) as string)),
        apiMeStatus: me.status,
        servedByWorker: !!navigator.serviceWorker.controller,
        workerScript: navigator.serviceWorker.controller?.scriptURL ?? null,
        openTabs: 'check for other tabs on localhost:5173',
      }
    },
  })
  await worker.start({
    onUnhandledRequest: 'bypass',
    // Without this the browser may keep serving a cached worker script. A stale
    // one forwards requests on behalf of pages that have gone, which surfaces as
    // "Failed to fetch" thrown from inside mockServiceWorker.js.
    serviceWorker: { options: { updateViaCache: 'none' } },
  })

  // A worker registered on this load does not always control the page that
  // registered it — the first load after it was unregistered is the usual
  // case. Uncontrolled, every /api call reaches the dev server instead and
  // comes back 404, which looks like a broken app. One reload hands the page
  // to the worker; the flag stops that ever becoming a loop.
  if (!navigator.serviceWorker.controller) {
    if (!sessionStorage.getItem(RELOADED_FOR_WORKER)) {
      sessionStorage.setItem(RELOADED_FOR_WORKER, '1')
      window.location.reload()
      return
    }
    console.error(
      'The mock API worker is not controlling this page, so /api calls will 404. ' +
        'Unregister the worker in DevTools → Application → Service workers, then reload.',
    )
  }
  sessionStorage.removeItem(RELOADED_FOR_WORKER)
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
