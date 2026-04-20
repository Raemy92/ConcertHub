import {
  CalendarClock,
  History,
  LogOut,
  MoreHorizontal,
  Plus
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
import { authService } from '@/shared/auth/auth-service'
import { Avatar } from '@/shared/ui'

interface AppSidebarProps {
  onCreate: () => void
}

const navItemStyle = ({
  isActive
}: {
  isActive: boolean
}): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 11,
  padding: '9px 12px',
  borderRadius: 10,
  background: isActive ? 'rgba(124,255,178,0.1)' : 'transparent',
  color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.75)',
  fontSize: 13.5,
  fontWeight: 500,
  textDecoration: 'none',
  transition: 'all 0.15s'
})

export const AppSidebar = ({ onCreate }: AppSidebarProps) => {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    setMenuOpen(false)
    await authService.logout()
  }

  const displayName = user?.displayName?.split(' ')[0] || 'You'

  return (
    <aside
      className="hidden md:flex md:flex-col md:h-screen md:overflow-y-auto md:sticky md:top-0"
      style={{
        width: 240,
        padding: '22px 16px',
        gap: 4,
        borderRight: '0.5px solid rgba(255,255,255,0.06)',
        flexShrink: 0
      }}
      aria-label="Hauptnavigation"
    >
      <div className="flex items-center" style={{ padding: '4px 8px 22px' }}>
        <h1
          className="font-semibold tracking-tighter leading-none text-white"
          style={{ fontSize: 20, letterSpacing: -0.5 }}
        >
          Concert
          <span
            className="ml-1 font-semibold inline-flex items-center"
            style={{
              background: 'var(--accent)',
              color: '#0a1220',
              padding: '2px 6px',
              borderRadius: 6
            }}
          >
            hub
          </span>
        </h1>
        <span
          className="ml-2"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}
        >
          {__APP_VERSION__}
        </span>
      </div>

      <button
        onClick={onCreate}
        className="cursor-pointer flex items-center justify-center gap-1.5 font-semibold"
        style={{
          padding: 10,
          borderRadius: 10,
          background: 'linear-gradient(180deg, #8affc0, #5ee09a)',
          color: '#031615',
          border: 'none',
          fontSize: 13,
          boxShadow: '0 4px 14px rgba(124,255,178,0.2)'
        }}
      >
        <Plus size={15} strokeWidth={2.5} />
        Neues Konzert
      </button>

      <div
        className="font-semibold uppercase"
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: 0.8,
          padding: '12px 12px 6px'
        }}
      >
        Bibliothek
      </div>

      <NavLink to="/" end style={navItemStyle}>
        <CalendarClock size={16} />
        Kommende
      </NavLink>
      <NavLink to="/archive" style={navItemStyle}>
        <History size={16} />
        Archiv
      </NavLink>

      <div style={{ flex: 1 }} />

      <div ref={menuRef} style={{ position: 'relative' }}>
        {menuOpen && (
          <div
            role="menu"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'rgba(22,26,46,0.98)',
              border: '0.5px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              padding: 4,
              zIndex: 10,
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
            }}
          >
            <button
              onClick={handleLogout}
              role="menuitem"
              className="w-full cursor-pointer flex items-center gap-2"
              style={{
                padding: '9px 10px',
                borderRadius: 7,
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.85)',
                fontSize: 13,
                fontWeight: 500,
                textAlign: 'left',
                fontFamily: 'inherit'
              }}
            >
              <LogOut size={14} />
              Abmelden
            </button>
          </div>
        )}
        <div
          className="flex items-center"
          style={{
            gap: 10,
            padding: 10,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(255,255,255,0.06)'
          }}
        >
          <Avatar name={user?.displayName || user?.email || 'You'} size={34} />
          <div className="flex-1 min-w-0">
            <div
              className="font-semibold truncate text-white"
              style={{ fontSize: 13 }}
            >
              {displayName}
            </div>
            <div
              className="truncate"
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}
            >
              {user?.email}
            </div>
          </div>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title="Menü"
            className="cursor-pointer flex items-center justify-center"
            style={{
              padding: 6,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)'
            }}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
