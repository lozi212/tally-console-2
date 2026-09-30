import { useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import SearchIcon from '@mui/icons-material/Search'
import PeopleIcon from '@mui/icons-material/People'

import { useTransactions } from '../transactions/queries'
import { formatMoney } from '../lib/format'

export default function CustomersPage() {
  const { data, isPending, isError, error } =
    useTransactions()

  const [search, setSearch] = useState('')

  const customers = useMemo(() => {
    if (!data) return []

    const customerMap = new Map<
      string,
      {
        id: string
        name: string
        email: string
        transactions: number
        total: number
      }
    >()

    for (const transaction of data) {
      const customer = transaction.customer
      const key = customer.email || customer.name

      const existing = customerMap.get(key)

      if (existing) {
        existing.transactions += 1
        existing.total += transaction.amount
      } else {
        customerMap.set(key, {
          id: key,
          name: customer.name,
          email: customer.email || '',
          transactions: 1,
          total: transaction.amount,
        })
      }
    }

    return Array.from(customerMap.values())
  }, [data])

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return customers

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query),
    )
  }, [customers, search])

  if (isError) {
    return (
      <Alert severity="error">
        Could not load customers. {error.message}
      </Alert>
    )
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" component="h1">
          Customers
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Customers associated with your transactions.
        </Typography>
      </Box>

      <TextField
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search customers"
        fullWidth
        size="small"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {isPending ? (
        <Typography color="text.secondary">
          Loading customers...
        </Typography>
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <CardContent>
            <Stack
              alignItems="center"
              spacing={1}
              sx={{ py: 4 }}
            >
              <PeopleIcon color="disabled" />

              <Typography>
                No customers found.
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Try a different search.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          {filteredCustomers.map((customer) => (
            <Card key={customer.id}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                  >
                    <Avatar>
                      {customer.name
                        .charAt(0)
                        .toUpperCase()}
                    </Avatar>

                    <Box minWidth={0}>
                      <Typography
                        fontWeight={600}
                        noWrap
                        title={customer.name}
                      >
                        {customer.name}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        title={customer.email}
                      >
                        {customer.email || 'No email'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Transactions
                      </Typography>

                      <Typography fontWeight={600}>
                        {customer.transactions}
                      </Typography>
                    </Box>

                    <Box textAlign="right">
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Total
                      </Typography>

                      <Typography fontWeight={600}>
                        {formatMoney(customer.total)}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Stack>
  )
}
