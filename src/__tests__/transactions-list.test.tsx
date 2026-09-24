import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import App from '../App'
import { apiFetch } from '../lib/api'
import { server } from '../mocks/server'
import { TOKEN_STORAGE_KEY } from '../auth/authContext'
import type { LoginResponse } from '../types/transaction'

async function signedIn(path = '/transactions') {
  const { token } = await apiFetch<LoginResponse>('/api/login', {
    method: 'POST',
    body: { username: 'selam', password: 'tally' },
  })
  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token))
  window.history.replaceState(null, '', path)
  return render(<App />)
}

/** Waits past the loading skeletons until real rows (with amounts) are on screen. */
async function rowsLoaded() {
  const table = await screen.findByRole('table')
  await waitFor(() => expect(within(table).getAllByText(/^ETB /).length).toBeGreaterThan(0), {
    timeout: 5000,
  })
  return within(table).getAllByRole('row')
}

describe('transactions list', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('lists transactions with formatted amounts, status chips and dates', async () => {
    await signedIn('/transactions?q=INV-00001')
    await rowsLoaded()
    expect(screen.getByText('INV-00001')).toBeInTheDocument()
    expect(screen.getByText('Selam Tadesse')).toBeInTheDocument()
    expect(screen.getByText('ETB 1,250.00')).toBeInTheDocument()
    expect(screen.getByText('Succeeded')).toBeInTheDocument()
  })

  it('applies the search, status filter, sort and page from the URL', async () => {
    await signedIn('/transactions?status=refunded&sort=amount.asc&page=2&size=10')
    const rows = await rowsLoaded()
    // 1 header row + 10 data rows on the second page of a 10-per-page view.
    expect(rows).toHaveLength(11)
    // Every visible row is refunded, and the ascending sort is honoured.
    const amounts = rows
      .slice(1)
      // [0] is the amount; a refunded row also shows the refunded total.
      .map((row) => within(row).getAllByText(/^ETB /)[0].textContent)
      .map((text) => Number(text!.replace(/[^0-9.]/g, '')))
    expect([...amounts].sort((a, b) => a - b)).toEqual(amounts)
    expect(screen.getAllByText('Refunded').length).toBe(10)
  })

  it('puts a typed search into the URL and keeps it on reload', async () => {
    const { unmount } = await signedIn()
    await rowsLoaded()

    await userEvent.type(await screen.findByLabelText('Search transactions'), 'Dawit')
    await waitFor(() => expect(window.location.search).toContain('q=Dawit'))

    // "Reload": tear the app down and mount it again at the same URL.
    unmount()
    render(<App />)
    expect(await screen.findByText('INV-00002')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Dawit')).toBeInTheDocument()
  })

  it('restores the previous view when the back button is pressed', async () => {
    await signedIn('/transactions')
    await rowsLoaded()

    await userEvent.click(await screen.findByRole('button', { name: /next page/i }))
    await waitFor(() => expect(window.location.search).toContain('page=2'))

    window.history.back()
    await waitFor(() => expect(window.location.search).not.toContain('page=2'))
  })

  it('opens the detail page when a row is clicked', async () => {
    await signedIn('/transactions?q=INV-00001')
    const rows = await rowsLoaded()
    await userEvent.click(rows[1])
    await waitFor(() => expect(window.location.pathname).toBe('/transactions/txn_FIXED_SUCCEEDED'))
  })

  it('shows an error with a working Retry button', async () => {
    // The wildcard matches the absolute URL the app requests; a bare
    // '/api/transactions' would not.
    server.use(
      http.get('*/api/transactions', () =>
        HttpResponse.json({ message: 'Internal server error' }, { status: 500 }),
      ),
    )

    await signedIn()
    // retry: 1 means the failure is only surfaced after the automatic retry.
    expect(
      await screen.findByText(/could not load transactions/i, undefined, { timeout: 5000 }),
    ).toBeInTheDocument()

    // Drop the override so the real handler answers the retry.
    server.resetHandlers()
    await userEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect((await rowsLoaded()).length).toBeGreaterThan(1)
  })

  it('tells the user when nothing matches the current view', async () => {
    await signedIn('/transactions?q=zzzzzzzz')
    expect(await screen.findByText(/no transactions match this view/i)).toBeInTheDocument()
  })
})
