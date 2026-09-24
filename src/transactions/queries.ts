import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, isApiError } from '../lib/api'
import { useAuth } from '../auth/authContext'
import type { Transaction, TransactionListRow } from '../types/transaction'

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

export function useTransaction(id: string) {
  const authedFetch = useAuthedFetch()
  return useQuery({
    queryKey: transactionKey(id),
    queryFn: ({ signal }) => authedFetch<Transaction>(`/api/transactions/${id}`, { signal }),
    // A missing transaction is a normal outcome shown in-page; everything else
    // is thrown to the error boundary, which offers a retry.
    throwOnError: (error) => !isApiError(error, 404),
  })
}

export interface RefundInput {
  amount: number
  reason: string
}

export function useRefund(id: string) {
  const authedFetch = useAuthedFetch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RefundInput) =>
      authedFetch<Transaction>(`/api/transactions/${id}/refund`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(transactionKey(updated.id), updated)
      // Patch the one row in the cached list instead of refetching all 5,000.
      queryClient.setQueryData(transactionsKey, (rows: TransactionListRow[] | undefined) =>
        rows?.map((row) =>
          row.id === updated.id
            ? { ...row, status: updated.status, refundedAmount: updated.refundedAmount }
            : row,
        ),
      )
    },
  })
}
