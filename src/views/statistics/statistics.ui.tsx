import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert, concertService } from '@/entities/concert'
import { Participation, participationService } from '@/entities/participation'
import { availableYears, computeYearStats } from '@/shared/lib/year-stats'
import { YearStatistics } from '@/widgets/year-statistics'

import { YearSelector } from './year-selector.ui'

const currentYear = new Date().getFullYear()

export const Statistics = () => {
  const { user } = useAuth()
  const viewerUid = user?.uid ?? ''

  const [concerts, setConcerts] = useState<Concert[]>([])
  const [participations, setParticipations] = useState<Participation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedYear, setSelectedYear] = useState(currentYear)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    Promise.all([concertService.getAll(), participationService.getAll()])
      .then(([allConcerts, allParticipations]) => {
        if (!active) return
        setConcerts(allConcerts)
        setParticipations(allParticipations)
      })
      .catch((e) => {
        console.error(e)
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const years = useMemo(
    () => availableYears(concerts, participations, viewerUid),
    [concerts, participations, viewerUid]
  )

  const stats = useMemo(
    () => computeYearStats(concerts, participations, viewerUid, selectedYear),
    [concerts, participations, viewerUid, selectedYear]
  )

  return (
    <div
      className="mx-auto"
      style={{ maxWidth: 720, padding: '8px 16px 80px' }}
    >
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 20, gap: 12 }}
      >
        <h1
          className="text-white font-semibold tracking-tight"
          style={{ fontSize: 24, letterSpacing: -0.6 }}
        >
          Statistik
        </h1>
        <YearSelector
          value={selectedYear}
          onChange={setSelectedYear}
          options={years}
        />
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Lädt…</p>
      ) : error ? (
        <p style={{ fontSize: 13, color: '#ff7788' }}>
          Statistik konnte nicht geladen werden.
        </p>
      ) : stats.total === 0 ? (
        <EmptyState year={selectedYear} />
      ) : (
        <YearStatistics stats={stats} />
      )}
    </div>
  )
}

const EmptyState = ({ year }: { year: number }) => (
  <div
    className="flex flex-col items-center text-center"
    style={{
      padding: '48px 24px',
      borderRadius: 16,
      background: 'rgba(255,255,255,0.03)',
      border: '0.5px solid rgba(255,255,255,0.08)',
      gap: 16
    }}
  >
    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)' }}>
      Noch keine besuchten Konzerte in {year}.
    </p>
    <Link
      to="/"
      className="font-semibold"
      style={{
        fontSize: 13,
        padding: '9px 16px',
        borderRadius: 10,
        background: 'var(--accent)',
        color: '#0a1220',
        textDecoration: 'none'
      }}
    >
      Konzerte entdecken
    </Link>
  </div>
)
