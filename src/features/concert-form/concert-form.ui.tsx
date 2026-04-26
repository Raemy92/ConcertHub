import {
  Calendar,
  Clock,
  Coins,
  Link2,
  MapPin,
  Music,
  Plus,
  Trash2,
  X
} from 'lucide-react'
import { FormEvent, KeyboardEvent, useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert, concertService } from '@/entities/concert'
import { FormInput, GENRE_GROUPS, genreGradient } from '@/shared/ui'

import { ArchiveConfirmModal } from './archive-confirm-modal.ui'

interface ConcertFormProps {
  concert?: Concert
  onSuccess: () => void
  onCancel: () => void
}

const KNOWN_GENRE_KEYS = new Set(GENRE_GROUPS.flatMap((group) => group.keys))

const prettifyGenre = (key: string): string => key.replace(/-/g, ' ')

const normalizeGenre = (value: string): string =>
  value.toLowerCase().trim().replace(/\s+/g, '-')

const isKnownGenre = (value: string): boolean =>
  KNOWN_GENRE_KEYS.has(normalizeGenre(value))

export const ConcertForm = ({
  concert,
  onSuccess,
  onCancel
}: ConcertFormProps) => {
  const { user } = useAuth()
  const [band, setBand] = useState(concert?.band || '')
  const [openingBands, setOpeningBands] = useState<string[]>(
    concert?.openingBands || []
  )
  const [newOpeningBand, setNewOpeningBand] = useState('')
  const [genres, setGenres] = useState<string[]>(concert?.genres || [])
  const [customGenre, setCustomGenre] = useState('')
  const [location, setLocation] = useState(concert?.location || '')
  const [date, setDate] = useState(concert?.date || '')
  const [startTime, setStartTime] = useState(concert?.startTime || '')
  const [endTime, setEndTime] = useState(concert?.endTime || '')
  const [doors, setDoors] = useState(concert?.doors || '')
  const [price, setPrice] = useState(concert?.price?.toString() || '')
  const [eventUrl, setEventUrl] = useState(concert?.eventUrl || '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    const concertData = {
      band,
      openingBands,
      genres,
      location,
      date,
      startTime,
      endTime,
      doors,
      eventUrl,
      price: Number(price),
      createdBy: concert?.createdBy || user.uid
    }

    try {
      if (concert?.id) {
        await concertService.update(concert.id, concertData)
      } else {
        await concertService.create(concertData)
      }
      onSuccess()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Fehler beim Speichern des Konzerts'
      )
    } finally {
      setLoading(false)
    }
  }

  const addOpeningBand = () => {
    const trimmed = newOpeningBand.trim()
    if (trimmed && !openingBands.includes(trimmed)) {
      setOpeningBands([...openingBands, trimmed])
      setNewOpeningBand('')
    }
  }

  const removeOpeningBand = (index: number) => {
    setOpeningBands(openingBands.filter((_, i) => i !== index))
  }

  const toggleGenre = (label: string) => {
    setGenres((prev) => {
      const target = normalizeGenre(label)
      const idx = prev.findIndex((g) => normalizeGenre(g) === target)
      if (idx >= 0) return prev.filter((_, i) => i !== idx)
      return [...prev, label]
    })
  }

  const addCustomGenre = () => {
    const trimmed = customGenre.trim().toLowerCase()
    if (!trimmed) return
    const target = normalizeGenre(trimmed)
    if (genres.some((g) => normalizeGenre(g) === target)) {
      setCustomGenre('')
      return
    }
    setGenres([...genres, trimmed])
    setCustomGenre('')
  }

  const handleOpeningKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addOpeningBand()
    }
  }

  const handleCustomGenreKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomGenre()
    }
  }

  const sectionLabel = (text: string) => (
    <div
      className="block uppercase font-semibold mb-2"
      style={{
        fontSize: 11,
        letterSpacing: 0.5,
        color: 'rgba(255,255,255,0.55)'
      }}
    >
      {text}
    </div>
  )

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Haupt-Band"
            type="text"
            value={band}
            onChange={setBand}
            placeholder="Band Name"
            icon={Music}
            required
          />
          <FormInput
            label="Ort"
            type="text"
            value={location}
            onChange={setLocation}
            placeholder="Veranstaltungsort"
            icon={MapPin}
            required
          />
          <FormInput
            label="Datum"
            type="date"
            value={date}
            onChange={setDate}
            icon={Calendar}
            required
          />
          <FormInput
            label="Preis (CHF)"
            type="number"
            value={price}
            onChange={setPrice}
            placeholder="69"
            icon={Coins}
            step="0.05"
            required
          />
          <FormInput
            label="Türöffnung"
            type="time"
            value={doors}
            onChange={setDoors}
            icon={Clock}
            required
          />
          <FormInput
            label="Start"
            type="time"
            value={startTime}
            onChange={setStartTime}
            icon={Clock}
            required
          />
          <FormInput
            label="Ende"
            type="time"
            value={endTime}
            onChange={setEndTime}
            icon={Clock}
            required
          />
          <FormInput
            label="Event-Link"
            type="url"
            value={eventUrl}
            onChange={setEventUrl}
            placeholder="https://…"
            icon={Link2}
          />
        </div>

        <div>
          {sectionLabel('Vorbands')}
          <div className="flex gap-2">
            <div
              className="flex-1 flex items-center gap-2"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                padding: '0 14px'
              }}
            >
              <input
                type="text"
                value={newOpeningBand}
                onChange={(e) => setNewOpeningBand(e.target.value)}
                onKeyDown={handleOpeningKey}
                placeholder="Vorband hinzufügen"
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40"
                style={{
                  padding: '14px 0',
                  fontSize: 14.5,
                  fontWeight: 500,
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <button
              type="button"
              onClick={addOpeningBand}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: 48,
                borderRadius: 14,
                background: 'rgba(124,255,178,0.1)',
                border: '0.5px solid rgba(124,255,178,0.25)',
                color: 'var(--accent)'
              }}
              aria-label="Hinzufügen"
            >
              <Plus size={18} />
            </button>
          </div>
          {openingBands.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {openingBands.map((ob, i) => (
                <span
                  key={`${ob}-${i}`}
                  className="inline-flex items-center gap-1.5"
                  style={{
                    padding: '5px 6px 5px 10px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.06)',
                    border: '0.5px solid rgba(255,255,255,0.08)',
                    fontSize: 12.5
                  }}
                >
                  {ob}
                  <button
                    type="button"
                    onClick={() => removeOpeningBand(i)}
                    className="flex items-center justify-center cursor-pointer"
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: 'rgba(255,255,255,0.7)'
                    }}
                    aria-label="Entfernen"
                  >
                    <X size={9} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          {sectionLabel('Genres')}
          <div className="flex flex-col gap-3">
            {GENRE_GROUPS.map((group) => (
              <div key={group.label}>
                <div
                  className="uppercase font-semibold mb-1.5"
                  style={{
                    fontSize: 10,
                    letterSpacing: 0.6,
                    color: 'rgba(255,255,255,0.35)'
                  }}
                >
                  {group.label}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.keys.map((key) => {
                    const label = prettifyGenre(key)
                    const active = genres.some((g) => normalizeGenre(g) === key)
                    const grad = genreGradient(key)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleGenre(label)}
                        className="inline-flex items-center gap-1.5 cursor-pointer font-medium lowercase"
                        style={{
                          padding: '5px 11px',
                          borderRadius: 999,
                          background: active
                            ? 'rgba(124,255,178,0.1)'
                            : 'rgba(255,255,255,0.03)',
                          border: active
                            ? '0.5px solid rgba(124,255,178,0.35)'
                            : '0.5px solid rgba(255,255,255,0.08)',
                          color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                          fontSize: 12
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 999,
                            background: grad.a,
                            boxShadow: active ? `0 0 8px ${grad.a}` : 'none'
                          }}
                        />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          {genres.filter((g) => !isKnownGenre(g)).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {genres
                .filter((g) => !isKnownGenre(g))
                .map((g, i) => (
                  <span
                    key={`${g}-${i}`}
                    className="inline-flex items-center gap-1.5"
                    style={{
                      padding: '5px 6px 5px 10px',
                      borderRadius: 999,
                      background: 'rgba(199,125,255,0.08)',
                      border: '0.5px solid rgba(199,125,255,0.25)',
                      color: '#d7b3ff',
                      fontSize: 12
                    }}
                  >
                    {g}
                    <button
                      type="button"
                      onClick={() => toggleGenre(g)}
                      className="flex items-center justify-center cursor-pointer"
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.08)',
                        border: 'none',
                        color: 'rgba(255,255,255,0.7)'
                      }}
                      aria-label="Entfernen"
                    >
                      <X size={9} />
                    </button>
                  </span>
                ))}
            </div>
          )}
          <div className="flex gap-2 mt-2.5">
            <div
              className="flex-1 flex items-center gap-2"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                padding: '0 14px'
              }}
            >
              <input
                type="text"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                onKeyDown={handleCustomGenreKey}
                placeholder="Eigenes Genre"
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40"
                style={{
                  padding: '12px 0',
                  fontSize: 13.5,
                  fontWeight: 500,
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <button
              type="button"
              onClick={addCustomGenre}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: 48,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)'
              }}
              aria-label="Genre hinzufügen"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {error && (
          <p
            style={{
              color: '#ff7788',
              fontSize: 13,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(255,85,119,0.08)',
              border: '0.5px solid rgba(255,85,119,0.2)'
            }}
          >
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 font-semibold cursor-pointer"
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: '0.5px solid rgba(255,255,255,0.1)',
              fontSize: 14.5
            }}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 font-semibold cursor-pointer"
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              background: 'var(--accent)',
              color: '#0a1220',
              border: 'none',
              fontSize: 14.5,
              boxShadow: loading ? 'none' : '0 8px 24px var(--accent-glow)',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Lädt …' : concert ? 'Speichern' : 'Konzert erstellen'}
          </button>
        </div>
      </form>

      {concert && (
        <div
          className="mt-7 pt-5"
          style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}
        >
          <button
            type="button"
            onClick={() => setShowArchiveConfirm(true)}
            className="flex items-center justify-center gap-2 w-full cursor-pointer font-semibold"
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(255,85,119,0.06)',
              color: '#ff7788',
              border: '0.5px solid rgba(255,85,119,0.2)',
              fontSize: 13
            }}
          >
            <Trash2 size={14} />
            Konzert archivieren
          </button>

          <ArchiveConfirmModal
            isOpen={showArchiveConfirm}
            onClose={() => setShowArchiveConfirm(false)}
            onConfirm={async () => {
              setShowArchiveConfirm(false)
              await concertService.archive(concert.id!)
              onSuccess()
            }}
          />
        </div>
      )}
    </div>
  )
}
