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
function parseGlobalFilter(params: URLSearchParams): string {
  return params.get('q') ?? ''
}

function parseColumnFilters(params: URLSearchParams): MRT_ColumnFiltersState {
  const raw = params.get('status')
  if (!raw) return []
  const statuses = raw.split(',').filter(isStatus)
  return statuses.length ? [{ id: 'status', value: statuses }] : []
}

function parseSorting(params: URLSearchParams): MRT_SortingState {
  const raw = params.get('sort')
  if (!raw) return []
  const [id, direction] = raw.split('.')
  return id ? [{ id, desc: direction === 'desc' }] : []
}

function parsePagination(params: URLSearchParams): MRT_PaginationState {
  const page = Number(params.get('page'))
  const size = Number(params.get('size'))
  return {
    // The URL is 1-based for humans; the table is 0-based.
    pageIndex: Number.isInteger(page) && page > 0 ? page - 1 : 0,
    pageSize: Number.isInteger(size) && size > 0 ? size : DEFAULT_PAGE_SIZE,
  }
}

export function useTableUrlState() {
  const [searchParams, setSearchParams] = useSearchParams()

  const globalFilter = parseGlobalFilter(searchParams)
  const columnFilters = useMemo(() => parseColumnFilters(searchParams), [searchParams])
  const sorting = useMemo(() => parseSorting(searchParams), [searchParams])
  const pagination = useMemo(() => parsePagination(searchParams), [searchParams])

  /**
   * Writes through the URL. `mutate` is handed the params as they are *now*,
   * not as they were when this component last rendered: two clicks in one tick
   * would otherwise both resolve against the same stale page and the first
   * would be lost.
   */
  const update = useCallback(
    (mutate: (params: URLSearchParams) => void, options?: { replace?: boolean }) => {
      // Read the live URL rather than the params React Router passes in: those
      // come from the last render, so a second click in the same tick would
      // resolve against the old page and silently drop the first one. The
      // address bar is already up to date, because navigation writes it
      // synchronously.
      const next = new URLSearchParams(window.location.search)
      mutate(next)
      setSearchParams(next, { replace: options?.replace ?? false })
    },
    [setSearchParams],
  )

  const setGlobalFilter = useCallback(
    (updater: Updater<string | undefined>) => {
      update(
        (params) => {
          const value = resolve(updater, parseGlobalFilter(params)) ?? ''
          if (value) params.set('q', value)
          else params.delete('q')
          params.delete('page') // a new search starts at page 1
        },
        { replace: true },
      )
    },
    [update],
  )

  const setColumnFilters = useCallback(
    (updater: Updater<MRT_ColumnFiltersState>) => {
      update((params) => {
        const next = resolve(updater, parseColumnFilters(params))
        const statuses = next.find((f) => f.id === 'status')?.value
        if (Array.isArray(statuses) && statuses.length) params.set('status', statuses.join(','))
        else params.delete('status')
        params.delete('page')
      })
    },
    [update],
  )

  const setSorting = useCallback(
    (updater: Updater<MRT_SortingState>) => {
      update((params) => {
        const next = resolve(updater, parseSorting(params))
        if (next.length) params.set('sort', `${next[0].id}.${next[0].desc ? 'desc' : 'asc'}`)
        else params.delete('sort')
      })
    },
    [update],
  )

  const setPagination = useCallback(
    (updater: Updater<MRT_PaginationState>) => {
      update((params) => {
        const next = resolve(updater, parsePagination(params))
        if (next.pageIndex > 0) params.set('page', String(next.pageIndex + 1))
        else params.delete('page')
        if (next.pageSize !== DEFAULT_PAGE_SIZE) params.set('size', String(next.pageSize))
        else params.delete('size')
      })
    },
    [update],
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
