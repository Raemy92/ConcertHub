import { Disc3 } from 'lucide-react'

import { TopGenre } from '@/shared/lib/year-stats'
import { genreGradient } from '@/shared/ui'

import { StatTile } from './stat-tile.ui'

interface TopGenreTileProps {
  topGenre: TopGenre | null
}

export const TopGenreTile = ({ topGenre }: TopGenreTileProps) => (
  <StatTile
    icon={<Disc3 size={18} />}
    iconBg={topGenre ? genreGradient(topGenre.genre).hue : undefined}
    headline={
      <span style={{ fontSize: 22 }}>{topGenre?.genre ?? 'Noch keine'}</span>
    }
    caption={
      topGenre
        ? `${topGenre.count} Konzerte · Top Genre`
        : 'Noch keine Genres erfasst'
    }
  />
)
