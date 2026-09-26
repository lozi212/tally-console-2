import { apiFetch } from '../lib/api'
import type { LoginResponse } from '../types/transaction'

export const USERNAME_STORAGE_KEY = 'tally.username'

/** The mock accepts any username with this password. */
const DEV_PASSWORD = 'tally'

/**
 * The mock derives a user's id from the username (`usr_selam`), so a session
 * that predates this code can still say who it belongs to.
 */
export function rememberUsernameFrom(user: { id: string }) {
  const username = user.id.startsWith('usr_') ? user.id.slice(4) : ''
  if (username) localStorage.setItem(USERNAME_STORAGE_KEY, JSON.stringify(username))
}

function rememberedUsername(): string | null {
  try {
    const raw = localStorage.getItem(USERNAME_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string) : null
  } catch {
    return null
  }
}

/**
 * Development only, and a workaround for the mock rather than app behaviour.
 *
 * The supplied mock keeps its sessions in memory, so anything that re-evaluates
 * its module — a reload, a hot reload, a second tab — leaves a stored token
 * with no session behind it. Every request then 401s and the user is thrown
 * back to the login page mid-task, which looks like a broken app.
 *
 * Rather than trusting the sessions to survive, this signs the same user back
 * in when a 401 arrives. It returns the new session or null, and the caller
 * decides what to do with it. In production it does nothing at all, so a real
 * 401 still logs the user out as it should.
 */
export async function recoverDevSession(): Promise<LoginResponse | null> {
  if (!import.meta.env.DEV) return null

  // Only recover a session we have seen belong to someone. A token that was
  // never valid here is not ours to revive: it must still reach the login
  // page, which is the behaviour the brief asks for.
  const username = rememberedUsername()
  if (!username) return null

  try {
    const session = await apiFetch<LoginResponse>('/api/login', {
      method: 'POST',
      body: { username, password: DEV_PASSWORD },
    })
    console.info(`[dev] The mock had forgotten this session, so ${username} was signed back in.`)
    return session
  } catch {
    return null
  }
}
