import { Car, Minus, Plus } from 'lucide-react'
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
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={() => setIsDriver((prev) => !prev)}
          className="flex items-center justify-between w-full cursor-pointer transition-all"
          style={{
            padding: 14,
            borderRadius: 14,
            background: isDriver
              ? 'rgba(124,255,178,0.06)'
              : 'rgba(255,255,255,0.03)',
            border: isDriver
              ? '0.5px solid rgba(124,255,178,0.25)'
              : '0.5px solid rgba(255,255,255,0.08)'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: isDriver
                  ? 'rgba(124,255,178,0.15)'
                  : 'rgba(255,255,255,0.05)',
                color: isDriver ? 'var(--accent)' : 'rgba(255,255,255,0.7)'
              }}
            >
              <Car size={16} />
            </div>
            <div className="text-left">
              <div
                className="font-semibold text-white"
                style={{ fontSize: 14 }}
              >
                Ich fahre mit dem Auto
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>
                {isDriver ? 'Plätze festlegen' : 'Antippen zum Aktivieren'}
              </div>
            </div>
          </div>
          <div
            className="flex items-center transition-colors"
            style={{
              width: 44,
              height: 26,
              borderRadius: 999,
              padding: 2,
              background: isDriver ? 'var(--accent)' : 'rgba(255,255,255,0.12)'
            }}
          >
            <div
              className="transition-transform"
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: '#fff',
                transform: isDriver ? 'translateX(18px)' : 'translateX(0)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
              }}
            />
          </div>
        </button>

        {isDriver && (
          <div
            className="flex items-center justify-between gap-4 animate-fade-in"
            style={{ padding: '0 4px' }}
          >
            <label
              className="font-medium"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}
            >
              Verfügbare Plätze
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSeats((s) => Math.max(1, s - 1))}
                disabled={seats <= 1}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  opacity: seats <= 1 ? 0.4 : 1
                }}
              >
                <Minus size={14} />
              </button>
              <span
                className="font-bold text-center"
                style={{
                  width: 24,
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 15
                }}
              >
                {seats}
              </span>
              <button
                type="button"
                onClick={() => setSeats((s) => Math.min(9, s + 1))}
                disabled={seats >= 9}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  opacity: seats >= 9 ? 0.4 : 1
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full font-semibold cursor-pointer"
          style={{
            padding: '14px 16px',
            borderRadius: 14,
            background: 'var(--accent)',
            color: '#0a1220',
            border: 'none',
            fontSize: 14.5,
            opacity: loading ? 0.6 : 1,
            boxShadow: loading ? 'none' : '0 8px 24px var(--accent-glow)'
          }}
        >
          {loading ? 'Wird gespeichert …' : 'Bestätigen'}
        </button>
      </div>
    </Modal>
  )
}
