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
