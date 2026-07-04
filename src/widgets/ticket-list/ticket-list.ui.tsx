import { Check, Clock, Link2, ShoppingBag, Ticket } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert } from '@/entities/concert'
import { Participation } from '@/entities/participation'
import { TicketPurchaseModal } from '@/features/ticket-purchase'
import { Avatar } from '@/shared/ui'

interface TicketListProps {
  concert: Concert
  participations: Participation[]
}

const getName = (p: Participation) =>
  p.displayName?.trim() || 'Unbekannter Benutzer'

const purchasedByOther = (p: Participation): boolean =>
  !!p.ticketPurchasedBy && p.ticketPurchasedBy !== p.userId

interface SectionProps {
  title: string
  people: Participation[]
  tone: 'green' | 'amber'
  nameByUid: Map<string, string>
}

const Section = ({ title, people, tone, nameByUid }: SectionProps) => {
  const dot = tone === 'green' ? 'var(--accent)' : '#ffb020'
  return (
    <div>
      <div
        className="font-semibold uppercase flex items-center gap-1.5"
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: 0.6,
          margin: '0 4px 8px'
        }}
      >
        <span
          style={{ width: 7, height: 7, borderRadius: 999, background: dot }}
        />
        {title} · {people.length}
      </div>
      {people.length === 0 ? (
        <div
          style={{
            padding: 14,
            fontSize: 12.5,
            color: 'rgba(255,255,255,0.4)',
            border: '0.5px dashed rgba(255,255,255,0.1)',
            borderRadius: 12
          }}
        >
          -
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {people.map((p) => {
            const Icon = p.hasTicket ? Check : Clock
            const boughtByOther = purchasedByOther(p)
            const buyerName = boughtByOther
              ? (nameByUid.get(p.ticketPurchasedBy!) ?? 'jemandem')
              : ''
            return (
              <div
                key={p.userId}
                className="flex items-center gap-2.5 w-full"
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '0.5px solid rgba(255,255,255,0.07)',
                  borderRadius: 12
                }}
              >
                <Avatar name={getName(p)} size={28} />
                <span className="flex-1 min-w-0">
                  <span
                    className="block font-medium truncate"
                    style={{ fontSize: 13.5 }}
                  >
                    {getName(p)}
                  </span>
                  {boughtByOther && (
                    <span
                      className="block truncate"
                      style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}
                    >
                      gekauft von {buyerName}
                    </span>
                  )}
                </span>
                <Icon
                  size={16}
                  color={p.hasTicket ? 'var(--accent)' : '#ffb020'}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export const TicketList = ({ concert, participations }: TicketListProps) => {
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)

  const have = participations.filter((p) => p.hasTicket)
  const pending = participations.filter((p) => !p.hasTicket)

  const nameByUid = new Map(participations.map((p) => [p.userId, getName(p)]))

  return (
    <div className="px-4 flex flex-col gap-4">
      <div
        className="flex items-center gap-3"
        style={{
          padding: 14,
          borderRadius: 14,
          background:
            'linear-gradient(135deg, rgba(255,176,32,0.12), rgba(255,176,32,0.04))',
          border: '0.5px solid rgba(255,176,32,0.2)'
        }}
      >
        <div
          className="font-extrabold"
          style={{
            fontSize: 28,
            color: '#ffb020',
            letterSpacing: -1,
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {have.length}
          <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
            /{participations.length}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold" style={{ fontSize: 13 }}>
            Tickets gesichert
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>
            CHF {concert.price.toFixed(2)} ·{' '}
            {concert.eventUrl ? 'Link verfügbar' : 'Abendkasse'}
          </div>
        </div>
        {concert.eventUrl && (
          <a
            href={concert.eventUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 cursor-pointer font-semibold"
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(255,176,32,0.15)',
              color: '#ffb020',
              border: '0.5px solid rgba(255,176,32,0.3)',
              fontSize: 12
            }}
          >
            <Link2 size={12} />
            kaufen
          </a>
        )}
        {!concert.eventUrl && <Ticket size={18} color="rgba(255,176,32,0.6)" />}
      </div>

      {!!user && (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 cursor-pointer font-semibold"
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            border: '0.5px solid rgba(255,255,255,0.12)',
            fontSize: 13
          }}
        >
          <ShoppingBag size={14} />
          Tickets für andere gekauft
        </button>
      )}

      <Section
        title="Schon gesichert"
        people={have}
        tone="green"
        nameByUid={nameByUid}
      />
      <Section
        title="Noch offen"
        people={pending}
        tone="amber"
        nameByUid={nameByUid}
      />

      <p
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.4)',
          margin: '0 4px'
        }}
      >
        Deinen eigenen Ticket-Status änderst du im Tab „Dabei".
      </p>

      <TicketPurchaseModal
        concert={concert}
        participations={participations}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
