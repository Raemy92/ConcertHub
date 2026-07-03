import { Music, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert, concertService } from '@/entities/concert'
import { Participation, participationService } from '@/entities/participation'
import { SkeletonCard } from '@/shared/ui'
import { ConcertCard } from '@/widgets/concert-card'

type Filter = 'all' | 'participating' | 'created'
export type ConcertListVariant = 'upcoming' | 'past'

interface ConcertListProps {
  onEdit: (concert: Concert) => void
  refreshTrigger: number
  query: string
  onResetQuery: () => void
  variant?: ConcertListVariant
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'participating', label: 'Dabei' },
  { key: 'created', label: 'Erstellt' }
]

interface EmptyStateProps {
  variant: 'none' | 'no-results' | 'no-participation' | 'no-created' | 'no-past'
  onCreate?: () => void
  onReset?: () => void
}

const EmptyState = ({ variant, onCreate, onReset }: EmptyStateProps) => {
  const map = {
    none: {
      icon: Music,
      title: 'Noch keine Konzerte',
      body: 'Plane dein erstes Konzert.',
      action: onCreate
        ? { label: 'Konzert erstellen', onClick: onCreate }
        : undefined
    },
    'no-results': {
      icon: Search,
      title: 'Nichts gefunden',
      body: 'Versuche, die Filter zu lockern.',
      action: onReset
        ? { label: 'Filter zurücksetzen', onClick: onReset }
        : undefined
    },
    'no-participation': {
      icon: Music,
      title: 'Du bist noch nirgends dabei',
      body: 'Trete einem anstehenden Konzert bei.',
      action: undefined
    },
    'no-created': {
      icon: Music,
      title: 'Noch nichts erstellt',
      body: 'Erstelle dein erstes Konzert.',
      action: onCreate
        ? { label: 'Konzert erstellen', onClick: onCreate }
        : undefined
    },
    'no-past': {
      icon: Music,
      title: 'Keine vergangenen Konzerte',
      body: 'Sobald Konzerte vorbei sind, erscheinen sie hier.',
      action: undefined
    }
  }
  const e = map[variant]
  const Icon = e.icon
  return (
    <div
      className="flex flex-col items-center text-center gap-3.5"
      style={{ padding: '40px 24px' }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background:
            'linear-gradient(135deg, rgba(124,255,178,0.1), rgba(124,255,178,0.02))',
          border: '0.5px solid rgba(124,255,178,0.15)',
          color: 'var(--accent)'
        }}
      >
        <Icon size={26} />
      </div>
      <div>
        <div className="font-bold" style={{ fontSize: 17, marginBottom: 4 }}>
          {e.title}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
          {e.body}
        </div>
      </div>
      {e.action && (
        <button
          onClick={e.action.onClick}
          className="cursor-pointer font-semibold"
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            background: 'rgba(124,255,178,0.12)',
            color: 'var(--accent)',
            border: '0.5px solid rgba(124,255,178,0.3)',
            fontSize: 13
          }}
        >
          {e.action.label}
        </button>
      )}
    </div>
  )
}

interface ConcertListExtendedProps extends ConcertListProps {
  onCreate?: () => void
}

export const ConcertList = ({
  onEdit,
  refreshTrigger,
  query,
  onResetQuery,
  onCreate,
  variant = 'upcoming'
}: ConcertListExtendedProps) => {
  const { user } = useAuth()
  const [concerts, setConcerts] = useState<Concert[]>([])
  const [participatingConcertIds, setParticipatingConcertIds] = useState<
    Set<string>
  >(new Set())
  const [participationsByConcertId, setParticipationsByConcertId] = useState<
    Record<string, Participation[]>
  >({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const unsubscribesRef = useRef<Map<string, () => void>>(new Map())

  useEffect(() => {
    const fetchConcerts = async () => {
      setLoading(true)
      try {
        const data =
          variant === 'past'
            ? await concertService.getAllPast()
            : await concertService.getAllUpcoming()
        setConcerts(data)
      } catch (error) {
        console.error('Fehler beim Laden der Konzerte:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConcerts()
  }, [refreshTrigger, variant])

  useEffect(() => {
    if (!user) return
    return participationService.subscribeConcertIdsByUser(
      user.uid,
      setParticipatingConcertIds
    )
  }, [user])

  useEffect(() => {
    const subscriptions = unsubscribesRef.current
    const currentIds = new Set(
      concerts.map((c) => c.id).filter((id): id is string => !!id)
    )

    const staleIds = Array.from(subscriptions.keys()).filter(
      (id) => !currentIds.has(id)
    )
    for (const id of staleIds) {
      subscriptions.get(id)?.()
      subscriptions.delete(id)
    }
    if (staleIds.length > 0) {
      setParticipationsByConcertId((prev) => {
        const next: Record<string, Participation[]> = {}
        for (const key of Object.keys(prev)) {
          if (!staleIds.includes(key)) next[key] = prev[key]
        }
        return next
      })
    }

    for (const id of Array.from(currentIds)) {
      if (!subscriptions.has(id)) {
        const unsubscribe = participationService.subscribeByConcert(
          id,
          (parts) =>
            setParticipationsByConcertId((prev) => ({ ...prev, [id]: parts }))
        )
        subscriptions.set(id, unsubscribe)
      }
    }
  }, [concerts])

  useEffect(() => {
    const subscriptions = unsubscribesRef.current
    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe())
      subscriptions.clear()
    }
  }, [])

  const filteredConcerts = useMemo(() => {
    let list = concerts
    if (filter === 'participating') {
      list = list.filter((c) => c.id && participatingConcertIds.has(c.id))
    } else if (filter === 'created') {
      list = list.filter((c) => c.createdBy === user?.uid)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (c) =>
          c.band.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.openingBands.some((o) => o.toLowerCase().includes(q)) ||
          c.genres.some((g) => g.toLowerCase().includes(q))
      )
    }
    return list
  }, [concerts, filter, participatingConcertIds, user, query])

  if (loading) {
    return (
      <div className="px-4 flex flex-col gap-3.5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const isQueryActive = !!query.trim()

  return (
    <div>
      <div className="px-4 md:px-0 flex gap-1.5 mb-4 overflow-x-auto">
        {FILTERS.map(({ key, label }) => {
          const on = filter === key
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="cursor-pointer font-semibold whitespace-nowrap"
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                background: on
                  ? 'rgba(124,255,178,0.15)'
                  : 'rgba(255,255,255,0.04)',
                border: `0.5px solid ${
                  on ? 'rgba(124,255,178,0.4)' : 'rgba(255,255,255,0.1)'
                }`,
                color: on ? 'var(--accent)' : 'rgba(255,255,255,0.75)',
                fontSize: 12.5
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {concerts.length === 0 ? (
        <EmptyState
          variant={variant === 'past' ? 'no-past' : 'none'}
          onCreate={onCreate}
        />
      ) : filteredConcerts.length === 0 ? (
        <EmptyState
          variant={
            isQueryActive
              ? 'no-results'
              : filter === 'participating'
                ? 'no-participation'
                : filter === 'created'
                  ? 'no-created'
                  : 'no-results'
          }
          onCreate={onCreate}
          onReset={() => {
            setFilter('all')
            onResetQuery()
          }}
        />
      ) : (
        <div>
          <div className="px-4 flex flex-col gap-3.5 md:hidden">
            {filteredConcerts.map((concert) => (
              <ConcertCard
                key={concert.id}
                concert={concert}
                participations={
                  (concert.id && participationsByConcertId[concert.id]) || []
                }
                onEdit={onEdit}
              />
            ))}
          </div>
          <div className="hidden md:grid md:grid-cols-2 md:gap-4">
            {[0, 1].map((colIdx) => (
              <div key={colIdx} className="flex flex-col gap-4">
                {filteredConcerts
                  .filter((_, i) => i % 2 === colIdx)
                  .map((concert) => (
                    <ConcertCard
                      key={concert.id}
                      concert={concert}
                      participations={
                        (concert.id && participationsByConcertId[concert.id]) ||
                        []
                      }
                      onEdit={onEdit}
                    />
                  ))}
              </div>
            ))}
          </div>
          <div
            className="text-center pt-4 px-4 md:px-0"
            style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}
          >
            {filteredConcerts.length} Konzert
            {filteredConcerts.length !== 1 ? 'e' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
