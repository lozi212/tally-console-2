import { useParams } from 'react-router-dom'
import { Typography } from '@mui/material'

// Placeholder route target; the detail view is built on Day 3.
export default function TransactionDetailPage() {
  const { id } = useParams()
  return (
    <Typography variant="h5" component="h1">
      Transaction {id}
    </Typography>
  )
}
