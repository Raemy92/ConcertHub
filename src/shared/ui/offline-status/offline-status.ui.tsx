import { WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

export const OfflineStatus = () => {
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div
      className="sticky top-0 z-40 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300"
      style={{
        padding: '8px 16px',
        background: 'rgba(255,176,32,0.12)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '0.5px solid rgba(255,176,32,0.25)',
        color: '#ffd98a'
      }}
    >
      <WifiOff size={14} strokeWidth={2.25} />
      <span style={{ fontSize: 12.5, fontWeight: 500, letterSpacing: 0.1 }}>
        Offline – Änderungen werden synchronisiert, sobald du wieder verbunden
        bist.
      </span>
    </div>
  )
}
