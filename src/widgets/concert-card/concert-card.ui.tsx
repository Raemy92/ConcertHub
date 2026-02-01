import {
  Calendar,
  ChevronRight,
  Clock,
  Edit2,
  MapPin,
  Users
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert, Participation } from '@/entities'
import { concertService } from '@/entities/concert'
import { ParticipationToggle } from '@/features/participation-toggle'
import { Modal } from '@/shared/ui'
import { ConcertDetails } from '@/widgets/concert-details'

interface ConcertCardProps {
  concert: Concert
  onEdit: (concert: Concert) => void
}

export const ConcertCard = ({ concert, onEdit }: ConcertCardProps) => {
  const { user } = useAuth()
  const [participations, setParticipations] = useState<Participation[]>([])
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (concert.id) {
      const unsubscribe = concertService.subscribeToParticipations(
        concert.id,
        setParticipations
      )
      return () => unsubscribe()
    }
  }, [concert.id])

  const userParticipation = participations.find((p) => p.userId === user?.uid)
  const isOwner = user?.uid === concert.createdBy

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(concert)
  }

  const handleDetailsClick = () => {
    setShowDetailsModal(true)
  }

  const formattedDate = new Date(concert.date).toLocaleDateString('de-CH')
  const formattedPrice = concert.price.toFixed(2)
  const displayedGenres = concert.genres.slice(0, 2)

  return (
    <>
      <div
        onClick={handleDetailsClick}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-red-600/50 transition-all group flex flex-col cursor-pointer hover:shadow-xl hover:shadow-red-900/10"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white group-hover:text-red-500 transition-colors line-clamp-1">
              {concert.band}
            </h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {displayedGenres.map((genre, index) => (
                <span
                  key={index}
                  className="text-[9px] text-red-400 uppercase font-bold tracking-wider"
                >
                  {genre}
                  {index < displayedGenres.length - 1 ? ' •' : ''}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <button
                onClick={handleEditClick}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Bearbeiten"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="line-clamp-1">{concert.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Calendar className="w-4 h-4 text-red-500" />
            {formattedDate}
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Clock className="w-4 h-4 text-red-500" />
            {concert.startTime} - {concert.endTime}
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-gray-400 text-xs">
                {participations.length} Teilnehmer
              </span>
            </div>
            <span className="text-white font-bold">{formattedPrice} CHF</span>
          </div>

          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {concert.id && (
              <ParticipationToggle
                concertId={concert.id}
                currentParticipation={userParticipation}
              />
            )}
            <button
              onClick={handleDetailsClick}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm"
            >
              Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={concert.band}
      >
        <ConcertDetails concert={concert} participations={participations} />
      </Modal>
    </>
  )
}
