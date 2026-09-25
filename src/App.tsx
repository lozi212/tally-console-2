import { lazy, Suspense, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { isApiError } from './lib/api'
import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/authContext'
import { FullPageLoader } from './components/FullPageStatus'
import ThemeModeProvider from './components/ThemeModeProvider'

// Two separate chunks: a logged-out visitor never downloads the table, dialogs, etc.
const AuthenticatedApp = lazy(() => import('./AuthenticatedApp'))
const UnauthenticatedApp = lazy(() => import('./UnauthenticatedApp'))

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // The mock fails ~5% of requests with a 500; one automatic retry hides
        // most of those. A 4xx is the server's considered answer, so retrying
        // it only delays the message the user needs to see.
        retry: (failureCount, error) =>
          !(isApiError(error) && error.status < 500) && failureCount < 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}

export default function App() {
  // One client per App instance, so tests never share a cache.
  const [queryClient] = useState(createQueryClient)

  return (
    <ThemeModeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeModeProvider>
  )
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Suspense fallback={<FullPageLoader />}>
      {user ? <AuthenticatedApp /> : <UnauthenticatedApp />}
    </Suspense>
  )
}
