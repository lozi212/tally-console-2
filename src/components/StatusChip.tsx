import { Chip } from '@mui/material'
import { humanise } from '../lib/format'
import type { Status } from '../types/transaction'

const COLOURS: Record<Status, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  succeeded: 'success',
  pending: 'warning',
  failed: 'error',
  partially_refunded: 'info',
  refunded: 'default',
}

export default function StatusChip({ status }: { status: Status }) {
  return <Chip size="small" label={humanise(status)} color={COLOURS[status]} variant="filled" />
}
