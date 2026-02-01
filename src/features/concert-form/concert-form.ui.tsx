import {
  Calendar,
  Clock,
  Coins,
  MapPin,
  Music,
  Plus,
  Trash2,
  X
} from 'lucide-react'
import { FormEvent, useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert } from '@/entities'
import { concertService } from '@/entities/concert'

interface ConcertFormProps {
  concert?: Concert
  onSuccess: () => void
  onCancel: () => void
}

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
  const [newGenre, setNewGenre] = useState('')
  const [location, setLocation] = useState(concert?.location || '')
  const [date, setDate] = useState(concert?.date || '')
  const [startTime, setStartTime] = useState(concert?.startTime || '')
  const [endTime, setEndTime] = useState(concert?.endTime || '')
  const [price, setPrice] = useState(concert?.price?.toString() || '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (newOpeningBand.trim()) {
      setOpeningBands([...openingBands, newOpeningBand.trim()])
      setNewOpeningBand('')
    }
  }

  const removeOpeningBand = (index: number) => {
    setOpeningBands(openingBands.filter((_, i) => i !== index))
  }

  const addGenre = () => {
    if (newGenre.trim()) {
      setGenres([...genres, newGenre.trim()])
      setNewGenre('')
    }
  }

  const removeGenre = (index: number) => {
    setGenres(genres.filter((_, i) => i !== index))
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">
              Haupt-Band
            </label>
            <div className="relative">
              <Music className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                required
                type="text"
                value={band}
                onChange={(e) => setBand(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-9 pr-2 text-white focus:ring-2 focus:ring-red-600 outline-none"
                placeholder="Band Name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Ort</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                required
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-9 pr-2 text-white focus:ring-2 focus:ring-red-600 outline-none"
                placeholder="Veranstaltungsort"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Datum</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-9 pr-2 text-white focus:ring-2 focus:ring-red-600 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">
              Preis (CHF)
            </label>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                required
                type="number"
                step="0.05"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-9 pr-2 text-white focus:ring-2 focus:ring-red-600 outline-none"
                placeholder="69.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">
              Startzeit
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                required
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-9 pr-2 text-white focus:ring-2 focus:ring-red-600 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Endzeit</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                required
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-9 pr-2 text-white focus:ring-2 focus:ring-red-600 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Vorbands</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newOpeningBand}
              onChange={(e) => setNewOpeningBand(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-red-600 outline-none"
              placeholder="Vorband hinzufügen"
            />
            <button
              type="button"
              onClick={addOpeningBand}
              className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {openingBands.map((ob, i) => (
              <span
                key={i}
                className="flex items-center gap-1 bg-gray-700 text-white px-3 py-1 rounded-full text-sm"
              >
                {ob}
                <button type="button" onClick={() => removeOpeningBand(i)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Genres</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-red-600 outline-none"
              placeholder="Genre hinzufügen"
            />
            <button
              type="button"
              onClick={addGenre}
              className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {genres.map((g, i) => (
              <span
                key={i}
                className="flex items-center gap-1 bg-red-900/50 text-red-200 border border-red-800 px-3 py-1 rounded-full text-sm"
              >
                {g}
                <button type="button" onClick={() => removeGenre(i)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Lädt...' : concert ? 'Speichern' : 'Konzert erstellen'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </form>

      {concert && (
        <div className="mt-8 pt-6 border-t border-gray-800">
          <button
            type="button"
            onClick={async () => {
              if (confirm('Möchtest du dieses Konzert wirklich löschen?')) {
                await concertService.archive(concert.id!)
                onSuccess()
              }
            }}
            className="flex items-center justify-center gap-2 text-red-500 hover:text-red-400 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Konzert archivieren (löschen)
          </button>
        </div>
      )}
    </div>
  )
}
