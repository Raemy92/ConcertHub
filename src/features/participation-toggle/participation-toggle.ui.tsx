import { Car, UserCheck, UserMinus, X } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import { Participation } from '@/entities'
import { concertService } from '@/entities/concert/api/concert.service'

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
  const [showDriverOptions, setShowDriverOptions] = useState(false)
  const [seats, setSeats] = useState(3)

  const handleJoin = async (isDriver: boolean) => {
    if (!user) return
    setLoading(true)
    try {
      const participationData: Omit<Participation, 'id' | 'joinedAt'> = {
        concertId,
        userId: user.uid,
        displayName: user.displayName || user.email || 'Unbekannter Benutzer',
        isDriver,
        ...(isDriver && { availableSeats: seats })
      }

      await concertService.joinConcert(participationData)
      setShowDriverOptions(false)
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

  if (showDriverOptions) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-gray-900 rounded-xl border border-gray-800 flex-1">
        <div className="flex items-center justify-between gap-4">
          <label className="text-sm font-medium text-gray-400">Plätze:</label>
          <input
            type="number"
            min="1"
            max="9"
            value={seats}
            onChange={(e) => setSeats(parseInt(e.target.value))}
            className="w-12 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleJoin(true)}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-bold transition-colors text-xs"
          >
            OK
          </button>
          <button
            onClick={() => setShowDriverOptions(false)}
            className="px-3 py-1.5 text-gray-400 hover:text-white text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 flex-1">
      <button
        onClick={() => handleJoin(false)}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm"
      >
        <UserCheck className="w-5 h-5" />
        Dabei
      </button>
      <button
        onClick={() => setShowDriverOptions(true)}
        disabled={loading}
        className="flex items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold transition-colors border border-gray-700"
        title="Ich fahre mit dem Auto"
      >
        <Car className="w-5 h-5" />
      </button>
    </div>
  )
}
