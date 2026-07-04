import { CalendarHeart } from 'lucide-react'

import { BestMonth } from '@/shared/lib/year-stats'

import { StatTile } from './stat-tile.ui'

interface BestMonthTileProps {
  bestMonth: BestMonth | null
}

export const BestMonthTile = ({ bestMonth }: BestMonthTileProps) => (
  <StatTile
    headline={<span style={{ fontSize: 24 }}>{bestMonth?.label ?? '–'}</span>}
    caption={
      bestMonth ? `${bestMonth.count} Konzerte · Bester Monat` : 'Bester Monat'
    }
    icon={<CalendarHeart size={18} />}
  />
)
