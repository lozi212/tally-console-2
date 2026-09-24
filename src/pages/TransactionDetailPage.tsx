import { useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
    <Stack spacing={3}>
      {/* Revalidating cached data: the page stays readable, the bar shows work. */}
      <Box sx={{ height: 4 }}>{isFetching && <LinearProgress />}</Box>

      <Box>
        <Button size="small" onClick={() => navigate(-1)} sx={{ ml: -1 }}>
          ← Back
        </Button>
      </Box>

      <Header transaction={data} />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Amount label="Gross" value={data.amount} />
        <Amount label="Refunded" value={data.refundedAmount} />
        <Amount label="Refundable" value={refundable} />
        <Box sx={{ flex: 1 }} />
        <Box sx={{ alignSelf: 'center' }}>
          {canRefund ? (
            <Button variant="contained" onClick={() => setDialogOpen(true)}>
              Refund
            </Button>
          ) : (
            <Tooltip title={refundBlockedReason}>
              {/* A disabled button fires no events, so the tooltip needs a wrapper. */}
              <span>
                <Button variant="contained" disabled>
                  Refund
                </Button>
              </span>
            </Tooltip>
          )}
        </Box>
      </Stack>

      <LineItems transaction={data} />

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

function Header({ transaction }: { transaction: Transaction }) {
  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h1" sx={{ wordBreak: 'break-all' }}>
          {transaction.reference}
        </Typography>
        <StatusChip status={transaction.status} />
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {transaction.customer.name}
        {transaction.customer.email ? ` · ${transaction.customer.email}` : ''} ·{' '}
        {humanise(transaction.method)} · {formatFullDate(transaction.createdAt)}
      </Typography>
    </Stack>
  )
}

function Amount({ label, value }: { label: string; value: number }) {
  return (
    <Card variant="outlined" sx={{ minWidth: 160 }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6">{formatMoney(value)}</Typography>
      </CardContent>
    </Card>
  )
}

function LineItems({ transaction }: { transaction: Transaction }) {
  const items = transaction.items ?? []
  return (
    <Paper variant="outlined">
      <Typography variant="subtitle1" sx={{ p: 2, pb: 1 }}>
        Line items
      </Typography>
      <Divider />
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
        </TableBody>
      </Table>
    </Paper>
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
      <Stack direction="row" spacing={2}>
        <Skeleton variant="rounded" width={160} height={90} />
        <Skeleton variant="rounded" width={160} height={90} />
        <Skeleton variant="rounded" width={160} height={90} />
      </Stack>
      <Skeleton variant="rounded" height={220} />
    </Stack>
  )
}
