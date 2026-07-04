import { Concert } from '@/entities/concert'
import { Participation } from '@/entities/participation'

import { BestMonth, bestMonth } from './best-month'
import { CarpoolBalance, carpoolBalance } from './carpool-balance'
import { FirstAndLastShow, firstAndLastShow } from './first-and-last-show'
import { attendedInYear } from './helpers'
import { distinctLocations } from './new-locations'
import { Buddy, topBuddies } from './top-buddies'
import { TopGenre, topGenre } from './top-genre'
import { totalConcerts } from './total-concerts'

/** Default UI locale for month labels — matches the rest of the app. */
export const STATS_LOCALE = 'de-CH'

export interface YearStats {
  year: number
  total: number
  bestMonth: BestMonth | null
  topBuddies: Buddy[]
  topGenre: TopGenre | null
  carpool: CarpoolBalance
  distinctLocations: number
  firstAndLast: FirstAndLastShow
}

/**
 * Compute the full set of yearly statistics from the raw collections. `concerts`
 * and `participations` are the whole (unfiltered) collections; year/past
 * scoping and co-attendance are resolved here client-side.
 */
export const computeYearStats = (
  concerts: Concert[],
  participations: Participation[],
  viewerUid: string,
  year: number,
  locale: string = STATS_LOCALE
): YearStats => {
  const attended = attendedInYear(concerts, participations, viewerUid, year)
  return {
    year,
    total: totalConcerts(attended),
    bestMonth: bestMonth(attended, locale),
    topBuddies: topBuddies(attended, participations, viewerUid),
    topGenre: topGenre(attended),
    carpool: carpoolBalance(attended, participations, viewerUid),
    distinctLocations: distinctLocations(attended),
    firstAndLast: firstAndLastShow(attended)
  }
}
