import { UserCheck, UserMinus } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import { Participation } from '@/entities'
import { concertService } from '@/entities/concert/api/concert.service'

import { JoinConcertModal } from './join-concert-modal.ui'
import { LeaveConfirmModal } from './leave-confirm-modal.ui'

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
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  const handleJoin = async (isDriver: boolean, seats: number) => {
    if (!user) return
    const resolvedDisplayName =
      user.displayName?.trim() || user.email?.trim() || 'Unbekannter Benutzer'

    const participationData: Omit<Participation, 'id' | 'joinedAt'> = {
      concertId,
      userId: user.uid,
      displayName: resolvedDisplayName,
      isDriver,
      ...(isDriver && { availableSeats: seats })
    }

    setShowJoinModal(false)
    concertService.joinConcert(participationData).catch((error) => {
      console.error('Error joining concert:', error)
    })
  }

  const handleLeave = async () => {
    if (!user) return
    setLoading(true)
    setShowLeaveModal(false)
    try {
      await concertService.leaveConcert(concertId, user.uid)
    } catch (error) {
      console.error('Error leaving concert:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {currentParticipation ? (
        <button
          onClick={() => setShowLeaveModal(true)}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-red-900/40 text-red-500 px-4 py-2 rounded-lg font-bold transition-all border border-gray-700 hover:border-red-500/50 text-sm"
        >
          <UserMinus className="w-5 h-5" />
          Absagen
        </button>
      ) : (
        <button
          onClick={() => setShowJoinModal(true)}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm"
        >
          <UserCheck className="w-5 h-5" />
          Dabei
        </button>
      )}

      <JoinConcertModal
        isOpen={showJoinModal}
        loading={loading}
        onClose={() => setShowJoinModal(false)}
        onConfirm={handleJoin}
      />

      <LeaveConfirmModal
        isOpen={showLeaveModal}
        loading={loading}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleLeave}
      />
    </>
  )
}
