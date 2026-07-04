import { Concert } from '@/entities/concert'

export interface BestMonth {
  monthIndex: number
  count: number
  label: string
}

/**
 * The month with the most attended concerts. Ties resolve to the later month.
 * `label` is the locale-aware full month name. Returns null on empty input.
 */
export const bestMonth = (
  attendedConcerts: Concert[],
  locale: string
): BestMonth | null => {
  if (attendedConcerts.length === 0) return null

  const counts = new Array<number>(12).fill(0)
  for (const concert of attendedConcerts) {
    const month = new Date(concert.date).getMonth()
    if (!Number.isNaN(month)) counts[month] += 1
  }

  // Iterating ascending with >= keeps the latest month on a tie.
  let monthIndex = 0
  let count = -1
  for (let i = 0; i < 12; i++) {
    if (counts[i] >= count) {
      count = counts[i]
      monthIndex = i
    }
  }

  const label = new Intl.DateTimeFormat(locale, { month: 'long' }).format(
    new Date(2000, monthIndex, 1)
  )
  return { monthIndex, count, label }
}
