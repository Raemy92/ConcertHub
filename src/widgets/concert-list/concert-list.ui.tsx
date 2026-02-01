import { Music } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Concert } from '@/entities'
import { concertService } from '@/entities/concert'
import { ConcertCard } from '@/widgets/concert-card'

interface ConcertListProps {
  onEdit: (concert: Concert) => void
  refreshTrigger: number
}

export const ConcertList = ({ onEdit, refreshTrigger }: ConcertListProps) => {
  const [concerts, setConcerts] = useState<Concert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConcerts = async () => {
      setLoading(true)
      try {
        const data = await concertService.getAllUpcoming()
        setConcerts(data)
      } catch (error) {
        console.error('Fehler beim Laden der Konzerte:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConcerts()
  }, [refreshTrigger])

  if (loading) {
    return (
      <div className="text-white text-center py-10">
        Konzerte werden geladen...
      </div>
    )
  }

  if (concerts.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
        <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Keine anstehenden Konzerte gefunden.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {concerts.map((concert) => (
        <ConcertCard key={concert.id} concert={concert} onEdit={onEdit} />
      ))}
    </div>
  )
}
