import { ReactNode } from 'react'

interface StatTileProps {
  headline: ReactNode
  caption: string
  icon?: ReactNode
  /** Overrides the icon chip background (e.g. a genre gradient). */
  iconBg?: string
  onClick?: () => void
}

const cardStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 16,
  background: 'rgba(255,255,255,0.03)',
  border: '0.5px solid rgba(255,255,255,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minHeight: 112
}

export const StatTile = ({
  headline,
  caption,
  icon,
  iconBg,
  onClick
}: StatTileProps) => {
  const content = (
    <>
      {icon && (
        <div
          className="flex items-center justify-center"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: iconBg ?? 'rgba(124,255,178,0.1)',
            color: iconBg ? '#fff' : 'var(--accent)',
            marginBottom: 2
          }}
        >
          {icon}
        </div>
      )}
      <div
        className="text-white font-semibold leading-none"
        style={{ fontSize: 30, letterSpacing: -1 }}
      >
        {headline}
      </div>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>
        {caption}
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="cursor-pointer text-left transition-transform hover:scale-[1.015]"
        style={{ ...cardStyle, fontFamily: 'inherit' }}
      >
        {content}
      </button>
    )
  }

  return <div style={cardStyle}>{content}</div>
}
