import { describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import App from '../App'
import { apiFetch } from '../lib/api'
import { server } from '../mocks/server'
import { TOKEN_STORAGE_KEY } from '../auth/authContext'
import type { LoginResponse } from '../types/transaction'

async function signedIn(path: string) {
  const { token } = await apiFetch<LoginResponse>('/api/login', {
    method: 'POST',
    body: { username: 'selam', password: 'tally' },
  })
  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token))
  window.history.replaceState(null, '', path)
  return render(<App />)
}

async function openRefundDialog() {
  await userEvent.click(await screen.findByRole('button', { name: 'Refund' }))
  return screen.findByRole('dialog')
}

describe('transaction detail', () => {
  it('shows the header, amounts and line items', async () => {
    await signedIn('/transactions/txn_FIXED_PARTIAL')

    expect(await screen.findByRole('heading', { name: 'INV-00002' })).toBeInTheDocument()
    expect(screen.getByText(/Dawit Bekele/)).toBeInTheDocument()
    expect(screen.getByText('Partially refunded')).toBeInTheDocument()

    // Gross 3,000, already refunded 1,000, so 2,000 is refundable.
    expect(screen.getByText('ETB 3,000.00')).toBeInTheDocument()
    expect(screen.getByText('ETB 1,000.00')).toBeInTheDocument()
    expect(screen.getByText('ETB 2,000.00')).toBeInTheDocument()

    expect(screen.getByText('Annual plan')).toBeInTheDocument()
    expect(screen.getByText('Setup fee')).toBeInTheDocument()
  })

  it('explains an unknown id instead of failing', async () => {
    await signedIn('/transactions/txn_NOPE')
    expect(
      await screen.findByRole('heading', { name: /transaction not found/i }),
    ).toBeInTheDocument()
  })

  it('offers a retry from the error boundary when the request fails', async () => {
    server.use(
      http.get('*/api/transactions/:id', () =>
        HttpResponse.json({ message: 'Internal server error' }, { status: 500 }),
      ),
    )
    await signedIn('/transactions/txn_FIXED_SUCCEEDED')

    expect(
      await screen.findByRole('heading', { name: /something went wrong/i }, { timeout: 5000 }),
    ).toBeInTheDocument()

    server.resetHandlers()
    await userEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(await screen.findByRole('heading', { name: 'INV-00001' })).toBeInTheDocument()
  })

  it('disables the refund button with a reason when a refund is impossible', async () => {
    await signedIn('/transactions/txn_FIXED_REFUNDED')
    const button = await screen.findByRole('button', { name: 'Refund' })
    expect(button).toBeDisabled()

    await userEvent.hover(button.parentElement!)
    expect(await screen.findByText(/already fully refunded/i)).toBeInTheDocument()
  })

  it('rejects an amount over the refundable balance and a short reason', async () => {
    await signedIn('/transactions/txn_FIXED_PARTIAL')
    await screen.findByRole('heading', { name: 'INV-00002' })
    const dialog = await openRefundDialog()

    const amount = within(dialog).getByLabelText(/amount/i)
    await userEvent.clear(amount)
    await userEvent.type(amount, '2500')
    await userEvent.type(within(dialog).getByLabelText(/reason/i), 'oops')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Refund' }))

    expect(
      await within(dialog).findByText(/cannot exceed the refundable balance/i),
    ).toBeInTheDocument()
    expect(within(dialog).getByText(/at least 5 characters/i)).toBeInTheDocument()
  })

  it('shows the server message when the refund is refused', async () => {
    server.use(
      http.post('*/api/transactions/:id/refund', () =>
        HttpResponse.json({ message: 'Refunds are closed for this merchant' }, { status: 400 }),
      ),
    )
    await signedIn('/transactions/txn_FIXED_PARTIAL')
    await screen.findByRole('heading', { name: 'INV-00002' })
    const dialog = await openRefundDialog()

    await userEvent.type(within(dialog).getByLabelText(/reason/i), 'duplicate charge')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Refund' }))

    expect(await within(dialog).findByText(/refunds are closed/i)).toBeInTheDocument()
  })

  it('refunds, confirms, and updates the list row without refetching it', async () => {
    // Load the list first so there is a cached row to update.
    await signedIn('/transactions?q=INV-00002')
    const table = await screen.findByRole('table')
    await waitFor(() => expect(within(table).getAllByText(/^ETB /).length).toBeGreaterThan(0), {
      timeout: 5000,
    })
    await userEvent.click(within(table).getAllByRole('row')[1])
    await screen.findByRole('heading', { name: 'INV-00002' })

    // From here on the list must not be requested again.
    let listRequests = 0
    server.events.on('request:start', ({ request }) => {
      if (new URL(request.url).pathname === '/api/transactions') listRequests += 1
    })

    const dialog = await openRefundDialog()
    await userEvent.type(within(dialog).getByLabelText(/reason/i), 'customer returned the goods')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Refund' }))

    // Dialog closes, snackbar confirms.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText(/refunded ETB 2,000.00 of INV-00002/i)).toBeInTheDocument()

    // The detail now reads as fully refunded. "Refunded" also labels an amount
    // card, so this checks the status chip specifically.
    await waitFor(() =>
      expect(document.querySelector('.MuiChip-label')).toHaveTextContent('Refunded'),
    )

    // Going back shows the patched row, with no new list request.
    await userEvent.click(screen.getByRole('button', { name: /back/i }))
    await screen.findByRole('table')
    // Re-queried each attempt: the table re-renders as the rows settle.
    await waitFor(() => {
      const row = within(screen.getByRole('table')).getAllByRole('row')[1]
      expect(within(row).getByText('Refunded')).toBeInTheDocument()
    })
    expect(listRequests).toBe(0)
  })
})
