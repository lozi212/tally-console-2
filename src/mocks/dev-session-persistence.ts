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
 * This copies the sessions into localStorage and puts them back on the next
 * load. localStorage, not sessionStorage, because that is where the app keeps
 * the token: a session store that emptied when a tab closed would leave the
 * token behind with nothing to match it, and the next tab would be logged out.
 *
 * The supplied mock is not modified: `db.sessions` is a plain Map, and this
 * only writes to it and wraps its `set` and `delete`.
 */
export function keepMockSessionsAcrossReloads() {
  restore()

  // A hot reload can re-evaluate the mock's module, which builds a fresh empty
  // database. Without this the sessions vanish mid-session and the next
  // request logs the user out while they are working.
  import.meta.hot?.on('vite:afterUpdate', restore)

  // Another tab signing in writes to the same store; take its sessions too.
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) restore()
  })

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

  // Each tab runs its own copy of the mock, so a token minted in one tab is
  // unknown to the next. Looking the store up on a miss makes every tab accept
  // every tab's sessions; without it the tabs invalidate each other's tokens
  // in turn and the user is bounced to the login page again and again.
  const has = db.sessions.has.bind(db.sessions)
  db.sessions.has = (token: string) => (has(token) ? true : restore() && has(token))

  const get = db.sessions.get.bind(db.sessions)
  db.sessions.get = (token: string) => {
    if (!has(token)) restore()
    return get(token)
  }
}

/** Merges the stored sessions into this tab's copy. Returns true either way. */
function restore(): true {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      for (const [token, user] of JSON.parse(raw) as [string, User][]) {
        // Map.set directly: going through the wrapped has() would recurse.
        Map.prototype.set.call(db.sessions, token, user)
      }
    }
  } catch {
    // A malformed value just means starting logged out.
    localStorage.removeItem(STORAGE_KEY)
  }
  return true
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...db.sessions.entries()]))
  } catch {
    // Storage unavailable: sessions simply will not survive the next reload.
  }
}
