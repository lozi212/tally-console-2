import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { apiFetch } from '../lib/api'
import { TOKEN_STORAGE_KEY } from '../auth/authContext'
import type { LoginResponse } from '../types/transaction'

function renderAt(path: string) {
  window.history.replaceState(null, '', path)
  return render(<App />)
}

async function signIn(password = 'tally') {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText(/username/i), 'selam')
  await user.type(screen.getByLabelText(/password/i), password)
  await user.click(screen.getByRole('button', { name: /sign in/i }))
}

describe('authentication', () => {
  it('redirects a logged-out visitor to /login', async () => {
    renderAt('/transactions')
    expect(await screen.findByRole('heading', { name: /sign in to tally/i })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('shows required-field errors without calling the server', async () => {
    renderAt('/login')
    await userEvent.click(await screen.findByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Username is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })

  it('shows the server message for a wrong password', async () => {
    renderAt('/login')
    await signIn('wrong')
    expect(await screen.findByText('Invalid username or password')).toBeInTheDocument()
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('logs in, stores the token and returns to the page originally requested', async () => {
    renderAt('/transactions/txn_FIXED_PARTIAL')
    await signIn()
    expect(
      await screen.findByRole('heading', { name: 'Transaction txn_FIXED_PARTIAL' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Selam')).toBeInTheDocument()
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toMatch(/^"tok_/)
  })

  it('restores a valid stored session via /api/me and skips the login page', async () => {
    const { token } = await apiFetch<LoginResponse>('/api/login', {
      method: 'POST',
      body: { username: 'dawit', password: 'tally' },
    })
    window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token))

    renderAt('/login')
    // Full-page loader first, then straight into the app (/login bounces to /transactions).
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Transactions' })).toBeInTheDocument()
    expect(screen.getByText('Dawit')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/transactions')
  })

  it('drops a rejected stored token and shows the login page', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify('tok_expired'))
    renderAt('/transactions')
    expect(await screen.findByRole('heading', { name: /sign in to tally/i })).toBeInTheDocument()
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('logs out, clears the token and returns to /login', async () => {
    renderAt('/transactions')
    await signIn()
    await userEvent.click(await screen.findByRole('button', { name: /log out/i }))
    expect(await screen.findByRole('heading', { name: /sign in to tally/i })).toBeInTheDocument()
    await waitFor(() => expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull())
  })
})
