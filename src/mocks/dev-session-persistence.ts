import { db } from './handlers'
import type { User } from '../types/transaction'

const STORAGE_KEY = 'tally.mock-sessions'

/**
 * Development only. The supplied mock keeps its sessions in an in-memory Map,
 * so every page load — a reload, or one of Vite's hot reloads — starts with no
 * sessions at all. The token in localStorage is then rejected, and the first
 * request afterwards logs the user out, which makes the app look broken while
 * it is only the mock forgetting.
 *
 * This copies the sessions into sessionStorage and puts them back on the next
 * load. The supplied mock is not modified: `db.sessions` is a plain Map, and
 * this only writes to it and wraps its `set`.
 */
export function keepMockSessionsAcrossReloads() {
  restore()

  const set = db.sessions.set.bind(db.sessions)
  db.sessions.set = (token: string, user: User) => {
    const result = set(token, user)
    save()
    return result
  }

  const remove = db.sessions.delete.bind(db.sessions)
  db.sessions.delete = (token: string) => {
    const result = remove(token)
    save()
    return result
  }
}

function restore() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return
    for (const [token, user] of JSON.parse(raw) as [string, User][]) {
      db.sessions.set(token, user)
    }
  } catch {
    // A malformed value just means starting logged out.
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

function save() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...db.sessions.entries()]))
  } catch {
    // Storage unavailable: sessions simply will not survive the next reload.
  }
}
