import { useCallback, useMemo, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, isApiError } from '../lib/api'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { FullPageError, FullPageLoader } from '../components/FullPageStatus'
import type { LoginResponse, User } from '../types/transaction'
import { AuthContext, meQueryKey, TOKEN_STORAGE_KEY, type AuthContextValue } from './authContext'

/**
 * Owns the session. A stored token is verified with GET /api/me before any
 * children render; until then the whole page shows a loader. A 401 means the
 * token is dead, so it is dropped and the user lands on the login page.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useLocalStorageState<string | null>(TOKEN_STORAGE_KEY, null)

  const me = useQuery({
    queryKey: meQueryKey(token),
    queryFn: async ({ signal }) => {
      try {
        return await apiFetch<User>('/api/me', { token, signal })
      } catch (error) {
        if (isApiError(error, 401)) {
          setToken(null)
          return null
        }
        throw error
      }
    },
    enabled: token !== null,
    // The session does not change underneath us, so never refetch it in the background.
    staleTime: Infinity,
    retry: (failureCount, error) => !isApiError(error, 401) && failureCount < 2,
  })

  const login = useCallback(
    async (username: string, password: string) => {
      const { token: newToken, user } = await apiFetch<LoginResponse>('/api/login', {
        method: 'POST',
        body: { username, password },
      })
      // Seed the cache first so the bootstrap query is already satisfied for the new token.
      queryClient.setQueryData(meQueryKey(newToken), user)
      setToken(newToken)
    },
    [queryClient, setToken],
  )

  const logout = useCallback(() => {
    setToken(null)
    // Drop every cached response so the next user cannot see the previous one's data.
    queryClient.clear()
  }, [queryClient, setToken])

  const user = token ? (me.data ?? null) : null

  // Memoised so consumers only re-render when the session actually changes.
  const value = useMemo<AuthContextValue>(
    () => ({ user, token: user ? token : null, login, logout }),
    [user, token, login, logout],
  )

  if (token && me.isPending) return <FullPageLoader />
  if (token && me.isError) {
    return (
      <FullPageError
        message={`Could not restore your session. ${me.error.message}`}
        onRetry={() => void me.refetch()}
      />
    )
  }

  return <AuthContext value={value}>{children}</AuthContext>
}
