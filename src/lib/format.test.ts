import { describe, expect, it } from 'vitest'
import { formatDate, formatMoney, humanise } from './format'

const NOW = new Date('2026-09-22T12:00:00Z')

describe('formatMoney', () => {
  it('formats amounts in ETB', () => {
    expect(formatMoney(1250)).toBe('ETB 1,250.00')
    expect(formatMoney(0.5)).toBe('ETB 0.50')
  })
})

describe('formatDate', () => {
  it('uses relative wording inside 7 days', () => {
    expect(formatDate('2026-09-22T11:30:00Z', NOW)).toBe('30 minutes ago')
    expect(formatDate('2026-09-22T10:00:00Z', NOW)).toBe('2 hours ago')
    expect(formatDate('2026-09-21T12:00:00Z', NOW)).toBe('yesterday')
    expect(formatDate('2026-09-19T12:00:00Z', NOW)).toBe('3 days ago')
  })

  it('uses an absolute date from 7 days out', () => {
    expect(formatDate('2026-09-15T12:00:00Z', NOW)).toBe('15 Sept 2026')
    expect(formatDate('2026-01-15T10:30:00Z', NOW)).toBe('15 Jan 2026')
  })

  it('handles a bad value without throwing', () => {
    expect(formatDate('not-a-date', NOW)).toBe('—')
  })
})

describe('humanise', () => {
  it('turns a status into a label', () => {
    expect(humanise('partially_refunded')).toBe('Partially refunded')
    expect(humanise('card')).toBe('Card')
  })
})
