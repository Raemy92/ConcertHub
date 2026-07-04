import { Users } from 'lucide-react'

import { Buddy } from '@/shared/lib/year-stats'
import { Avatar } from '@/shared/ui'

interface TopBuddiesTileProps {
  buddies: Buddy[]
}

const cardStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 16,
  background: 'rgba(255,255,255,0.03)',
  border: '0.5px solid rgba(255,255,255,0.08)'
}

export const TopBuddiesTile = ({ buddies }: TopBuddiesTileProps) => (
  <div style={cardStyle}>
    <div
      className="flex items-center gap-2"
      style={{
        fontSize: 12.5,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 12
      }}
    >
      <Users size={15} style={{ color: 'var(--accent)' }} />
      Top 3 Buddies
    </div>

    {buddies.length === 0 ? (
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
        Niemand sonst dabei gewesen
      </div>
    ) : (
      <div className="flex flex-col" style={{ gap: 10 }}>
        {buddies.map((buddy) => (
          <div
            key={buddy.uid}
            className="flex items-center"
            style={{ gap: 10 }}
          >
            <Avatar name={buddy.displayName || '??'} size={30} />
            <div
              className="flex-1 min-w-0 truncate text-white font-medium"
              style={{ fontSize: 13.5 }}
            >
              {buddy.displayName || 'Unbekannt'}
            </div>
            <div
              className="font-semibold"
              style={{ fontSize: 13, color: 'var(--accent)' }}
            >
              {buddy.count}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)
