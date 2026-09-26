import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

/**
 * The mock API only runs in development. Awaiting worker.start() before the
 * first render guarantees no request can escape to the real network.
 */
async function enableMocking() {
  if (!import.meta.env.DEV) return
  const { worker } = await import('./mocks/browser')
  return worker.start({
    onUnhandledRequest: 'bypass',
    // Without this the browser may keep serving a cached worker script. A stale
    // one forwards requests on behalf of pages that have gone, which surfaces as
    // "Failed to fetch" thrown from inside mockServiceWorker.js.
    serviceWorker: { options: { updateViaCache: 'none' } },
  })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
