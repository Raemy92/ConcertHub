import { LucideIcon } from 'lucide-react'

interface ToggleRowProps {
  icon: LucideIcon
  label: string
  sublabel?: string
  active: boolean
  onChange: (next: boolean) => void
  tone?: 'green' | 'amber'
  disabled?: boolean
}

const TONES = {
  green: {
    on: '#7cffb2',
    onBg: 'rgba(124,255,178,0.12)',
    onBd: 'rgba(124,255,178,0.35)'
  },
  amber: {
    on: '#ffb020',
    onBg: 'rgba(255,176,32,0.12)',
    onBd: 'rgba(255,176,32,0.35)'
  }
}

export const ToggleRow = ({
  icon: Icon,
  label,
  sublabel,
  active,
  onChange,
  tone = 'green',
  disabled
}: ToggleRowProps) => {
  const t = TONES[tone]
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!active)}
      disabled={disabled}
      className="w-full flex items-center gap-3 text-left transition-all"
      style={{
        padding: '12px 14px',
        minHeight: 56,
        background: active ? t.onBg : 'rgba(255,255,255,0.03)',
        border: `0.5px solid ${active ? t.onBd : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        color: 'inherit'
      }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: active ? t.on : 'rgba(255,255,255,0.05)',
          color: active ? '#0a1220' : 'rgba(255,255,255,0.7)'
        }}
      >
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{label}</div>
        {sublabel && (
          <div
            className="mt-0.5"
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}
          >
            {sublabel}
          </div>
        )}
      </div>
      <div
        className="flex-shrink-0"
        style={{
          width: 44,
          height: 26,
          borderRadius: 999,
          padding: 2,
          background: active ? t.on : 'rgba(255,255,255,0.12)',
          transition: 'background 0.15s'
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            background: '#fff',
            transform: active ? 'translateX(18px)' : 'translateX(0)',
            transition: 'transform 0.2s cubic-bezier(.2,.8,.2,1)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        />
      </div>
    </button>
  )
}
