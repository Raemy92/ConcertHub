import { describe, expect, it } from 'vitest'

import {
  colorForUserId,
  USER_COLOR_FALLBACK,
  USER_COLOR_PALETTE
} from './user-color'

describe('colorForUserId', () => {
  it('returns the same color for the same uid across calls', () => {
    const uid = 'abc123'
    expect(colorForUserId(uid)).toBe(colorForUserId(uid))
  })

  it('returns the fallback for empty input', () => {
    expect(colorForUserId('')).toBe(USER_COLOR_FALLBACK)
  })

  it('returns the fallback for undefined input', () => {
    expect(colorForUserId(undefined)).toBe(USER_COLOR_FALLBACK)
  })

  it('returns the fallback for null input', () => {
    expect(colorForUserId(null)).toBe(USER_COLOR_FALLBACK)
  })

  it('always returns a value from the palette for non-empty input', () => {
    const samples = [
      'user-1',
      'user-2',
      'user-3',
      'a',
      'abcdef',
      'zXyW123',
      '0000',
      'übrigens',
      '🎸'
    ]
    for (const uid of samples) {
      expect(USER_COLOR_PALETTE).toContain(colorForUserId(uid))
    }
  })

  it('spreads a range of uids across more than one palette entry', () => {
    const colors = new Set<string>()
    for (let i = 0; i < 50; i++) {
      colors.add(colorForUserId(`user-${i}`))
    }
    expect(colors.size).toBeGreaterThan(1)
  })
})
