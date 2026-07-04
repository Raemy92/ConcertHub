import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert } from '@/entities/concert'
import { Participation, participationService } from '@/entities/participation'
import { Avatar, Modal } from '@/shared/ui'

interface TicketPurchaseModalProps {
  concert: Concert
  participations: Participation[]
  isOpen: boolean
  onClose: () => void
}

const nameOf = (p: Participation) =>
  p.displayName?.trim() || 'Unbekannter Benutzer'

interface CheckRowProps {
  name: string
  checked: boolean
  onToggle: () => void
  disabled?: boolean
}

const CheckRow = ({ name, checked, onToggle, disabled }: CheckRowProps) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={disabled}
    className="flex items-center gap-2.5 text-left w-full cursor-pointer disabled:cursor-default"
    style={{
      padding: '8px 12px',
      background: checked ? 'rgba(124,255,178,0.1)' : 'rgba(255,255,255,0.03)',
      border: `0.5px solid ${
        checked ? 'rgba(124,255,178,0.35)' : 'rgba(255,255,255,0.07)'
      }`,
      borderRadius: 12
    }}
  >
    <Avatar name={name} size={28} />
    <span className="flex-1 font-medium truncate" style={{ fontSize: 13.5 }}>
      {name}
    </span>
    <span
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: 20,
        height: 20,
        borderRadius: 6,
        background: checked ? 'var(--accent)' : 'transparent',
        border: `1.5px solid ${
          checked ? 'var(--accent)' : 'rgba(255,255,255,0.25)'
        }`
      }}
    >
      {checked && <Check size={13} color="#0a1220" strokeWidth={3} />}
    </span>
  </button>
)

export const TicketPurchaseModal = ({
  concert,
  participations,
  isOpen,
  onClose
}: TicketPurchaseModalProps) => {
  const { user } = useAuth()

  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // Participants that still need a ticket (excluding the buyer's own row).
  const withoutTicket = participations.filter(
    (p) => !p.hasTicket && p.userId !== user?.uid
  )

  useEffect(() => {
    if (!isOpen) {
      // reset when closed so a reopen starts fresh
      setChecked(new Set())
      setSubmitting(false)
      setDone(false)
    }
  }, [isOpen])

  const toggle = (uid: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }

  const anyChecked = checked.size > 0

  const handleSubmit = async () => {
    if (!user || !concert.id || !anyChecked) return
    setSubmitting(true)
    try {
      await participationService.bulkAssignTickets(
        concert.id,
        user.uid,
        Array.from(checked)
      )
      setDone(true)
      setTimeout(onClose, 1500)
    } catch (err) {
      console.error(err)
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tickets für andere gekauft"
      variant="sheet"
    >
      <div className="flex flex-col gap-5">
        <div>
          <div
            className="font-semibold uppercase"
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: 0.6,
              margin: '0 4px 8px'
            }}
          >
            Bereits dabei (ohne Ticket)
          </div>
          {withoutTicket.length === 0 ? (
            <div
              style={{
                padding: 14,
                fontSize: 12.5,
                color: 'rgba(255,255,255,0.4)',
                border: '0.5px dashed rgba(255,255,255,0.1)',
                borderRadius: 12
              }}
            >
              Alle Teilnehmenden haben bereits ein Ticket.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {withoutTicket.map((p) => (
                <CheckRow
                  key={p.userId}
                  name={nameOf(p)}
                  checked={checked.has(p.userId)}
                  disabled={submitting}
                  onToggle={() => toggle(p.userId)}
                />
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!anyChecked || submitting}
          className="w-full font-semibold cursor-pointer disabled:cursor-default"
          style={{
            padding: 14,
            borderRadius: 14,
            background:
              done || (anyChecked && !submitting)
                ? 'var(--accent)'
                : 'rgba(255,255,255,0.06)',
            color: done || (anyChecked && !submitting) ? '#0a1220' : '#fff',
            border: '0.5px solid rgba(255,255,255,0.1)',
            fontSize: 15,
            opacity: !anyChecked && !done ? 0.5 : 1
          }}
        >
          {done
            ? 'Erledigt'
            : submitting
              ? 'Wird zugewiesen …'
              : 'Tickets zuweisen'}
        </button>
      </div>
    </Modal>
  )
}
