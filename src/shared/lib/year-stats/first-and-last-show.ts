import { Concert } from '@/entities/concert'

export interface FirstAndLastShow {
  first: Concert | null
  last: Concert | null
}

/**
 * The earliest- and latest-by-date attended concerts. When exactly one concert
 * is attended, `first` and `last` are the same concert. Empty input yields nulls.
 */
export const firstAndLastShow = (
  attendedConcerts: Concert[]
): FirstAndLastShow => {
  if (attendedConcerts.length === 0) return { first: null, last: null }

  const sorted = [...attendedConcerts].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0
  )
  return { first: sorted[0], last: sorted[sorted.length - 1] }
}
