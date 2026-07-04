import { CalendarCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Concert } from '@/entities/concert'
import { FirstAndLastShow } from '@/shared/lib/year-stats'

interface FirstLastShowTileProps {
  firstAndLast: FirstAndLastShow
}

const cardStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 16,
  background: 'rgba(255,255,255,0.03)',
  border: '0.5px solid rgba(255,255,255,0.08)'
}

const formatDate = (date: string): string => {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const MiniCard = ({
  label,
  concert,
  onClick
}: {
  label: string
  concert: Concert
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className="cursor-pointer text-left transition-transform hover:scale-[1.02]"
    style={{
      flex: 1,
      minWidth: 0,
      padding: 12,
      borderRadius: 12,
      background: 'rgba(255,255,255,0.04)',
      border: '0.5px solid rgba(255,255,255,0.08)',
      fontFamily: 'inherit'
    }}
  >
    <div
      className="uppercase font-semibold"
      style={{
        fontSize: 9.5,
        letterSpacing: 0.6,
        color: 'var(--accent)',
        marginBottom: 6
      }}
    >
      {label}
    </div>
    <div className="text-white font-semibold truncate" style={{ fontSize: 14 }}>
      {concert.band}
    </div>
    <div
      style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}
    >
      {formatDate(concert.date)}
    </div>
  </button>
)

export const FirstLastShowTile = ({ firstAndLast }: FirstLastShowTileProps) => {
  const navigate = useNavigate()
  const { first, last } = firstAndLast

  if (!first || !last) return null

  return (
    <div style={cardStyle}>
      <div
        className="flex items-center gap-2"
        style={{
          fontSize: 12.5,
          color: 'rgba(255,255,255,0.5)',
          marginBottom: 14
        }}
      >
        <CalendarCheck size={15} style={{ color: 'var(--accent)' }} />
        Erste & letzte Show
      </div>
      <div className="flex" style={{ gap: 10 }}>
        <MiniCard
          label="Erste Show"
          concert={first}
          onClick={() => navigate(`/concert/${first.id}`)}
        />
        <MiniCard
          label="Letzte Show"
          concert={last}
          onClick={() => navigate(`/concert/${last.id}`)}
        />
      </div>
    </div>
  )
}
