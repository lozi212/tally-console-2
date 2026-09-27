import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_FilterFn,
} from 'material-react-table'
import { Alert, Box, Button, Stack, Tooltip, Typography } from '@mui/material'
import StatusChip from '../components/StatusChip'
import { formatDate, formatFullDate, formatMoney, humanise } from '../lib/format'
import { usePrefetchTransaction, useTransactions } from '../transactions/queries'
import { useTableUrlState } from '../transactions/useTableUrlState'
import { METHODS, STATUSES, type TransactionListRow } from '../types/transaction'

/**
 * Exact match against the selected values. The built-in multi-select filters
 * all use substring matching, which would let "refunded" match
 * "partially_refunded".
 */
const matchesAny: MRT_FilterFn<TransactionListRow> = (row, columnId, filterValue) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true
  return filterValue.includes(row.getValue(columnId))
}

export default function TransactionsPage() {
  const navigate = useNavigate()
  const prefetchTransaction = usePrefetchTransaction()
  const { data, isPending, isError, error, refetch, isFetching } = useTransactions()
  const {
    globalFilter,
    columnFilters,
    sorting,
    pagination,
    setGlobalFilter,
    setColumnFilters,
    setSorting,
    setPagination,
  } = useTableUrlState()

  const columns = useMemo<MRT_ColumnDef<TransactionListRow>[]>(
    () => [
      {
        accessorKey: 'reference',
        header: 'Reference',
        size: 160,
      },
      {
        id: 'customer',
        header: 'Customer',
        // Searching should match either the name or the email.
        accessorFn: (row) => `${row.customer.name} ${row.customer.email}`.trim(),
        Cell: ({ row }) => (
          <Box>
            <Typography variant="body2">{row.original.customer.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {row.original.customer.email || '—'}
            </Typography>
          </Box>
        ),
        size: 240,
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        filterVariant: 'range',
        muiTableHeadCellProps: { align: 'right' },
        muiTableBodyCellProps: { align: 'right' },
        Cell: ({ row }) => (
          <Box>
            <Typography variant="body2">{formatMoney(row.original.amount)}</Typography>
            {row.original.refundedAmount > 0 && (
              <Typography variant="caption" color="text.secondary">
                {formatMoney(row.original.refundedAmount)} refunded
              </Typography>
            )}
          </Box>
        ),
        size: 150,
      },
      {
        accessorKey: 'method',
        header: 'Method',
        filterVariant: 'multi-select',
        filterFn: matchesAny,
        filterSelectOptions: METHODS.map((m) => ({ label: humanise(m), value: m })),
        Cell: ({ cell }) => humanise(cell.getValue<string>()),
        size: 130,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        filterVariant: 'multi-select',
        filterFn: matchesAny,
        filterSelectOptions: STATUSES.map((s) => ({ label: humanise(s), value: s })),
        Cell: ({ row }) => <StatusChip status={row.original.status} />,
        size: 150,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        enableColumnFilter: false,
        Cell: ({ cell }) => {
          const iso = cell.getValue<string>()
          return <Tooltip title={formatFullDate(iso)}>{<span>{formatDate(iso)}</span>}</Tooltip>
        },
        size: 140,
      },
    ],
    [],
  )

  const table = useMaterialReactTable({
    columns,
    data: data ?? [],
    state: {
      globalFilter,
      columnFilters,
      sorting,
      pagination,
      isLoading: isPending,
      showProgressBars: !isPending && isFetching,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    // The URL owns the page number. Left on, the table would reset to page 1
    // whenever the filter/sort objects are rebuilt from a changed URL.
    autoResetPageIndex: false,
    enableMultiSort: false,
    enableColumnFilterModes: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    initialState: { showGlobalFilter: true, density: 'comfortable' },
    muiSearchTextFieldProps: {
      placeholder: 'Search transactions',
      inputProps: { 'aria-label': 'Search transactions' },
    },
    // Rows must all be the same height. Otherwise a page of taller rows moves
    // the pagination controls, and the next click lands on a row instead of
    // the button it was aimed at.
    muiTableBodyCellProps: {
      sx: { height: 72, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => navigate(`/transactions/${row.original.id}`),
      // Load the detail before the click lands, so the page is usually instant.
      onMouseEnter: () => prefetchTransaction(row.original.id),
      sx: { cursor: 'pointer' },
    }),
    renderEmptyRowsFallback: () => (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1">No transactions match this view.</Typography>
        <Typography variant="body2" color="text.secondary">
          Try clearing the search or the status filter.
        </Typography>
      </Box>
    ),
  })

  if (isError) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5" component="h1">
          Transactions
        </Typography>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          Could not load transactions. {error.message}
        </Alert>
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h1">
        Transactions
      </Typography>
      <MaterialReactTable table={table} />
    </Stack>
  )
}
