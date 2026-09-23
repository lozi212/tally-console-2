import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch, isApiError } from '../lib/api'
import { useAuth } from '../auth/authContext'
import type { TransactionListRow } from '../types/transaction'

export const transactionsKey = ['transactions'] as const
export const transactionKey = (id: string) => ['transaction', id] as const

/**
 * apiFetch with the session token attached. A 401 means the token died
 * mid-session, so we log out rather than leave the user on a broken page.
 */
function useAuthedFetch() {
  const { token, logout } = useAuth()
  return useCallback(
    async <T>(path: string, options: Parameters<typeof apiFetch>[1] = {}): Promise<T> => {
      try {
        return await apiFetch<T>(path, { ...options, token })
      } catch (error) {
        if (isApiError(error, 401)) logout()
        throw error
      }
    },
    [token, logout],
  )
}

export function useTransactions() {
  const authedFetch = useAuthedFetch()
  return useQuery({
    queryKey: transactionsKey,
    queryFn: ({ signal }) => authedFetch<TransactionListRow[]>('/api/transactions', { signal }),
    // The whole list is one 5,000-row response; don't re-fetch it on every mount.
    staleTime: 60_000,
  })
}
