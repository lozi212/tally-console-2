import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type {
  MRT_ColumnFiltersState,
  MRT_PaginationState,
  MRT_SortingState,
} from 'material-react-table'
import { STATUSES, type Status } from '../types/transaction'

export const DEFAULT_PAGE_SIZE = 25

type Updater<T> = T | ((old: T) => T)

function resolve<T>(updater: Updater<T>, current: T): T {
  return typeof updater === 'function' ? (updater as (old: T) => T)(current) : updater
}

function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value)
}

/**
 * Single source of truth for the table's view: the URL.
 *
 * q=card&status=pending,failed&sort=amount.desc&page=3&size=25
 *
 * Reading parses the URL, writing replaces it, so a reload or a shared link
 * rebuilds the same view. Typing in the search box replaces the current
 * history entry (otherwise every keystroke would need its own Back press);
 * filters, sorting and paging push, so Back returns to the previous view.
 */
export function useTableUrlState() {
  const [searchParams, setSearchParams] = useSearchParams()

  const globalFilter = searchParams.get('q') ?? ''

  const columnFilters = useMemo<MRT_ColumnFiltersState>(() => {
    const raw = searchParams.get('status')
    if (!raw) return []
    const statuses = raw.split(',').filter(isStatus)
    return statuses.length ? [{ id: 'status', value: statuses }] : []
  }, [searchParams])

  const sorting = useMemo<MRT_SortingState>(() => {
    const raw = searchParams.get('sort')
    if (!raw) return []
    const [id, direction] = raw.split('.')
    return id ? [{ id, desc: direction === 'desc' }] : []
  }, [searchParams])

  const pagination = useMemo<MRT_PaginationState>(() => {
    const page = Number(searchParams.get('page'))
    const size = Number(searchParams.get('size'))
    return {
      // The URL is 1-based for humans; the table is 0-based.
      pageIndex: Number.isInteger(page) && page > 0 ? page - 1 : 0,
      pageSize: Number.isInteger(size) && size > 0 ? size : DEFAULT_PAGE_SIZE,
    }
  }, [searchParams])

  const update = useCallback(
    (mutate: (params: URLSearchParams) => void, options?: { replace?: boolean }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          mutate(next)
          return next
        },
        { replace: options?.replace ?? false },
      )
    },
    [setSearchParams],
  )

  const setGlobalFilter = useCallback(
    (updater: Updater<string | undefined>) => {
      const value = resolve(updater, globalFilter) ?? ''
      update(
        (params) => {
          if (value) params.set('q', value)
          else params.delete('q')
          params.delete('page') // a new search starts at page 1
        },
        { replace: true },
      )
    },
    [globalFilter, update],
  )

  const setColumnFilters = useCallback(
    (updater: Updater<MRT_ColumnFiltersState>) => {
      const next = resolve(updater, columnFilters)
      const statuses = next.find((f) => f.id === 'status')?.value
      update((params) => {
        if (Array.isArray(statuses) && statuses.length) params.set('status', statuses.join(','))
        else params.delete('status')
        params.delete('page')
      })
    },
    [columnFilters, update],
  )

  const setSorting = useCallback(
    (updater: Updater<MRT_SortingState>) => {
      const next = resolve(updater, sorting)
      update((params) => {
        if (next.length) params.set('sort', `${next[0].id}.${next[0].desc ? 'desc' : 'asc'}`)
        else params.delete('sort')
      })
    },
    [sorting, update],
  )

  const setPagination = useCallback(
    (updater: Updater<MRT_PaginationState>) => {
      const next = resolve(updater, pagination)
      update((params) => {
        if (next.pageIndex > 0) params.set('page', String(next.pageIndex + 1))
        else params.delete('page')
        if (next.pageSize !== DEFAULT_PAGE_SIZE) params.set('size', String(next.pageSize))
        else params.delete('size')
      })
    },
    [pagination, update],
  )

  return {
    globalFilter,
    columnFilters,
    sorting,
    pagination,
    setGlobalFilter,
    setColumnFilters,
    setSorting,
    setPagination,
  }
}
