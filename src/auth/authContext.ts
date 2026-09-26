import { createContext, useContext } from 'react'
import type { User } from '../types/transaction'

export interface AuthContextValue {
  /** The signed-in user, or null when logged out. */
  user: User | null
  /** Bearer token for API calls; non-null whenever `user` is. */
  token: string | null
  /** Resolves once signed in; rejects with an ApiError the form can display. */
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  /**
   * Development only: signs the same user back in when the mock has forgotten
   * the session, and returns the fresh token. Resolves to null in production,
   * or when there is nothing to recover from.
   */
  recoverSession: () => Promise<string | null>
}

export const TOKEN_STORAGE_KEY = 'tally.token'

export function meQueryKey(token: string | null) {
  return ['me', token] as const
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
