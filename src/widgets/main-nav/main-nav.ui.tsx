import { CalendarClock, History, LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

interface NavItem {
  to: string
  end?: boolean
  icon: LucideIcon
  label: string
}

const ITEMS: NavItem[] = [
  { to: '/', end: true, icon: CalendarClock, label: 'Kommende' },
  { to: '/archive', icon: History, label: 'Archiv' }
]

export const MainNav = () => (
  <nav
    className="flex gap-1"
    style={{
      padding: 4,
      background: 'rgba(255,255,255,0.04)',
      border: '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: 12
    }}
    aria-label="Hauptnavigation"
  >
    {ITEMS.map(({ to, end, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className="flex-1 flex items-center justify-center gap-1.5 cursor-pointer font-semibold transition-all"
        style={({ isActive }) => ({
          padding: '8px 10px',
          borderRadius: 9,
          background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
          color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
          fontSize: 13,
          textDecoration: 'none'
        })}
      >
        <Icon size={14} />
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>
)
