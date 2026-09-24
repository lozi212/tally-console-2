import type { ReactNode } from 'react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { Alert, Button, Stack, Typography } from '@mui/material'
import ErrorBoundary from './ErrorBoundary'

/**
 * Catches whatever a page throws and offers a retry. Retrying also clears the
 * failed queries, otherwise React Query would hand back the cached error and
 * the page would fail again immediately.
 */
export default function QueryErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallback={(error, retry) => (
            <Stack spacing={2}>
              <Typography variant="h5" component="h1">
                Something went wrong
              </Typography>
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={retry}>
                    Retry
                  </Button>
                }
              >
                {error.message}
              </Alert>
            </Stack>
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
