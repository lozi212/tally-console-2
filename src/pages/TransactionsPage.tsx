import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_FilterFn,
} from 'material-react-table'

import {
  Alert,
  Box,
  Button,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'

import StatusChip from '../components/StatusChip'

import {
  formatDate,
  formatFullDate,
  formatMoney,
  humanise,
} from '../lib/format'

import {
  usePrefetchTransaction,
  useTransactions,
} from '../transactions/queries'

import { useTableUrlState } from '../transactions/useTableUrlState'

import {
  STATUSES,
  type TransactionListRow,
} from '../types/transaction'

/**
 * Exact matching for multi-select filters.
 *
 * This prevents "refunded" from matching
 * "partially_refunded".
 */
const matchesAny: MRT_FilterFn<TransactionListRow> = (
  row,
  columnId,
  filterValue,
) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) {
    return true
  }

  return filterValue.includes(row.getValue(columnId))
}

export default function TransactionsPage() {
  const navigate = useNavigate()

  const prefetchTransaction = usePrefetchTransaction()

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useTransactions()

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

        size: 180,
        minSize: 150,
        maxSize: 240,

        Cell: ({ cell }) => {
          const reference = cell.getValue<string>()

          return (
            <Tooltip title={reference}>
              <Box
                component="span"
                sx={{
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {reference}
              </Box>
            </Tooltip>
          )
        },
      },

      {
        id: 'customer',
        header: 'Customer',

        accessorFn: (row) =>
          `${row.customer.name} ${row.customer.email}`.trim(),

        filterVariant: 'text',

        size: 280,
        minSize: 220,
        maxSize: 360,

        Cell: ({ row }) => (
          <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
            <Typography
              variant="body2"
              noWrap
              title={row.original.customer.name}
            >
              {row.original.customer.name}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              title={row.original.customer.email || ''}
            >
              {row.original.customer.email || '—'}
            </Typography>
          </Box>
        ),
      },

      {
        accessorKey: 'amount',
        header: 'Amount',

        muiTableHeadCellProps: {
          align: 'right',
        },

        muiTableBodyCellProps: {
          align: 'right',
        },

        Cell: ({ row }) => (
          <Box>
            <Typography variant="body2" noWrap>
              {formatMoney(row.original.amount)}
            </Typography>

            {row.original.refundedAmount > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
              >
                {formatMoney(row.original.refundedAmount)} refunded
              </Typography>
            )}
          </Box>
        ),

        size: 150,
        minSize: 130,
      },

      {
        accessorKey: 'method',
        header: 'Method',

        Cell: ({ cell }) => humanise(cell.getValue<string>()),

        size: 130,
        minSize: 110,
      },

      {
        accessorKey: 'status',
        header: 'Status',

        filterVariant: 'multi-select',
        filterFn: matchesAny,

        filterSelectOptions: STATUSES.map((status) => ({
          label: humanise(status),
          value: status,
        })),

        Cell: ({ row }) => (
          <StatusChip status={row.original.status} />
        ),

        size: 150,
        minSize: 130,
      },

      {
        accessorKey: 'createdAt',
        header: 'Created',

        Cell: ({ cell }) => {
          const iso = cell.getValue<string>()

          return (
            <Tooltip title={formatFullDate(iso)}>
              <Box component="span" whiteSpace="nowrap">
                {formatDate(iso)}
              </Box>
            </Tooltip>
          )
        },

        size: 140,
        minSize: 120,
      },
    ],
    [],
  )

  const table = useMaterialReactTable({
    columns,
    data: data ?? [],

    /*
     * Keep the defined column widths.
     * This also preserves horizontal scrolling on smaller screens.
     */
    layoutMode: 'grid-no-grow',

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

    autoResetPageIndex: false,

    enableMultiSort: false,
    enableColumnFilterModes: false,

    enableDensityToggle: true,

    enableFullScreenToggle: false,

    initialState: {
      showGlobalFilter: true,
      showColumnFilters: true,
      density: 'comfortable',
    },

    muiSearchTextFieldProps: {
      placeholder: 'Search transactions',
      inputProps: {
        'aria-label': 'Search transactions',
      },
    },

    /*
     * Keep rows compact enough that pagination remains easy to reach.
     */
    muiTableBodyCellProps: {
      sx: {
        height: 72,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    },

    /*
     * Let the table body scroll vertically instead of forcing
     * the entire page to become unnecessarily tall.
     */
    muiTableContainerProps: {
      sx: {
        maxHeight: {
          xs: 'calc(100vh - 330px)',
          md: 'calc(100vh - 300px)',
        },
        overflow: 'auto',
      },
    },

    muiTableBodyRowProps: ({ row }) => ({
      onClick: () =>
        navigate(`/transactions/${row.original.id}`),

      onMouseEnter: () =>
        prefetchTransaction(row.original.id),

      sx: {
        cursor: 'pointer',
      },
    }),

    renderEmptyRowsFallback: () => (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1">
          No transactions match this view.
        </Typography>

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
            <Button
              color="inherit"
              size="small"
              onClick={() => void refetch()}
            >
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
    <Stack
      spacing={2}
      sx={{
        minWidth: 0,
        height: '100%',
      }}
    >
      <Typography variant="h5" component="h1">
        Transactions
      </Typography>

      <Box
        sx={{
          minWidth: 0,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <MaterialReactTable table={table} />
      </Box>
    </Stack>
  )
}

