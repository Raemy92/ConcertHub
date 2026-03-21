import { Car } from 'lucide-react'
import { useState } from 'react'

import { Modal } from '@/shared/ui'

interface JoinConcertModalProps {
  isOpen: boolean
  loading: boolean
  onClose: () => void
  onConfirm: (isDriver: boolean, seats: number) => void
}

export const JoinConcertModal = ({
  isOpen,
  loading,
  onClose,
  onConfirm
}: JoinConcertModalProps) => {
  const [isDriver, setIsDriver] = useState(false)
  const [seats, setSeats] = useState(3)

  const handleConfirm = () => {
    onConfirm(isDriver, seats)
  }

  const handleClose = () => {
    setIsDriver(false)
    setSeats(3)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Anmeldung">
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => setIsDriver((prev) => !prev)}
          className={`flex items-center justify-between w-full p-4 rounded-xl border transition-all ${
            isDriver
              ? 'bg-red-900/20 border-red-900/50 text-red-400'
              : 'bg-gray-800 border-gray-700 text-gray-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <Car className="w-5 h-5" />
            <span className="font-medium text-white">
              Ich fahre mit dem Auto
            </span>
          </div>
          <div
            className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
              isDriver ? 'bg-red-600' : 'bg-gray-600'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                isDriver ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </button>

        {isDriver && (
          <div className="flex items-center justify-between gap-4 px-1 animate-in fade-in duration-200">
            <label className="text-sm font-medium text-gray-400">
              Verfügbare Plätze
            </label>
            <input
              type="number"
              min="1"
              max="9"
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value))}
              className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-bold transition-colors"
        >
          {loading ? 'Wird gespeichert...' : 'Bestätigen'}
        </button>
      </div>
    </Modal>
  )
}
