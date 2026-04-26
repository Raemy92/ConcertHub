import { Car, Check, Plus, Ticket, UserMinus } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert } from '@/entities/concert'
import { Participation, participationService } from '@/entities/participation'
import {
  JoinConcertModal,
  LeaveConfirmModal
} from '@/features/participation-toggle'
import { Avatar, Chip, ToggleRow } from '@/shared/ui'

interface ParticipantsTabProps {
  concert: Concert
  participations: Participation[]
}

export const ParticipantsTab = ({
  concert,
  participations
}: ParticipantsTabProps) => {
  const { user } = useAuth()
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [busy, setBusy] = useState(false)

  const me = participations.find((p) => p.userId === user?.uid)
  const others = participations.filter((p) => p.userId !== user?.uid)

  const handleJoin = (isDriver: boolean, seats: number) => {
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

  const handleLeave = async () => {
    if (!user || !concert.id) return
    setBusy(true)
    setShowLeaveModal(false)
    try {
      await participationService.leave(concert.id, user.uid)
    } catch (err) {
      console.error('Error leaving concert:', err)
    } finally {
      setBusy(false)
    }
  }

  const handleTicketToggle = async (next: boolean) => {
    if (!user || !concert.id) return
    setBusy(true)
    try {
      await participationService.updateTicketStatus(concert.id, user.uid, next)
    } finally {
      setBusy(false)
    }
  }

  const getName = (p: Participation) =>
    p.displayName?.trim() || 'Unbekannter Benutzer'

  return (
    <div className="px-4 flex flex-col gap-2.5">
      <ToggleRow
        icon={me ? Check : Plus}
        label={me ? 'Du bist dabei' : 'Diesem Konzert beitreten'}
        sublabel={
          me
            ? 'Tippe, um abzumelden'
            : `${participations.length} Person${
                participations.length === 1 ? '' : 'en'
              } gehen mit`
        }
        active={!!me}
        onChange={(next) => {
          if (busy) return
          if (next) setShowJoinModal(true)
          else setShowLeaveModal(true)
        }}
        tone="green"
        disabled={busy}
      />

      {me && (
        <ToggleRow
          icon={Ticket}
          label="Ich habe mein Ticket"
          sublabel={
            me.hasTicket ? 'Gesichert' : 'Nicht vergessen, eines zu holen'
          }
          active={!!me.hasTicket}
          onChange={handleTicketToggle}
          tone="amber"
          disabled={busy}
        />
      )}

      <div
        className="font-semibold uppercase mt-1.5"
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: 0.6,
          margin: '6px 4px -2px'
        }}
      >
        Wer sonst noch geht · {others.length}
      </div>

      {others.length === 0 ? (
        <div
          className="text-center"
          style={{
            padding: 20,
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
            border: '0.5px dashed rgba(255,255,255,0.12)',
            borderRadius: 14
          }}
        >
          Sei der erste - teile das mit der Crew
        </div>
      ) : (
        others.map((p) => (
          <div
            key={p.userId}
            className="flex items-center gap-3"
            style={{
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.03)',
              border: '0.5px solid rgba(255,255,255,0.07)',
              borderRadius: 14
            }}
          >
            <Avatar name={getName(p)} size={36} />
            <div className="flex-1 min-w-0">
              <div
                className="font-semibold text-white"
                style={{ fontSize: 14 }}
              >
                {getName(p)}
              </div>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {p.hasTicket && (
                  <Chip icon={Ticket} tone="amber" size="sm">
                    ticket
                  </Chip>
                )}
                {p.isDriver && (
                  <Chip icon={Car} tone="green" size="sm">
                    fahrer · {p.availableSeats || 0} plätze
                  </Chip>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {me && (
        <button
          onClick={() => setShowLeaveModal(true)}
          disabled={busy}
          className="flex items-center justify-center gap-2 cursor-pointer font-semibold"
          style={{
            marginTop: 10,
            padding: '10px 14px',
            borderRadius: 12,
            background: 'rgba(255,85,119,0.06)',
            color: '#ff7788',
            border: '0.5px solid rgba(255,85,119,0.25)',
            fontSize: 13
          }}
        >
          <UserMinus size={14} />
          Vom Konzert abmelden
        </button>
      )}

      <JoinConcertModal
        isOpen={showJoinModal}
        loading={busy}
        onClose={() => setShowJoinModal(false)}
        onConfirm={handleJoin}
      />
      <LeaveConfirmModal
        isOpen={showLeaveModal}
        loading={busy}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleLeave}
      />
    </div>
  )
}
