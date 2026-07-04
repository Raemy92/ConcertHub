import { Car } from 'lucide-react'

import { CarpoolBalance } from '@/shared/lib/year-stats'

interface CarpoolBalanceTileProps {
  carpool: CarpoolBalance
}

const cardStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 16,
  background: 'rgba(255,255,255,0.03)',
  border: '0.5px solid rgba(255,255,255,0.08)'
}

const SubNumber = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col" style={{ gap: 2 }}>
    <div
      className="text-white font-semibold leading-none"
      style={{ fontSize: 24, letterSpacing: -0.5 }}
    >
      {value}
    </div>
    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>
      {label}
    </div>
  </div>
)

export const CarpoolBalanceTile = ({ carpool }: CarpoolBalanceTileProps) => (
  <div style={cardStyle}>
    <div
      className="flex items-center gap-2"
      style={{
        fontSize: 12.5,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 14
      }}
    >
      <Car size={15} style={{ color: 'var(--accent)' }} />
      Carpool-Bilanz
    </div>
    <div className="flex" style={{ gap: 20 }}>
      <SubNumber value={carpool.drove} label="gefahren" />
      <SubNumber value={carpool.rode} label="mitgefahren" />
      <SubNumber value={carpool.seatsOffered} label="Sitze angeboten" />
    </div>
  </div>
)
