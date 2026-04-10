import { Music } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert, concertService } from '@/entities/concert'
import { participationService } from '@/entities/participation'
import { ConcertCard } from '@/widgets/concert-card'

type Filter = 'all' | 'participating' | 'created'

interface ConcertListProps {
  onEdit: (concert: Concert) => void
  refreshTrigger: number
}

export const ConcertList = ({ onEdit, refreshTrigger }: ConcertListProps) => {
  const { user } = useAuth()
  const [concerts, setConcerts] = useState<Concert[]>([])
  const [participatingConcertIds, setParticipatingConcertIds] = useState<
    Set<string>
  >(new Set())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

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

  useEffect(() => {
    if (!user) return
    return participationService.subscribeConcertIdsByUser(
      user.uid,
      setParticipatingConcertIds
    )
  }, [user])

  const filteredConcerts = useMemo(() => {
    if (filter === 'participating') {
      return concerts.filter((c) => c.id && participatingConcertIds.has(c.id))
    }
    if (filter === 'created') {
      return concerts.filter((c) => c.createdBy === user?.uid)
    }
    return concerts
  }, [concerts, filter, participatingConcertIds, user])

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Alle' },
    { key: 'participating', label: 'Dabei' },
    { key: 'created', label: 'Erstellt' }
  ]

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
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2 sm:flex">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors text-center ${
              filter === key
                ? 'bg-red-600 text-white'
                : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white hover:border-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredConcerts.length === 0 ? (
        <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
          <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {filter === 'participating'
              ? 'Du nimmst noch an keinem Konzert teil.'
              : 'Du hast noch kein Konzert erstellt.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {filteredConcerts.map((concert) => (
            <ConcertCard key={concert.id} concert={concert} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  )
}
