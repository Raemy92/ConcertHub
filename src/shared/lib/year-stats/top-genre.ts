import { Concert } from '@/entities/concert'

export interface TopGenre {
  genre: string
  count: number
}

/**
 * The most frequent genre across attended concerts; a concert with multiple
 * genres contributes one to each. Ties break alphabetically ascending. Returns
 * null on empty input or when no attended concert has any genre.
 */
export const topGenre = (attendedConcerts: Concert[]): TopGenre | null => {
  if (attendedConcerts.length === 0) return null

  const counts = new Map<string, number>()
  for (const concert of attendedConcerts) {
    for (const genre of concert.genres ?? []) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1)
    }
  }
  if (counts.size === 0) return null

  const [genre, count] = Array.from(counts.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]
    return a[0].localeCompare(b[0])
  })[0]
  return { genre, count }
}
