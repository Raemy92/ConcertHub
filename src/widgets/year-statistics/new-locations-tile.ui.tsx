import { MapPin } from 'lucide-react'

import { StatTile } from './stat-tile.ui'

interface NewLocationsTileProps {
  count: number
}

export const NewLocationsTile = ({ count }: NewLocationsTileProps) => (
  <StatTile headline={count} caption="Locations" icon={<MapPin size={18} />} />
)
