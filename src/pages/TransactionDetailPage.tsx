import { useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Divider,
  LinearProgress,
  Link,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined'
import StatusChip from '../components/StatusChip'
import RefundDialog from '../components/RefundDialog'
import { formatFullDate, formatMoney, humanise } from '../lib/format'
import { useTransaction } from '../transactions/queries'
import { isRefundable, type Status, type Transaction } from '../types/transaction'

const NOT_REFUNDABLE_REASON: Partial<Record<Status, string>> = {
  pending: 'This transaction has not completed yet.',
  failed: 'Failed transactions never took payment.',
  refunded: 'This transaction is already fully refunded.',
}

export default function TransactionDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data, isPending, isFetching, error } = useTransaction(id)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Any other failure is thrown to the error boundary (see queries.ts).
  if (error) return <NotFound id={id} />
  if (isPending) return <DetailSkeleton />

  const refundable = Math.round((data.amount - data.refundedAmount) * 100) / 100
  const canRefund = isRefundable(data.status) && refundable > 0
  const refundBlockedReason = NOT_REFUNDABLE_REASON[data.status] ?? 'Nothing left to refund.'

  return (
    <Stack spacing={2.5}>
      {/* Revalidating cached data: the page stays readable, the bar shows work. */}
      <Box sx={{ height: 4 }}>{isFetching && <LinearProgress />}</Box>

      <Box>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ ml: -1 }}
        >
          Back
        </Button>
      </Box>

      {/* Title and the one action, kept together at the top. */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-start' }, justifyContent: 'space-between' }}
      >
        <Stack spacing={1} sx={{ minWidth: 0 }}>
          <Typography variant="h5" component="h1" sx={{ wordBreak: 'break-word' }}>
            {data.reference}
          </Typography>
          <Box>
            <StatusChip status={data.status} />
          </Box>
        </Stack>

        <Box sx={{ flexShrink: 0 }}>
          {canRefund ? (
            <Button variant="contained" size="large" onClick={() => setDialogOpen(true)}>
              Refund
            </Button>
          ) : (
            <Tooltip title={refundBlockedReason}>
              {/* A disabled button fires no events, so the tooltip needs a wrapper. */}
              <span>
                <Button variant="contained" size="large" disabled>
                  Refund
                </Button>
              </span>
            </Tooltip>
          )}
        </Box>
      </Stack>

      {/* Line items take the width; the figures and facts sit beside them. */}
      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(0, 1fr)' },
          alignItems: 'start',
        }}
      >
        <LineItems transaction={data} />
        <Stack spacing={2.5}>
          <Summary transaction={data} refundable={refundable} />
          <Details transaction={data} />
        </Stack>
      </Box>

      <RefundDialog
        transaction={data}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onRefunded={(message) => {
          setDialogOpen(false)
          setToast(message)
        }}
      />

      <Snackbar
        open={!!toast}
        message={toast ?? ''}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
      />
    </Stack>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined">
      <Typography variant="subtitle2" sx={{ p: 2, py: 1.5 }}>
        {title}
      </Typography>
      <Divider />
      {children}
    </Paper>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ justifyContent: 'space-between', alignItems: 'baseline', px: 2, py: 1 }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        variant={strong ? 'subtitle1' : 'body2'}
        sx={{ fontWeight: strong ? 700 : 400, textAlign: 'right', wordBreak: 'break-word' }}
      >
        {value}
      </Typography>
    </Stack>
  )
}

function Summary({ transaction, refundable }: { transaction: Transaction; refundable: number }) {
  return (
    <Panel title="Amounts">
      <Box sx={{ py: 0.5 }}>
        <Row label="Gross" value={formatMoney(transaction.amount)} />
        <Row label="Refunded" value={formatMoney(transaction.refundedAmount)} />
        <Divider sx={{ my: 0.5 }} />
        <Row label="Refundable" value={formatMoney(refundable)} strong />
      </Box>
    </Panel>
  )
}

function Details({ transaction }: { transaction: Transaction }) {
  return (
    <Panel title="Details">
      <Box sx={{ py: 0.5 }}>
        <Row label="Customer" value={transaction.customer.name} />
        <Row label="Email" value={transaction.customer.email || '—'} />
        <Row label="Method" value={humanise(transaction.method)} />
        {/* The exact time, not "3 days ago": on one transaction the precise
            moment is what a merchant reconciles against. */}
        <Row label="Created" value={formatFullDate(transaction.createdAt)} />
      </Box>
    </Panel>
  )
}

function LineItems({ transaction }: { transaction: Transaction }) {
  const items = transaction.items ?? []
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  return (
    <Panel title={`Line items (${items.length})`}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Description</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell align="right">Unit price</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={`${item.description}-${index}`}>
              <TableCell>{item.description}</TableCell>
              <TableCell align="right">{item.quantity}</TableCell>
              <TableCell align="right">{formatMoney(item.unitPrice)}</TableCell>
              <TableCell align="right">{formatMoney(item.quantity * item.unitPrice)}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={3} sx={{ borderBottom: 0, fontWeight: 600 }}>
              Total
            </TableCell>
            <TableCell align="right" sx={{ borderBottom: 0, fontWeight: 600 }}>
              {formatMoney(Math.round(total * 100) / 100)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Panel>
  )
}

function NotFound({ id }: { id: string }) {
  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h1">
        Transaction not found
      </Typography>
      <Alert severity="warning">
        No transaction matches <strong>{id}</strong>. It may have been removed, or the link may be
        wrong.
      </Alert>
      <Link component={RouterLink} to="/transactions">
        Back to transactions
      </Link>
    </Stack>
  )
}

function DetailSkeleton() {
  return (
    <Stack spacing={3} aria-label="Loading transaction">
      <Skeleton variant="text" width={280} height={48} />
      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(0, 1fr)' },
        }}
      >
        <Skeleton variant="rounded" height={260} />
        <Stack spacing={2.5}>
          <Skeleton variant="rounded" height={140} />
          <Skeleton variant="rounded" height={190} />
        </Stack>
      </Box>
    </Stack>
  )
}
