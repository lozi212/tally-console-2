import { describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { db, resetDb } from '../mocks/handlers'
import { TOKEN_STORAGE_KEY } from '../auth/authContext'

async function signIn() {
  await userEvent.type(await screen.findByLabelText(/username/i), 'selam')
  await userEvent.type(screen.getByLabelText(/password/i), 'tally')
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
}

async function rowsLoaded() {
  const table = await screen.findByRole('table')
  await waitFor(() => expect(within(table).getAllByText(/^ETB /).length).toBeGreaterThan(0), {
    timeout: 5000,
  })
}

describe('when the mock forgets its sessions', () => {
  it('signs the user back in instead of interrupting them', async () => {
    window.history.replaceState(null, '', '/transactions')
    render(<App />)
    await signIn()
    await rowsLoaded()
    const firstToken = window.localStorage.getItem(TOKEN_STORAGE_KEY)

    // Exactly what a reload or a hot reload does to the mock.
    db.sessions.clear()

    // Any request now 401s. The user should not notice.
    await userEvent.click(screen.getAllByRole('row')[1])
    expect(await screen.findByRole('heading', { name: 'INV-00001' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /sign in/i })).not.toBeInTheDocument()

    // A new session was issued, and the stored token points at it.
    const secondToken = window.localStorage.getItem(TOKEN_STORAGE_KEY)
    expect(secondToken).not.toBe(firstToken)
    expect(db.sessions.has(JSON.parse(secondToken!) as string)).toBe(true)
  })

  it('still shows the login page when there is nothing to recover', async () => {
    resetDb()
    window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify('tok_expired'))
    window.history.replaceState(null, '', '/transactions')
    render(<App />)

    // No remembered username, so no recovery: the token is dropped.
    expect(await screen.findByRole('heading', { name: /sign in to tally/i })).toBeInTheDocument()
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('does not recover after the user logs out', async () => {
    window.history.replaceState(null, '', '/transactions')
    render(<App />)
    await signIn()
    await rowsLoaded()

    await userEvent.click(screen.getByRole('button', { name: /log out/i }))
    expect(await screen.findByRole('heading', { name: /sign in to tally/i })).toBeInTheDocument()

    // Still signed out a moment later: logging out must stick.
    await new Promise((r) => setTimeout(r, 300))
    expect(screen.getByRole('heading', { name: /sign in to tally/i })).toBeInTheDocument()
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })
})
