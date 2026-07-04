import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Concert } from '@/entities/concert'
import { Participation } from '@/entities/participation'

import {
  attendedInYear,
  availableYears,
  isAttended,
  isInPast,
  isInYear,
  parseConcertYear
} from './helpers'

const concert = (over: Partial<Concert>): Concert => ({
  id: over.id ?? 'c1',
  band: 'Band',
  openingBands: [],
  genres: [],
  location: 'Venue',
  date: over.date ?? '2026-03-10',
  startTime: '20:00',
  endTime: '23:00',
  doors: '19:00',
  price: 0,
  createdBy: 'u1',
  createdAt: 0,
  updatedAt: 0,
  isArchived: false,
  ...over
})

const part = (over: Partial<Participation>): Participation => ({
  userId: over.userId ?? 'viewer',
  isDriver: false,
  joinedAt: 0,
  ...over
})

describe('year-stats helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 4)) // 2026-07-04 local
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('parseConcertYear', () => {
    it('returns the local year for a valid date', () => {
      expect(parseConcertYear('2026-01-01')).toBe(2026)
      expect(parseConcertYear('2025-12-31')).toBe(2025)
    })
    it('returns null for missing or malformed dates', () => {
      expect(parseConcertYear(undefined)).toBeNull()
      expect(parseConcertYear('')).toBeNull()
      expect(parseConcertYear('not-a-date')).toBeNull()
    })
  })

  describe('isInPast', () => {
    it('counts a date earlier than today as past', () => {
      expect(isInPast(concert({ date: '2026-01-01' }))).toBe(true)
      expect(isInPast(concert({ date: '2025-12-31' }))).toBe(true)
    })
    it('does not count today or the future as past', () => {
      expect(isInPast(concert({ date: '2026-07-04' }))).toBe(false)
      expect(isInPast(concert({ date: '2026-12-31' }))).toBe(false)
    })
    it('treats a malformed date as not past instead of throwing', () => {
      expect(isInPast(concert({ date: 'nope' }))).toBe(false)
    })
  })

  describe('isInYear', () => {
    it('matches on the local year', () => {
      expect(isInYear(concert({ date: '2026-01-01' }), 2026)).toBe(true)
      expect(isInYear(concert({ date: '2025-12-31' }), 2026)).toBe(false)
    })
  })

  describe('isAttended', () => {
    it('is true only when a matching participation exists', () => {
      const c = concert({ id: 'c1' })
      const parts = [part({ concertId: 'c1', userId: 'viewer' })]
      expect(isAttended(c, parts, 'viewer')).toBe(true)
      expect(isAttended(c, parts, 'other')).toBe(false)
      expect(isAttended(concert({ id: 'c2' }), parts, 'viewer')).toBe(false)
    })
  })

  describe('attendedInYear', () => {
    it('keeps only past, in-year, attended concerts', () => {
      const concerts = [
        concert({ id: 'past', date: '2026-02-01' }),
        concert({ id: 'future', date: '2026-12-01' }),
        concert({ id: 'lastyear', date: '2025-05-01' }),
        concert({ id: 'notjoined', date: '2026-03-01' })
      ]
      const parts = [
        part({ concertId: 'past', userId: 'viewer' }),
        part({ concertId: 'future', userId: 'viewer' }),
        part({ concertId: 'lastyear', userId: 'viewer' })
      ]
      const result = attendedInYear(concerts, parts, 'viewer', 2026)
      expect(result.map((c) => c.id)).toEqual(['past'])
    })
  })

  describe('availableYears', () => {
    it('lists viewer years (any date) plus the current year, descending', () => {
      const concerts = [
        concert({ id: 'a', date: '2024-05-01' }),
        concert({ id: 'b', date: '2026-08-01' }), // future but still counts
        concert({ id: 'c', date: '2023-01-01' }) // not joined
      ]
      const parts = [
        part({ concertId: 'a', userId: 'viewer' }),
        part({ concertId: 'b', userId: 'viewer' })
      ]
      expect(availableYears(concerts, parts, 'viewer')).toEqual([2026, 2024])
    })
    it('returns just the current year for a brand-new viewer', () => {
      expect(availableYears([], [], 'viewer')).toEqual([2026])
    })
  })
})
