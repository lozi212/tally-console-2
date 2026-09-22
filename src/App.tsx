import { useState } from 'react'
import { Alert, Box, Button, Container, Paper, Stack, Typography } from '@mui/material'
import type { LoginResponse, TransactionListRow } from './types/transaction'

/**
 * TEMPORARY smoke screen. It exists only to prove the service worker is
 * intercepting requests in the browser. The auth shell replaces it next.
 */
export default function App() {
  const [log, setLog] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const say = (line: string) => setLog((prev) => [...prev, line])

  async function runSmokeCheck() {
    setBusy(true)
    setError(null)
    setLog([])
    try {
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'selam', password: 'tally' }),
      })
      if (!loginRes.ok) throw new Error(`login failed: ${loginRes.status}`)
      const { token, user } = (await loginRes.json()) as LoginResponse
      say(`login ok — ${user.name} (${user.id})`)

      const listRes = await fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!listRes.ok) throw new Error(`list failed: ${listRes.status}`)
      const rows = (await listRes.json()) as TransactionListRow[]
      say(`GET /api/transactions — ${rows.length} rows`)
      say(`items stripped from list rows: ${rows.every((r) => !('items' in r))}`)

      const detailRes = await fetch('/api/transactions/txn_FIXED_EDGE', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const detail = await detailRes.json()
      say(`detail txn_FIXED_EDGE — ${detail.items.length} line items, ${detail.amount} ETB`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" component="h1" gutterBottom>
            Tally console — setup check
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Confirms the MSW worker is intercepting requests in the browser.
          </Typography>
        </Box>

        <Button variant="contained" onClick={runSmokeCheck} disabled={busy}>
          {busy ? 'Running…' : 'Run smoke check'}
        </Button>

        {error && <Alert severity="error">{error}</Alert>}

        {log.length > 0 && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1}>
              {log.map((line) => (
                <Typography key={line} variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {line}
                </Typography>
              ))}
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  )
}
