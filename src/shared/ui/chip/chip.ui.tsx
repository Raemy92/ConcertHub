import { LucideIcon } from 'lucide-react'
import { CSSProperties, ReactNode } from 'react'

export type ChipTone = 'default' | 'green' | 'amber' | 'mute' | 'solid' | 'pink'

const TONES: Record<ChipTone, { bg: string; bd: string; fg: string }> = {
  default: {
    bg: 'rgba(255,255,255,0.06)',
    bd: 'rgba(255,255,255,0.09)',
    fg: 'rgba(255,255,255,0.85)'
  },
  green: {
    bg: 'rgba(124,255,178,0.1)',
    bd: 'rgba(124,255,178,0.25)',
    fg: '#7cffb2'
  },
  amber: {
    bg: 'rgba(255,176,32,0.1)',
    bd: 'rgba(255,176,32,0.25)',
    fg: '#ffb020'
  },
  mute: {
    bg: 'transparent',
    bd: 'rgba(255,255,255,0.12)',
    fg: 'rgba(255,255,255,0.6)'
  },
  solid: { bg: '#7cffb2', bd: '#7cffb2', fg: '#0a1220' },
  pink: {
    bg: 'rgba(255,85,119,0.12)',
    bd: 'rgba(255,85,119,0.25)',
    fg: '#ff7788'
  }
}

interface ChipProps {
  icon?: LucideIcon
  tone?: ChipTone
  children: ReactNode
  style?: CSSProperties
  size?: 'sm' | 'md'
}

export const Chip = ({
  icon: Icon,
  tone = 'default',
  children,
  style,
  size = 'md'
}: ChipProps) => {
  const t = TONES[tone]
  const padding = size === 'sm' ? '2px 7px' : '4px 9px'
  const fontSize = size === 'sm' ? 10.5 : 11
  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold whitespace-nowrap"
      style={{
        padding,
        borderRadius: 999,
        background: t.bg,
        border: `0.5px solid ${t.bd}`,
        color: t.fg,
        fontSize,
        letterSpacing: 0.1,
        ...style
      }}
    >
      {Icon && <Icon size={size === 'sm' ? 11 : 12} />}
      {children}
    </span>
  )
}
