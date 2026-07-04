import { Concert } from '@/entities/concert'

/**
 * Count of distinct concert locations across attended concerts. Comparison is
 * case-sensitive but trims surrounding whitespace; empty locations are ignored.
 */
export const distinctLocations = (attendedConcerts: Concert[]): number => {
  const locations = new Set<string>()
  for (const concert of attendedConcerts) {
    const location = concert.location?.trim()
    if (location) locations.add(location)
  }
  return locations.size
}
