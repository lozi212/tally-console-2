import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../auth/AuthProvider'
import { useAuth, type AuthContextValue } from '../auth/authContext'

/**
 * The brief asks for this by name: "Context value must not change identity on
 * unrelated renders." A value rebuilt on every render re-renders every
 * consumer, however unrelated the cause.
 */
describe('the auth context value', () => {
  it('stays the same object when something unrelated re-renders', async () => {
    const seen: AuthContextValue[] = []

    function Consumer() {
      seen.push(useAuth())
      return null
    }

    function Harness() {
      const [tick, setTick] = useState(0)
      // One client for the life of the harness: a new one each render would
      // change the provider's own value and prove nothing.
      const [client] = useState(() => new QueryClient())
      return (
        <QueryClientProvider client={client}>
          <AuthProvider>
            <button onClick={() => setTick((value) => value + 1)}>re-render {tick}</button>
            <Consumer />
          </AuthProvider>
        </QueryClientProvider>
      )
    }

    render(<Harness />)
    const button = screen.getByRole('button')
    await userEvent.click(button)
    await userEvent.click(button)
    await userEvent.click(button)

    expect(seen.length).toBeGreaterThan(1)
    // Every render handed the consumer the very same object.
    expect(new Set(seen).size).toBe(1)
  })

  it('changes only when the session itself changes', async () => {
    const seen: AuthContextValue[] = []

    function Consumer() {
      const value = useAuth()
      seen.push(value)
      return <button onClick={() => void value.login('selam', 'tally')}>sign in</button>
    }

    const client = new QueryClient()
    render(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </QueryClientProvider>,
    )

    const before = new Set(seen).size
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await screen.findByRole('button', { name: /sign in/i })

    // Signing in is exactly the kind of change that should reach consumers.
    await expect.poll(() => new Set(seen).size, { timeout: 5000 }).toBeGreaterThan(before)
  })
})
