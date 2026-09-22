import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useLocalStorageState } from './useLocalStorageState'

describe('useLocalStorageState', () => {
  it('uses the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorageState('k', 'initial'))
    expect(result.current[0]).toBe('initial')
  })

  it('reads an existing stored value', () => {
    window.localStorage.setItem('k', JSON.stringify({ a: 1 }))
    const { result } = renderHook(() => useLocalStorageState('k', { a: 0 }))
    expect(result.current[0]).toEqual({ a: 1 })
  })

  it('persists updates, including functional ones', () => {
    const { result } = renderHook(() => useLocalStorageState('n', 1))
    act(() => result.current[1]((n) => n + 1))
    expect(result.current[0]).toBe(2)
    expect(window.localStorage.getItem('n')).toBe('2')
  })

  it('removes the key when set to null', () => {
    window.localStorage.setItem('t', JSON.stringify('abc'))
    const { result } = renderHook(() => useLocalStorageState<string | null>('t', null))
    act(() => result.current[1](null))
    expect(window.localStorage.getItem('t')).toBeNull()
  })

  it('falls back to the initial value when the stored value is not valid JSON', () => {
    window.localStorage.setItem('k', '{not json')
    const { result } = renderHook(() => useLocalStorageState('k', 'fallback'))
    expect(result.current[0]).toBe('fallback')
  })

  it('keeps the setter identity stable across renders', () => {
    const { result, rerender } = renderHook(() => useLocalStorageState('k', 0))
    const first = result.current[1]
    act(() => first(5))
    rerender()
    expect(result.current[1]).toBe(first)
  })

  it('picks up changes made in another tab', () => {
    const { result } = renderHook(() => useLocalStorageState('k', 'a'))
    act(() => {
      window.localStorage.setItem('k', JSON.stringify('b'))
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'k',
          newValue: JSON.stringify('b'),
          storageArea: window.localStorage,
        }),
      )
    })
    expect(result.current[0]).toBe('b')
  })
})
