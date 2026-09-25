import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { apiFetch } from '../lib/api'
import { server } from '../mocks/server'
import { TOKEN_STORAGE_KEY } from '../auth/authContext'
import { THEME_STORAGE_KEY } from '../theme-mode'
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

async function rowsLoaded() {
  const table = await screen.findByRole('table')
  await waitFor(() => expect(within(table).getAllByText(/^ETB /).length).toBeGreaterThan(0), {
    timeout: 5000,
  })
  return within(table).getAllByRole('row')
}

describe('theme', () => {
  beforeEach(() => window.localStorage.clear())

  it('switches between light and dark and remembers the choice', async () => {
    const { unmount } = await signedIn()
    await screen.findByRole('button', { name: /log out/i })

    await userEvent.click(screen.getByRole('button', { name: /switch to dark theme/i }))
    expect(
      await screen.findByRole('button', { name: /switch to light theme/i }),
    ).toBeInTheDocument()
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('"dark"')

    // Still dark after a "reload".
    unmount()
    render(<App />)
    expect(
      await screen.findByRole('button', { name: /switch to light theme/i }),
    ).toBeInTheDocument()
  })
})

describe('prefetching', () => {
  beforeEach(() => window.localStorage.clear())

  it('loads a transaction when the pointer rests on its row', async () => {
    await signedIn('/transactions?q=INV-00001')
    const rows = await rowsLoaded()

    const requested: string[] = []
    server.events.on('request:start', ({ request }) => {
      requested.push(new URL(request.url).pathname)
    })

    await userEvent.hover(rows[1])
    await waitFor(() => expect(requested).toContain('/api/transactions/txn_FIXED_SUCCEEDED'))
  })
})

describe('no console noise', () => {
  beforeEach(() => window.localStorage.clear())

  it('logs no errors or warnings through a refund', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await signedIn('/transactions/txn_FIXED_PARTIAL')
    await screen.findByRole('heading', { name: 'INV-00002' })
    await userEvent.click(screen.getByRole('button', { name: 'Refund' }))

    const dialog = await screen.findByRole('dialog')
    // The dialog takes focus, which is what a keyboard user needs.
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))

    await userEvent.type(within(dialog).getByLabelText(/reason/i), 'goods returned')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Refund' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    expect(error).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
    error.mockRestore()
    warn.mockRestore()
  })

  it('closes the refund dialog on Escape and returns focus to the page', async () => {
    await signedIn('/transactions/txn_FIXED_PARTIAL')
    await screen.findByRole('heading', { name: 'INV-00002' })
    await userEvent.click(screen.getByRole('button', { name: 'Refund' }))
    await screen.findByRole('dialog')

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Refund' })).toHaveFocus()
  })
})
