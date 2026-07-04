import { Concert } from '@/entities/concert'
import { Participation } from '@/entities/participation'

/**
 * Parse a concert date string into its local-time calendar year.
 * Returns null when the string is missing or cannot be parsed.
 */
export const parseConcertYear = (
  dateString: string | undefined | null
): number | null => {
  if (!dateString) return null
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return null
  return d.getFullYear()
}

/** True when the viewer has a participation document for this concert. */
export const isAttended = (
  concert: Concert,
  participations: Participation[],
  viewerUid: string
): boolean =>
  participations.some(
    (p) => p.concertId === concert.id && p.userId === viewerUid
  )

/** True when the concert's local-time year matches the given year. */
export const isInYear = (concert: Concert, year: number): boolean =>
  parseConcertYear(concert.date) === year

/**
 * True when the concert's local date is strictly earlier than today's local
 * date. Malformed / missing dates are treated as not-in-the-past.
 */
export const isInPast = (concert: Concert): boolean => {
  const d = new Date(concert.date)
  if (Number.isNaN(d.getTime())) return false
  const concertDay = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  ).getTime()
  const now = new Date()
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime()
  return concertDay < today
}

/**
 * The concerts the viewer actually attended in the given year: has a
 * participation, dated within the year, and strictly in the past.
 */
export const attendedInYear = (
  concerts: Concert[],
  participations: Participation[],
  viewerUid: string,
  year: number
): Concert[] =>
  concerts.filter(
    (c) =>
      isInYear(c, year) &&
      isInPast(c) &&
      isAttended(c, participations, viewerUid)
  )

/**
 * Years to offer in the selector: every year the viewer has any participation
 * in (past or future), plus the current year unconditionally, descending.
 */
export const availableYears = (
  concerts: Concert[],
  participations: Participation[],
  viewerUid: string
): number[] => {
  const viewerConcertIds = new Set(
    participations.filter((p) => p.userId === viewerUid).map((p) => p.concertId)
  )
  const years = new Set<number>()
  for (const concert of concerts) {
    if (!viewerConcertIds.has(concert.id)) continue
    const year = parseConcertYear(concert.date)
    if (year !== null) years.add(year)
  }
  years.add(new Date().getFullYear())
  return Array.from(years).sort((a, b) => b - a)
}
