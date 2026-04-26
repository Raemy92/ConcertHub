import { CalendarClock, History, LogOut, Settings } from 'lucide-react'
import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
import { authService } from '@/shared/auth/auth-service'
import { Avatar } from '@/shared/ui'

interface MobileNavDrawerProps {
  open: boolean
  onClose: () => void
}

const navItemStyle = ({
  isActive
}: {
  isActive: boolean
}): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 12px',
  borderRadius: 12,
  background: isActive ? 'rgba(124,255,178,0.1)' : 'transparent',
  color: isActive ? 'var(--accent)' : '#fff',
  fontSize: 14.5,
  fontWeight: 500,
  textDecoration: 'none'
})

export const MobileNavDrawer = ({ open, onClose }: MobileNavDrawerProps) => {
  const { user } = useAuth()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const handleLogout = async () => {
    onClose()
    await authService.logout()
  }

  const displayName = user?.displayName?.split(' ')[0] || 'You'

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 md:hidden animate-fade-in"
      style={{
        zIndex: 180,
        background: 'rgba(0,0,0,0.5)'
      }}
      role="presentation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Hauptnavigation"
        className="fixed top-0 left-0 bottom-0 flex flex-col animate-slide-in-left"
        style={{
          width: '80%',
          background: 'rgba(14,18,36,0.98)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          padding: '56px 20px 40px',
          borderRight: '0.5px solid rgba(255,255,255,0.08)',
          gap: 4
        }}
      >
        <div
          className="flex items-center"
          style={{ gap: 12, padding: '12px 4px 22px' }}
        >
          <Avatar name={user?.displayName || user?.email || 'You'} size={48} />
          <div className="min-w-0">
            <div
              className="truncate text-white"
              style={{ fontSize: 16, fontWeight: 700 }}
            >
              {displayName}
            </div>
            <div
              className="truncate"
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}
            >
              {user?.email}
            </div>
          </div>
        </div>

        <NavLink to="/" end style={navItemStyle} onClick={onClose}>
          <CalendarClock size={18} />
          Kommende
        </NavLink>
        <NavLink to="/archive" style={navItemStyle} onClick={onClose}>
          <History size={18} />
          Archiv
        </NavLink>
        <NavLink to="/settings" style={navItemStyle} onClick={onClose}>
          <Settings size={18} />
          Einstellungen
        </NavLink>

        <div style={{ flex: 1 }} />

        <button
          onClick={handleLogout}
          className="flex items-center cursor-pointer"
          style={{
            gap: 12,
            padding: '12px 12px',
            borderRadius: 12,
            background: 'transparent',
            border: 'none',
            color: '#ff7788',
            fontSize: 14.5,
            fontWeight: 500,
            textAlign: 'left',
            fontFamily: 'inherit'
          }}
        >
          <LogOut size={18} />
          Abmelden
        </button>
      </div>
    </div>
  )
}
