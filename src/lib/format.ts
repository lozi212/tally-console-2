const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'ETB',
  currencyDisplay: 'code',
})

const absoluteDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const fullDate = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'full',
  timeStyle: 'short',
})

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** 1250 → "ETB 1,250.00". The mock only ever returns ETB. */
export function formatMoney(amount: number): string {
  // Intl separates the code and the number with a non-breaking space; a plain
  // space copies and compares more predictably.
  return money.format(amount).replace(/\u00a0/g, ' ')
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * Relative ("3 days ago") within 7 days either side of now, absolute
 * ("15 Jan 2026") beyond that. `now` is injectable so tests are not
 * time-dependent.
 */
export function formatDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  const diff = date.getTime() - now.getTime()
  const absDiff = Math.abs(diff)
  if (absDiff >= 7 * DAY) return absoluteDate.format(date)

  if (absDiff < MINUTE) return 'just now'
  if (absDiff < HOUR) return relative.format(Math.round(diff / MINUTE), 'minute')
  if (absDiff < DAY) return relative.format(Math.round(diff / HOUR), 'hour')
  return relative.format(Math.round(diff / DAY), 'day')
}

/** Tooltip text: the exact timestamp behind a relative date. */
export function formatFullDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : fullDate.format(date)
}

/** "partially_refunded" → "Partially refunded" */
export function humanise(value: string): string {
  const words = value.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
