import { lazy, Suspense, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/authContext'
import { FullPageLoader } from './components/FullPageStatus'
import { theme } from './theme'

// Two separate chunks: a logged-out visitor never downloads the table, dialogs, etc.
const AuthenticatedApp = lazy(() => import('./AuthenticatedApp'))
const UnauthenticatedApp = lazy(() => import('./UnauthenticatedApp'))

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // The mock fails ~5% of requests; one automatic retry hides most of those.
      queries: { retry: 1, refetchOnWindowFocus: false },
    },
  })
}

export default function App() {
  // One client per App instance, so tests never share a cache.
  const [queryClient] = useState(createQueryClient)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
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
