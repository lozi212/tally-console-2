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
