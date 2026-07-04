import { CalendarDays } from 'lucide-react'

import { StatTile } from './stat-tile.ui'

interface TotalConcertsTileProps {
  total: number
}

export const TotalConcertsTile = ({ total }: TotalConcertsTileProps) => (
  <StatTile
    headline={total}
    caption="Konzerte"
    icon={<CalendarDays size={18} />}
  />
)
