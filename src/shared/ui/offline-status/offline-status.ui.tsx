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
    <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
      <WifiOff size={18} />
      <span className="text-sm font-medium">
        Du bist gerade offline. Änderungen werden synchronisiert, sobald du
        wieder verbunden bist.
      </span>
    </div>
  )
}
