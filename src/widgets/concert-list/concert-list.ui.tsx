import { Calendar, Clock, Edit2, MapPin, Music } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert } from '@/entities'
import { concertService } from '@/entities/concert'

interface ConcertListProps {
  onEdit: (concert: Concert) => void
  refreshTrigger: number
}

export const ConcertList = ({ onEdit, refreshTrigger }: ConcertListProps) => {
  const { user } = useAuth()
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

  if (loading)
    return (
      <div className="text-white text-center py-10">
        Konzerte werden geladen...
      </div>
    )

  if (concerts.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
        <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Keine anstehenden Konzerte gefunden.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {concerts.map((concert) => (
        <div
          key={concert.id}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-red-600/50 transition-colors group"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-white group-hover:text-red-500 transition-colors">
              {concert.band}
            </h3>
            {user?.uid === concert.createdBy && (
              <button
                onClick={() => onEdit(concert)}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Bearbeiten"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <MapPin className="w-4 h-4 text-red-500" />
              {concert.location}
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Calendar className="w-4 h-4 text-red-500" />
              {new Date(concert.date).toLocaleDateString('de-CH')}
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Clock className="w-4 h-4 text-red-500" />
              {concert.startTime} - {concert.endTime}
            </div>
          </div>

          {concert.openingBands.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Vorprogramm
              </p>
              <div className="flex flex-wrap gap-2">
                {concert.openingBands.map((ob, i) => (
                  <span
                    key={i}
                    className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded"
                  >
                    {ob}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            {concert.genres.map((g, i) => (
              <span
                key={i}
                className="text-[10px] bg-red-900/20 text-red-400 border border-red-900/30 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider"
              >
                {g}
              </span>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-800 flex justify-between items-center">
            <span className="text-gray-400 text-xs">Ticketpreis</span>
            <span className="text-white font-bold">
              {concert.price.toFixed(2)} CHF
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
