import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Concert } from '@/entities/concert'
import { Participation } from '@/entities/participation'

import { bestMonth } from './best-month'
import { carpoolBalance } from './carpool-balance'
import { firstAndLastShow } from './first-and-last-show'
import { distinctLocations } from './new-locations'
import { topBuddies } from './top-buddies'
import { topGenre } from './top-genre'
import { totalConcerts } from './total-concerts'
import { computeYearStats } from './year-stats'

const concert = (over: Partial<Concert>): Concert => ({
  id: over.id ?? 'c1',
  band: over.band ?? 'Band',
  openingBands: [],
  genres: over.genres ?? [],
  location: over.location ?? 'Venue',
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

describe('totalConcerts', () => {
  it('counts attended concerts', () => {
    expect(totalConcerts([])).toBe(0)
    expect(totalConcerts([concert({}), concert({ id: 'c2' })])).toBe(2)
  })
})

describe('bestMonth', () => {
  it('returns null on empty input', () => {
    expect(bestMonth([], 'de-CH')).toBeNull()
  })
  it('picks the peak month', () => {
    const attended = [
      concert({ id: '1', date: '2026-03-01' }),
      concert({ id: '2', date: '2026-03-15' }),
      concert({ id: '3', date: '2026-03-20' }),
      concert({ id: '4', date: '2026-05-01' }),
      concert({ id: '5', date: '2026-10-01' })
    ]
    const result = bestMonth(attended, 'de-CH')
    expect(result?.monthIndex).toBe(2)
    expect(result?.count).toBe(3)
    expect(result?.label.toLowerCase()).toContain('märz')
  })
  it('breaks ties toward the later month', () => {
    const attended = [
      concert({ id: '1', date: '2026-02-01' }),
      concert({ id: '2', date: '2026-02-10' }),
      concert({ id: '3', date: '2026-08-01' }),
      concert({ id: '4', date: '2026-08-10' })
    ]
    expect(bestMonth(attended, 'de-CH')?.monthIndex).toBe(7)
  })
})

describe('topBuddies', () => {
  it('returns [] on empty input', () => {
    expect(topBuddies([], [], 'viewer')).toEqual([])
  })
  it('ranks by shared-concert count and caps at three', () => {
    const attended = [1, 2, 3, 4, 5, 6].map((n) =>
      concert({ id: `c${n}`, date: `2026-01-0${n}` })
    )
    const parts: Participation[] = []
    attended.forEach((c) =>
      parts.push(part({ concertId: c.id, userId: 'viewer' }))
    )
    // A shares 6, B shares 4, C shares 3, D shares 1
    attended.forEach((c) =>
      parts.push(part({ concertId: c.id, userId: 'A', displayName: 'Ann' }))
    )
    ;['c1', 'c2', 'c3', 'c4'].forEach((id) =>
      parts.push(part({ concertId: id, userId: 'B', displayName: 'Bea' }))
    )
    ;['c1', 'c2', 'c3'].forEach((id) =>
      parts.push(part({ concertId: id, userId: 'C', displayName: 'Cyril' }))
    )
    parts.push(part({ concertId: 'c1', userId: 'D', displayName: 'Deb' }))

    const result = topBuddies(attended, parts, 'viewer')
    expect(result.map((b) => b.uid)).toEqual(['A', 'B', 'C'])
    expect(result[0].count).toBe(6)
  })
  it('excludes the viewer and breaks ties by later date then name', () => {
    const attended = [
      concert({ id: 'c1', date: '2026-01-01' }),
      concert({ id: 'c2', date: '2026-02-01' })
    ]
    const parts = [
      part({ concertId: 'c1', userId: 'viewer' }),
      part({ concertId: 'c2', userId: 'viewer' }),
      // X: one share on the later date; Y: one share on the earlier date
      part({ concertId: 'c2', userId: 'X', displayName: 'Xena' }),
      part({ concertId: 'c1', userId: 'Y', displayName: 'Yann' })
    ]
    const result = topBuddies(attended, parts, 'viewer')
    expect(result.map((b) => b.uid)).toEqual(['X', 'Y'])
    expect(result.find((b) => b.uid === 'viewer')).toBeUndefined()
  })
})

describe('topGenre', () => {
  it('returns null when empty or genreless', () => {
    expect(topGenre([])).toBeNull()
    expect(topGenre([concert({ genres: [] })])).toBeNull()
  })
  it('counts each genre once per concert and breaks ties alphabetically', () => {
    const attended = [
      concert({ id: '1', genres: ['Rock', 'Indie'] }),
      concert({ id: '2', genres: ['Rock'] }),
      concert({ id: '3', genres: ['Indie'] })
    ]
    // Rock: 2, Indie: 2 -> tie -> alphabetical "Indie"
    expect(topGenre(attended)).toEqual({ genre: 'Indie', count: 2 })
  })
})

describe('carpoolBalance', () => {
  it('is all zeros without involvement', () => {
    const attended = [concert({ id: 'c1' })]
    const parts = [part({ concertId: 'c1', userId: 'viewer' })]
    expect(carpoolBalance(attended, parts, 'viewer')).toEqual({
      drove: 0,
      rode: 0,
      seatsOffered: 0
    })
  })
  it('sums drove, rode, and offered seats independently', () => {
    const attended = ['c1', 'c2', 'c3', 'c4', 'c5'].map((id) => concert({ id }))
    const parts = [
      part({
        concertId: 'c1',
        userId: 'viewer',
        isDriver: true,
        availableSeats: 3
      }),
      part({
        concertId: 'c2',
        userId: 'viewer',
        isDriver: true,
        availableSeats: 2
      }),
      part({
        concertId: 'c3',
        userId: 'viewer',
        isDriver: true,
        availableSeats: 4
      }),
      part({ concertId: 'c4', userId: 'viewer', driverId: 'someone' }),
      part({ concertId: 'c5', userId: 'viewer', driverId: 'someone' })
    ]
    expect(carpoolBalance(attended, parts, 'viewer')).toEqual({
      drove: 3,
      rode: 2,
      seatsOffered: 9
    })
  })
})

describe('distinctLocations', () => {
  it('counts distinct trimmed locations', () => {
    const attended = ['Bierhübeli', 'Reitschule', 'Bierhübeli ', 'Kaserne'].map(
      (location, i) => concert({ id: `c${i}`, location })
    )
    expect(distinctLocations(attended)).toBe(3)
  })
})

describe('firstAndLastShow', () => {
  it('returns nulls on empty input', () => {
    expect(firstAndLastShow([])).toEqual({ first: null, last: null })
  })
  it('returns the same concert for a single attendance', () => {
    const c = concert({ id: 'only', date: '2026-04-01' })
    const result = firstAndLastShow([c])
    expect(result.first?.id).toBe('only')
    expect(result.last?.id).toBe('only')
  })
  it('picks earliest and latest by date', () => {
    const attended = [
      concert({ id: 'mid', date: '2026-05-01' }),
      concert({ id: 'early', date: '2026-01-01' }),
      concert({ id: 'late', date: '2026-11-01' })
    ]
    const result = firstAndLastShow(attended)
    expect(result.first?.id).toBe('early')
    expect(result.last?.id).toBe('late')
  })
})

describe('computeYearStats', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 4))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('composes every stat over the scoped attended set', () => {
    const concerts = [
      concert({
        id: 'c1',
        date: '2026-01-10',
        genres: ['Rock'],
        location: 'A'
      }),
      concert({
        id: 'c2',
        date: '2026-02-10',
        genres: ['Rock'],
        location: 'B'
      }),
      concert({
        id: 'future',
        date: '2026-12-10',
        genres: ['Pop'],
        location: 'C'
      })
    ]
    const parts = [
      part({
        concertId: 'c1',
        userId: 'viewer',
        isDriver: true,
        availableSeats: 3
      }),
      part({ concertId: 'c2', userId: 'viewer', driverId: 'bea' }),
      part({ concertId: 'future', userId: 'viewer' }),
      part({ concertId: 'c1', userId: 'bea', displayName: 'Bea' }),
      part({ concertId: 'c2', userId: 'bea', displayName: 'Bea' })
    ]
    const stats = computeYearStats(concerts, parts, 'viewer', 2026)
    expect(stats.total).toBe(2)
    expect(stats.topGenre).toEqual({ genre: 'Rock', count: 2 })
    expect(stats.topBuddies).toHaveLength(1)
    expect(stats.topBuddies[0]).toMatchObject({ uid: 'bea', count: 2 })
    expect(stats.carpool).toEqual({ drove: 1, rode: 1, seatsOffered: 3 })
    expect(stats.distinctLocations).toBe(2)
    expect(stats.firstAndLast.first?.id).toBe('c1')
    expect(stats.firstAndLast.last?.id).toBe('c2')
  })
})
