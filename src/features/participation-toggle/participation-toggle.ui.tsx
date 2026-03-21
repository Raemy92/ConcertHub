import { UserCheck, UserMinus } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import { Participation } from '@/entities'
import { concertService } from '@/entities/concert/api/concert.service'

import { JoinConcertModal } from './join-concert-modal.ui'

interface ParticipationToggleProps {
  concertId: string
  currentParticipation?: Participation
}

export const ParticipationToggle = ({
  concertId,
  currentParticipation
}: ParticipationToggleProps) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const handleJoin = async (isDriver: boolean, seats: number) => {
    if (!user) return
    setLoading(true)
    try {
      const resolvedDisplayName =
        user.displayName?.trim() || user.email?.trim() || 'Unbekannter Benutzer'

      const participationData: Omit<Participation, 'id' | 'joinedAt'> = {
        concertId,
        userId: user.uid,
        displayName: resolvedDisplayName,
        isDriver,
        ...(isDriver && { availableSeats: seats })
      }

      await concertService.joinConcert(participationData)
      setShowModal(false)
    } catch (error) {
      console.error('Error joining concert:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!user) return
    setLoading(true)
    try {
      await concertService.leaveConcert(concertId, user.uid)
    } catch (error) {
      console.error('Error leaving concert:', error)
    } finally {
      setLoading(false)
    }
  }

  if (currentParticipation) {
    return (
      <button
        onClick={handleLeave}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-red-900/40 text-red-500 px-4 py-2 rounded-lg font-bold transition-all border border-gray-700 hover:border-red-500/50 text-sm"
      >
        <UserMinus className="w-5 h-5" />
        Absagen
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm"
      >
        <UserCheck className="w-5 h-5" />
        Dabei
      </button>

      <JoinConcertModal
        isOpen={showModal}
        loading={loading}
        onClose={() => setShowModal(false)}
        onConfirm={handleJoin}
      />
    </>
  )
}
