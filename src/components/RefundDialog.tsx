import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { formatMoney } from '../lib/format'
import { useRefund } from '../transactions/queries'
import type { Transaction } from '../types/transaction'

function buildSchema(refundable: number) {
  return z.object({
    amount: z.coerce
      .number<number>({ error: 'Enter an amount' })
      .positive('Amount must be greater than zero')
      .max(refundable, `Amount cannot exceed the refundable balance of ${formatMoney(refundable)}`),
    reason: z.string().trim().min(5, 'Give a reason of at least 5 characters'),
  })
}

type RefundValues = { amount: number; reason: string }

interface Props {
  transaction: Transaction
  open: boolean
  onClose: () => void
  onRefunded: (message: string) => void
}

export default function RefundDialog({ transaction, open, onClose, onRefunded }: Props) {
  const refundable = Math.round((transaction.amount - transaction.refundedAmount) * 100) / 100
  const mutation = useRefund(transaction.id)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RefundValues>({
    resolver: zodResolver(buildSchema(refundable)),
    defaultValues: { amount: refundable, reason: '' },
  })

  const { ref: amountRef, ...amountField } = register('amount')
  const { ref: reasonRef, ...reasonField } = register('reason')

  function close() {
    mutation.reset()
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <form
        onSubmit={handleSubmit((values) =>
          mutation.mutate(values, {
            onSuccess: (updated) => {
              reset()
              onRefunded(`Refunded ${formatMoney(values.amount)} of ${updated.reference}.`)
            },
          }),
        )}
        noValidate
      >
        <DialogTitle>Refund {transaction.reference}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <DialogContentText>
              Up to {formatMoney(refundable)} can be refunded on this transaction.
            </DialogContentText>

            {mutation.isError && <Alert severity="error">{mutation.error.message}</Alert>}

            <TextField
              label="Amount"
              type="number"
              required
              inputRef={amountRef}
              {...amountField}
              slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
              error={!!errors.amount}
              helperText={errors.amount?.message}
            />
            <TextField
              label="Reason"
              multiline
              minRows={2}
              required
              inputRef={reasonRef}
              {...reasonField}
              error={!!errors.reason}
              helperText={errors.reason?.message ?? 'Shown to the merchant in the refund record.'}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={mutation.isPending}>
            Refund
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
