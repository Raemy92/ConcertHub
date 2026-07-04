import { YearStats } from '@/shared/lib/year-stats'

import { BestMonthTile } from './best-month-tile.ui'
import { CarpoolBalanceTile } from './carpool-balance-tile.ui'
import { FirstLastShowTile } from './first-last-show-tile.ui'
import { NewLocationsTile } from './new-locations-tile.ui'
import { TopBuddiesTile } from './top-buddies-tile.ui'
import { TopGenreTile } from './top-genre-tile.ui'
import { TotalConcertsTile } from './total-concerts-tile.ui'

interface YearStatisticsProps {
  stats: YearStats
}

export const YearStatistics = ({ stats }: YearStatisticsProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
    <TotalConcertsTile total={stats.total} />
    <BestMonthTile bestMonth={stats.bestMonth} />
    <TopBuddiesTile buddies={stats.topBuddies} />
    <TopGenreTile topGenre={stats.topGenre} />
    <CarpoolBalanceTile carpool={stats.carpool} />
    <NewLocationsTile count={stats.distinctLocations} />
    <div className="sm:col-span-2">
      <FirstLastShowTile firstAndLast={stats.firstAndLast} />
    </div>
  </div>
)
