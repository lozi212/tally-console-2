
import { useMemo } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material'

import PaymentsIcon from '@mui/icons-material/Payments'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import ReplayIcon from '@mui/icons-material/Replay'

import { useTransactions } from '../transactions/queries'
import { formatMoney, humanise } from '../lib/format'

export default function PaymentsPage() {
  const { data, isPending, isError, error } =
    useTransactions()

  const summary = useMemo(() => {
    if (!data) {
      return {
        total: 0,
        amount: 0,
        refunded: 0,
        failed: 0,
      }
    }

    return data.reduce(
      (result, transaction) => {
        result.total += 1
        result.amount += transaction.amount

        if (
          transaction.status === 'refunded' ||
          transaction.status === 'partially_refunded'
        ) {
          result.refunded += 1
        }

        if (transaction.status === 'failed') {
          result.failed += 1
        }

        return result
      },
      {
        total: 0,
        amount: 0,
        refunded: 0,
        failed: 0,
      },
    )
  }, [data])

  const methods = useMemo(() => {
    if (!data) return []

    const counts = new Map<string, number>()

    for (const transaction of data) {
      counts.set(
        transaction.method,
        (counts.get(transaction.method) ?? 0) + 1,
      )
    }

    return Array.from(counts.entries()).sort(
      (a, b) => b[1] - a[1],
    )
  }, [data])

  if (isError) {
    return (
      <Alert severity="error">
        Could not load payments. {error.message}
      </Alert>
    )
  }

  if (isPending) {
    return (
      <Typography color="text.secondary">
        Loading payments...
      </Typography>
    )
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" component="h1">
          Payments
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Overview of payment activity.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2,
        }}
      >
        <SummaryCard
          title="Total payments"
          value={summary.total.toLocaleString()}
          icon={<PaymentsIcon />}
        />

        <SummaryCard
          title="Payment volume"
          value={formatMoney(summary.amount)}
          icon={<CheckCircleOutlineIcon />}
        />

        <SummaryCard
          title="Refunded"
          value={summary.refunded.toLocaleString()}
          icon={<ReplayIcon />}
        />

        <SummaryCard
          title="Failed"
          value={summary.failed.toLocaleString()}
          icon={<CancelOutlinedIcon />}
        />
      </Box>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">
              Payment methods
            </Typography>

            {methods.map(([method, count]) => (
              <Stack
                key={method}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>
                  {humanise(method)}
                </Typography>

                <Typography
                  fontWeight={600}
                  color="text.secondary"
                >
                  {count.toLocaleString()}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={1}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: 'primary.main',
            }}
          >
            {icon}

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {title}
            </Typography>
          </Box>

          <Typography variant="h5" fontWeight={700}>
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

