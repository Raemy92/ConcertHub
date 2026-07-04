import { Car, Plus, X } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert } from '@/entities/concert'
import { Participation, participationService } from '@/entities/participation'
import { JoinConcertModal } from '@/features/participation-toggle'
import { Avatar } from '@/shared/ui'

interface CarpoolTabProps {
  concert: Concert
  participations: Participation[]
}

export const CarpoolTab = ({ concert, participations }: CarpoolTabProps) => {
  const { user } = useAuth()
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [busy, setBusy] = useState(false)

  const me = participations.find((p) => p.userId === user?.uid)
  const drivers = participations.filter((p) => p.isDriver)
  const unassigned = participations.filter((p) => !p.isDriver && !p.driverId)

  const getName = (p: Participation) =>
    p.displayName?.trim() || 'Unbekannter Benutzer'

  const handleAssignSelf = async (driverId: string) => {
    if (!user || !concert.id || !me) return
    setBusy(true)
    try {
      await participationService.assignPassenger(concert.id, driverId, user.uid)
    } finally {
      setBusy(false)
    }
  }

  const handleUnassignSelf = async () => {
    if (!user || !concert.id) return
    setBusy(true)
    try {
      await participationService.removePassenger(concert.id, user.uid)
    } finally {
      setBusy(false)
    }
  }

  const handleAddPassenger = async (driverId: string, passengerId: string) => {
    if (!concert.id) return
    setBusy(true)
    try {
      await participationService.assignPassenger(
        concert.id,
        driverId,
        passengerId
      )
    } finally {
      setBusy(false)
    }
  }

  const handleRemovePassenger = async (passengerId: string) => {
    if (!concert.id) return
    setBusy(true)
    try {
      await participationService.removePassenger(concert.id, passengerId)
    } finally {
      setBusy(false)
    }
  }

  const handleJoinNew = (isDriver: boolean, seats: number) => {
    if (!user || !concert.id) return
    setShowJoinModal(false)
    const resolvedDisplayName =
      user.displayName?.trim() || user.email?.trim() || 'Unbekannter Benutzer'
    void participationService
      .join({
        concertId: concert.id,
        userId: user.uid,
        displayName: resolvedDisplayName,
        isDriver,
        ...(isDriver && { availableSeats: seats })
      })
      .catch((err) => console.error('Error joining concert:', err))
  }

  // Promote the existing participation to driver in place — keeps the ticket and
  // any other state instead of leaving and re-joining.
  const handleBecomeDriver = (_isDriver: boolean, seats: number) => {
    if (!user || !concert.id) return
    setShowDriverModal(false)
    void participationService
      .becomeDriver(concert.id, user.uid, seats)
      .catch((err) => console.error('Error becoming driver:', err))
  }

  const handleStopDriving = async () => {
    if (!user || !concert.id) return
    setBusy(true)
    try {
      await participationService.stopDriving(concert.id, user.uid)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-4 flex flex-col gap-3">
      {drivers.length === 0 && (
        <div
          className="text-center"
          style={{
            padding: 18,
            borderRadius: 14,
            border: '0.5px dashed rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.02)'
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.6)',
              marginBottom: 4
            }}
          >
            Noch keine Fahrer - willst du das Steuer übernehmen?
          </div>
        </div>
      )}

      {drivers.map((d) => {
        const passengers = participations.filter((p) => p.driverId === d.userId)
        const totalSeats = d.availableSeats || 0
        const seatsLeft = totalSeats - passengers.length
        const iAmThisDriver = me?.userId === d.userId
        const iAmAlreadyPassenger = passengers.some(
          (p) => p.userId === user?.uid
        )
        const canRideHere =
          me && !me.isDriver && !iAmAlreadyPassenger && seatsLeft > 0

        return (
          <div
            key={d.userId}
            style={{
              padding: 14,
              borderRadius: 16,
              background: 'rgba(124,255,178,0.04)',
              border: '0.5px solid rgba(124,255,178,0.15)'
            }}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: 'rgba(124,255,178,0.15)',
                  color: 'var(--accent)'
                }}
              >
                <Car size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold" style={{ fontSize: 14 }}>
                  {getName(d)}{' '}
                  <span
                    style={{
                      fontWeight: 400,
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: 12.5
                    }}
                  >
                    fährt
                  </span>
                </div>
                <div
                  style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)' }}
                >
                  {seatsLeft} von {totalSeats} Plätze frei
                </div>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: totalSeats }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background:
                        i < passengers.length
                          ? 'var(--accent)'
                          : 'rgba(124,255,178,0.2)'
                    }}
                  />
                ))}
              </div>
            </div>

            <div
              className="flex flex-wrap gap-1.5 items-center"
              style={{ minHeight: 28 }}
            >
              {passengers.length === 0 && (
                <span
                  className="italic"
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.35)'
                  }}
                >
                  noch leer
                </span>
              )}
              {passengers.map((p) => {
                const removable = iAmThisDriver || p.userId === user?.uid
                return (
                  <div
                    key={p.userId}
                    className="inline-flex items-center"
                    style={{
                      gap: 6,
                      padding: '3px 8px 3px 3px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.06)',
                      border: '0.5px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    <Avatar name={getName(p)} size={22} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>
                      {getName(p).split(' ')[0]}
                    </span>
                    {removable && (
                      <button
                        onClick={() =>
                          p.userId === user?.uid
                            ? handleUnassignSelf()
                            : handleRemovePassenger(p.userId)
                        }
                        className="cursor-pointer flex items-center justify-center"
                        style={{
                          marginLeft: 2,
                          width: 16,
                          height: 16,
                          borderRadius: 999,
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: 'rgba(255,255,255,0.7)'
                        }}
                        title="Entfernen"
                      >
                        <X size={9} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {canRideHere && (
              <button
                onClick={() => handleAssignSelf(d.userId)}
                disabled={busy}
                className="cursor-pointer flex items-center justify-center gap-1.5 font-semibold w-full"
                style={{
                  marginTop: 10,
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '0.5px solid rgba(124,255,178,0.3)',
                  background: 'rgba(124,255,178,0.08)',
                  color: 'var(--accent)',
                  fontSize: 13
                }}
              >
                <Plus size={14} />
                Mit {getName(d).split(' ')[0]} mitfahren
              </button>
            )}

            {iAmThisDriver && unassigned.length > 0 && seatsLeft > 0 && (
              <div className="mt-2.5">
                <div
                  className="font-semibold uppercase mb-1.5"
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.45)',
                    letterSpacing: 0.6
                  }}
                >
                  Freie Mitfahrer hinzufügen
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {unassigned.map((u) => (
                    <button
                      key={u.userId}
                      onClick={() => handleAddPassenger(d.userId, u.userId)}
                      disabled={busy}
                      className="cursor-pointer inline-flex items-center gap-1.5 font-semibold"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: 'rgba(255,176,32,0.08)',
                        color: '#ffb020',
                        border: '0.5px solid rgba(255,176,32,0.25)',
                        fontSize: 11.5
                      }}
                    >
                      <Plus size={11} />
                      {getName(u).split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {!me && (
        <button
          onClick={() => setShowJoinModal(true)}
          disabled={busy}
          className="cursor-pointer flex items-center justify-center gap-2 font-semibold"
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            border: '0.5px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.03)',
            color: '#fff',
            fontSize: 13.5
          }}
        >
          <Car size={16} />
          Mitmachen & evtl. fahren
        </button>
      )}

      {me && !me.isDriver && (
        <button
          onClick={() => setShowDriverModal(true)}
          disabled={busy}
          className="cursor-pointer flex items-center justify-center gap-2 font-semibold"
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            border: '0.5px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.03)',
            color: '#fff',
            fontSize: 13.5
          }}
        >
          <Car size={16} />
          Fahrer werden
        </button>
      )}

      {me && me.isDriver && (
        <button
          onClick={handleStopDriving}
          disabled={busy}
          className="cursor-pointer flex items-center justify-center gap-2 font-semibold"
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            border: '0.5px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.03)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 13.5
          }}
        >
          <X size={16} />
          Ich fahre doch nicht
        </button>
      )}

      <JoinConcertModal
        isOpen={showJoinModal}
        loading={busy}
        onClose={() => setShowJoinModal(false)}
        onConfirm={handleJoinNew}
      />

      <JoinConcertModal
        isOpen={showDriverModal}
        loading={busy}
        onClose={() => setShowDriverModal(false)}
        onConfirm={handleBecomeDriver}
        driverOnly
        title="Fahrer werden"
      />
    </div>
  )
}
