import {
  Calendar,
  Car,
  Copy,
  Link2,
  LucideIcon,
  Mail,
  MapPin,
  MessageCircle,
  Share2,
  Ticket,
  Users,
  X
} from 'lucide-react'
import { useState } from 'react'

import { Concert } from '@/entities/concert'
import { Participation } from '@/entities/participation'
import { Chip, ConcertHero, genreOf, GenrePill } from '@/shared/ui'
import { ConcertComments } from '@/widgets/concert-comments'
import { CarpoolTab } from '@/widgets/participant-list'
import { TicketList } from '@/widgets/ticket-list'

import { ParticipantsTab } from './participants-tab.ui'

interface ConcertDetailsProps {
  concert: Concert
  participations: Participation[]
  onClose: () => void
}

type Tab = 'participants' | 'tickets' | 'carpool'

interface TabConfig {
  id: Tab
  icon: LucideIcon
  label: string
  count?: number
}

const InfoTile = ({
  icon: Icon,
  label,
  sub
}: {
  icon: LucideIcon
  label: string
  sub: string
}) => (
  <div
    className="flex items-start gap-2.5"
    style={{
      padding: 12,
      borderRadius: 14,
      background: 'rgba(255,255,255,0.03)',
      border: '0.5px solid rgba(255,255,255,0.07)'
    }}
  >
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.05)',
        color: 'rgba(255,255,255,0.7)'
      }}
    >
      <Icon size={14} />
    </div>
    <div className="min-w-0 flex-1">
      <div
        className="font-semibold text-white"
        style={{ fontSize: 13, lineHeight: 1.2 }}
      >
        {label}
      </div>
      <div
        className="mt-0.5"
        style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}
      >
        {sub}
      </div>
    </div>
  </div>
)

const TabBar = ({
  tabs,
  active,
  onChange
}: {
  tabs: TabConfig[]
  active: Tab
  onChange: (t: Tab) => void
}) => (
  <div
    className="flex gap-1 mx-4 mb-3.5"
    style={{
      padding: 4,
      background: 'rgba(255,255,255,0.04)',
      border: '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: 12
    }}
  >
    {tabs.map((t) => {
      const isActive = active === t.id
      const Icon = t.icon
      return (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="flex-1 flex items-center justify-center gap-1.5 cursor-pointer font-semibold transition-all"
          style={{
            padding: '8px 6px',
            borderRadius: 9,
            border: 'none',
            background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
            fontSize: 13
          }}
        >
          <Icon size={14} />
          <span>{t.label}</span>
          {t.count !== undefined && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.4)'
              }}
            >
              {t.count}
            </span>
          )}
        </button>
      )
    })}
  </div>
)

const ShareSheet = ({
  concert,
  onClose
}: {
  concert: Concert
  onClose: () => void
}) => {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/concert/${concert.id}`
  const copy = () => {
    try {
      void navigator.clipboard.writeText(url)
    } catch {
      /* noop */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const actions: {
    icon: LucideIcon
    label: string
    onClick?: () => void
    href?: string
  }[] = [
    { icon: Copy, label: copied ? 'Kopiert!' : 'Link kopieren', onClick: copy },
    { icon: MessageCircle, label: 'Nachrichten' },
    { icon: Mail, label: 'Mail' },
    { icon: Link2, label: 'Event URL', href: concert.eventUrl }
  ]

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-30 flex items-end animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.55)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full animate-slide-up"
        style={{
          background: 'rgba(22,26,46,0.95)',
          backdropFilter: 'blur(30px)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          border: '0.5px solid rgba(255,255,255,0.1)',
          padding: '12px 16px 36px'
        }}
      >
        <div
          className="mx-auto"
          style={{
            width: 36,
            height: 4,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 999,
            marginBottom: 16
          }}
        />
        <div
          className="text-center font-semibold uppercase mb-3"
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: 0.8
          }}
        >
          Konzert teilen
        </div>
        <div
          className="flex items-center gap-2.5 mb-4"
          style={{
            padding: 12,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.04)'
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: genreOf(concert.genres).hue
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate" style={{ fontSize: 14 }}>
              {concert.band}
            </div>
            <div
              className="truncate mt-0.5"
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}
            >
              {url}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {actions.map((a, i) => {
            const Icon = a.icon
            const disabled = !a.onClick && !a.href
            const inner = (
              <div
                className={`flex flex-col items-center gap-1.5 ${disabled ? 'opacity-40' : ''}`}
                style={{
                  padding: '12px 6px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.04)',
                  border: '0.5px solid rgba(255,255,255,0.07)',
                  color: '#fff'
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(124,255,178,0.12)',
                    color: 'var(--accent)'
                  }}
                >
                  <Icon size={18} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 500 }}>{a.label}</span>
              </div>
            )
            if (a.href) {
              return (
                <a
                  key={i}
                  href={a.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block cursor-pointer"
                >
                  {inner}
                </a>
              )
            }
            return (
              <button
                key={i}
                onClick={a.onClick}
                disabled={disabled}
                className="cursor-pointer"
              >
                {inner}
              </button>
            )
          })}
        </div>
        <button
          onClick={onClose}
          className="w-full font-semibold cursor-pointer"
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.06)',
            color: '#fff',
            border: '0.5px solid rgba(255,255,255,0.1)',
            fontSize: 15
          }}
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}

export const ConcertDetails = ({
  concert,
  participations,
  onClose
}: ConcertDetailsProps) => {
  const [tab, setTab] = useState<Tab>('participants')
  const [share, setShare] = useState(false)

  const fmtDate = concert.date
    ? new Date(concert.date).toLocaleDateString('de-CH', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })
    : '-'

  const tabs: TabConfig[] = [
    {
      id: 'participants',
      icon: Users,
      label: 'Dabei',
      count: participations.length
    },
    {
      id: 'tickets',
      icon: Ticket,
      label: 'Tickets',
      count: participations.filter((p) => p.hasTicket).length
    },
    { id: 'carpool', icon: Car, label: 'Carpool' }
  ]

  return (
    <div
      className="relative -m-5 sm:-m-6 flex flex-col"
      style={{ minHeight: '100%' }}
    >
      <div className="relative">
        <ConcertHero
          band={concert.band}
          openingBands={concert.openingBands}
          genres={concert.genres}
          date={concert.date}
          height={220}
          size="lg"
          showDate={false}
          clampOpeningBands={false}
        />
        <button
          onClick={onClose}
          className="absolute flex items-center justify-center cursor-pointer"
          style={{
            top: 14,
            right: 14,
            zIndex: 2,
            width: 36,
            height: 36,
            borderRadius: 999,
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            border: '0.5px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)'
          }}
          aria-label="Schliessen"
        >
          <X size={18} />
        </button>
        <button
          onClick={() => setShare(true)}
          className="absolute flex items-center justify-center cursor-pointer"
          style={{
            top: 14,
            right: 58,
            zIndex: 2,
            width: 36,
            height: 36,
            borderRadius: 999,
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            border: '0.5px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)'
          }}
          aria-label="Teilen"
        >
          <Share2 size={16} />
        </button>
      </div>

      <div className="px-4 pt-4 pb-3.5">
        <div className="flex gap-1.5 flex-wrap mb-3.5">
          {concert.genres.map((g, i) => (
            <GenrePill key={`${g}-${i}`} tag={g} />
          ))}
          {concert.isArchived && <Chip tone="mute">archiviert</Chip>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-1">
          <InfoTile
            icon={Calendar}
            label={fmtDate}
            sub={`Türöffnung ${concert.doors} · Start ${concert.startTime}`}
          />
          <InfoTile
            icon={MapPin}
            label={concert.location}
            sub={`Ende ${concert.endTime} · CHF ${concert.price.toFixed(2)}`}
          />
        </div>
        {concert.eventUrl && (
          <a
            href={concert.eventUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 mt-3 cursor-pointer font-semibold"
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(255,176,32,0.12)',
              color: '#ffb020',
              border: '0.5px solid rgba(255,176,32,0.25)',
              fontSize: 13
            }}
          >
            <Link2 size={14} />
            Event-Seite öffnen
          </a>
        )}
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      <div className="pb-6">
        {tab === 'participants' && (
          <ParticipantsTab concert={concert} participations={participations} />
        )}
        {tab === 'tickets' && (
          <TicketList concert={concert} participations={participations} />
        )}
        {tab === 'carpool' && (
          <CarpoolTab concert={concert} participations={participations} />
        )}

        {concert.id && (
          <ConcertComments concert={concert} participations={participations} />
        )}
      </div>

      {share && (
        <ShareSheet concert={concert} onClose={() => setShare(false)} />
      )}
    </div>
  )
}
