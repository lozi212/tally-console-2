import { describe, expect, it } from 'vitest'
import type { LoginResponse, Transaction, TransactionListRow } from '../types/transaction'

const BASE = 'http://localhost'

async function login(password = 'tally') {
  const res = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'selam', password }),
  })
  return res
}

async function authHeader() {
  const res = await login()
  const { token } = (await res.json()) as LoginResponse
  return { Authorization: `Bearer ${token}` }
}

describe('mock API contract', () => {
  it('rejects a bad password with 401', async () => {
    const res = await login('wrong')
    expect(res.status).toBe(401)
    expect((await res.json()).message).toBeTruthy()
  })

  it('issues a token for any username with password "tally"', async () => {
    const res = await login()
    expect(res.status).toBe(200)
    const body = (await res.json()) as LoginResponse
    expect(body.token).toMatch(/^tok_/)
    expect(body.user).toEqual({ id: 'usr_selam', name: 'Selam' })
  })

  it('refuses unauthenticated access to the list', async () => {
    const res = await fetch(`${BASE}/api/transactions`)
    expect(res.status).toBe(401)
  })

  it('returns 5,000 rows without line items', async () => {
    const res = await fetch(`${BASE}/api/transactions`, { headers: await authHeader() })
    expect(res.status).toBe(200)
    const rows = (await res.json()) as TransactionListRow[]
    expect(rows).toHaveLength(5000)
    expect(rows.every((r) => !('items' in r))).toBe(true)
    expect(rows.map((r) => r.id)).toContain('txn_FIXED_EDGE')
  })

  it('returns line items on the detail endpoint', async () => {
    const res = await fetch(`${BASE}/api/transactions/txn_FIXED_EDGE`, {
      headers: await authHeader(),
    })
    const txn = (await res.json()) as Transaction
    expect(txn.items).toHaveLength(12)
    expect(txn.amount).toBe(999999.99)
  })

  it('404s an unknown id', async () => {
    const res = await fetch(`${BASE}/api/transactions/txn_NOPE`, { headers: await authHeader() })
    expect(res.status).toBe(404)
  })
})

describe('refund rules', () => {
  it('refunds the remaining balance and flips status to refunded', async () => {
    const headers = { ...(await authHeader()), 'Content-Type': 'application/json' }
    const res = await fetch(`${BASE}/api/transactions/txn_FIXED_PARTIAL/refund`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: 2000, reason: 'customer request' }),
    })
    expect(res.status).toBe(200)
    const txn = (await res.json()) as Transaction
    expect(txn.refundedAmount).toBe(3000)
    expect(txn.status).toBe('refunded')
  })

  it('rejects an amount above the refundable balance', async () => {
    const headers = { ...(await authHeader()), 'Content-Type': 'application/json' }
    const res = await fetch(`${BASE}/api/transactions/txn_FIXED_PARTIAL/refund`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: 2000.01, reason: 'too much' }),
    })
    expect(res.status).toBe(400)
    expect((await res.json()).message).toContain('2000.00')
  })

  it('rejects refunds against pending and failed transactions', async () => {
    const headers = { ...(await authHeader()), 'Content-Type': 'application/json' }
    for (const id of ['txn_FIXED_PENDING', 'txn_FIXED_FAILED', 'txn_FIXED_REFUNDED']) {
      const res = await fetch(`${BASE}/api/transactions/${id}/refund`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount: 1, reason: 'should fail' }),
      })
      expect(res.status, id).toBe(400)
    }
  })

  it('requires a non-empty reason', async () => {
    const headers = { ...(await authHeader()), 'Content-Type': 'application/json' }
    const res = await fetch(`${BASE}/api/transactions/txn_FIXED_SUCCEEDED/refund`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: 10, reason: '   ' }),
    })
    expect(res.status).toBe(400)
  })

  it('resetDb rolls mutations back between tests', async () => {
    const res = await fetch(`${BASE}/api/transactions/txn_FIXED_PARTIAL`, {
      headers: await authHeader(),
    })
    const txn = (await res.json()) as Transaction
    expect(txn.refundedAmount).toBe(1000)
    expect(txn.status).toBe('partially_refunded')
  })
})
