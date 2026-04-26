import {
  CalendarPlus,
  Car,
  Check,
  Clock,
  Edit2,
  MapPin,
  Share2,
  Ticket,
  Users
} from 'lucide-react'
import { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert } from '@/entities/concert'
import { Participation } from '@/entities/participation'
import { downloadConcertIcs } from '@/shared/lib/ics'
import { shareOrCopy } from '@/shared/lib/share'
import { Chip, ConcertHero, GenrePill } from '@/shared/ui'

interface ConcertCardProps {
  concert: Concert
  participations: Participation[]
  onEdit: (concert: Concert) => void
}

export const ConcertCard = ({
  concert,
  participations,
  onEdit
}: ConcertCardProps) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [justCopied, setJustCopied] = useState(false)
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current !== null) {
        clearTimeout(copiedTimeoutRef.current)
      }
    }
  }, [])

  const userParticipation = participations.find((p) => p.userId === user?.uid)
  const isOwner = user?.uid === concert.createdBy
  const youJoined = !!userParticipation

  const drivers = participations.filter((p) => p.isDriver)
  const totalSeats = drivers.reduce((s, d) => s + (d.availableSeats || 0), 0)
  const seatsTaken = participations.filter((p) => p.driverId).length
  const seatsLeft = Math.max(0, totalSeats - seatsTaken)
  const withTickets = participations.filter((p) => p.hasTicket).length
  const allHaveTicket =
    withTickets === participations.length && participations.length > 0

  const handleEditClick = (e: MouseEvent) => {
    e.stopPropagation()
    onEdit(concert)
  }

  const handleCalendarDownload = (e: MouseEvent) => {
    e.stopPropagation()
    downloadConcertIcs(concert)
  }

  const handleShareClick = async (e: MouseEvent) => {
    e.stopPropagation()
    if (!concert.id) return
    const result = await shareOrCopy({
      title: concert.band,
      url: `${window.location.origin}/concert/${concert.id}`
    })
    if (result === 'copied') {
      setJustCopied(true)
      if (copiedTimeoutRef.current !== null) {
        clearTimeout(copiedTimeoutRef.current)
      }
      copiedTimeoutRef.current = setTimeout(() => {
        setJustCopied(false)
        copiedTimeoutRef.current = null
      }, 2000)
    }
  }

  const handleNavigateToDetail = () => {
    navigate(`concert/${concert.id}`)
  }

  const handleCardKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleNavigateToDetail()
    }
  }

  const formattedPrice = concert.price.toFixed(2)
  const displayedGenres = concert.genres.slice(0, 3)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleNavigateToDetail}
      onKeyDown={handleCardKeyDown}
      className="block w-full text-left cursor-pointer transition-all hover:-translate-y-0.5 relative"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        overflow: 'hidden'
      }}
    >
      {youJoined && (
        <div
          className="absolute font-bold uppercase"
          style={{
            top: 12,
            left: 12,
            zIndex: 2,
            background: 'rgba(124,255,178,0.95)',
            color: '#0a1220',
            padding: '3px 8px',
            borderRadius: 999,
            fontSize: 10,
            letterSpacing: 0.3
          }}
        >
          Dabei
        </div>
      )}

      <ConcertHero
        band={concert.band}
        openingBands={concert.openingBands}
        genres={concert.genres}
        date={concert.date}
        height={140}
      />

      <div className="px-3.5 pt-3 pb-3.5">
        <div
          className="flex items-center gap-1.5 mb-2 flex-wrap"
          style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12.5 }}
        >
          <MapPin size={13} />
          <span className="font-medium truncate" style={{ maxWidth: '70%' }}>
            {concert.location}
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <Clock size={13} />
          <span>{concert.startTime}</span>
        </div>

        {displayedGenres.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-2.5">
            {displayedGenres.map((g, i) => (
              <GenrePill key={`${g}-${i}`} tag={g} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            <Chip icon={Users}>{participations.length}</Chip>
            <Chip icon={Ticket} tone={allHaveTicket ? 'green' : 'default'}>
              {withTickets}/{participations.length}
            </Chip>
            <Chip icon={Car} tone={seatsLeft > 0 ? 'amber' : 'mute'}>
              {drivers.length > 0
                ? `${seatsLeft} Platz${seatsLeft !== 1 ? 'e' : ''}`
                : 'kein Auto'}
            </Chip>
          </div>
          <span
            className="font-bold"
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.95)',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            CHF {formattedPrice}
          </span>
        </div>

        <div
          className="flex gap-1 mt-3 pt-3"
          onClick={(e) => e.stopPropagation()}
          style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}
        >
          <button
            onClick={handleShareClick}
            className="flex items-center justify-center cursor-pointer"
            title={justCopied ? 'Link kopiert' : 'Link teilen'}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)'
            }}
          >
            {justCopied ? <Check size={14} /> : <Share2 size={14} />}
          </button>
          <button
            onClick={handleCalendarDownload}
            className="flex items-center justify-center cursor-pointer"
            title="Zum Kalender hinzufügen"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)'
            }}
          >
            <CalendarPlus size={14} />
          </button>
          {isOwner && (
            <button
              onClick={handleEditClick}
              className="flex items-center justify-center cursor-pointer"
              title="Bearbeiten"
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)'
              }}
            >
              <Edit2 size={14} />
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleNavigateToDetail()
            }}
            className="cursor-pointer font-semibold"
            style={{
              padding: '7px 14px',
              borderRadius: 10,
              background: 'rgba(124,255,178,0.12)',
              color: 'var(--accent)',
              border: '0.5px solid rgba(124,255,178,0.3)',
              fontSize: 12.5
            }}
          >
            Details
          </button>
        </div>
      </div>
    </div>
  )
}
