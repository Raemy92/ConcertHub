import { LogOut, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert, concertService } from '@/entities/concert'
import { Participation, participationService } from '@/entities/participation'
import { authService } from '@/shared/auth/auth-service'
import { Avatar, Modal } from '@/shared/ui'
import { ConcertDetails } from '@/widgets/concert-details'
import { MainNav } from '@/widgets/main-nav'

export interface MainLayoutContext {
  query: string
  setQuery: (q: string) => void
}

export const MainLayout = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')

  const upcomingMatch = useMatch('/concert/:id')
  const archiveMatch = useMatch('/archive/concert/:id')
  const concertId = upcomingMatch?.params.id ?? archiveMatch?.params.id

  const [detailConcert, setDetailConcert] = useState<Concert | null>(null)
  const [detailParticipations, setDetailParticipations] = useState<
    Participation[]
  >([])
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    if (!concertId) {
      setDetailConcert(null)
      setDetailParticipations([])
      return
    }

    setDetailLoading(true)
    concertService
      .getById(concertId)
      .then((data) => setDetailConcert(data))
      .finally(() => setDetailLoading(false))

    return participationService.subscribeByConcert(
      concertId,
      setDetailParticipations
    )
  }, [concertId])

  const handleCloseDetail = () => {
    const base = archiveMatch ? '/archive' : '/'
    navigate(base, { replace: true })
  }

  const handleLogout = async () => {
    await authService.logout()
  }

  const greetingName = user?.displayName?.split(' ')[0] || 'Crew'

  return (
    <div className="min-h-screen text-white relative">
      <div
        className="sticky top-0 z-20"
        style={{
          background:
            'linear-gradient(180deg, rgba(4,6,18,0.95) 0%, rgba(4,6,18,0.7) 80%, rgba(4,6,18,0) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '20px 16px 14px'
        }}
      >
        <div className="max-w-5xl mx-auto px-0 md:px-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex items-end gap-2 flex-1 min-w-0">
              <h1
                className="font-semibold tracking-tighter leading-none text-white"
                style={{ fontSize: 22, letterSpacing: -0.8 }}
              >
                Concert
                <span
                  className="ml-1 font-semibold inline-flex items-center"
                  style={{
                    background: 'var(--accent)',
                    color: '#0a1220',
                    padding: '2px 6px',
                    borderRadius: 6
                  }}
                >
                  hub
                </span>
              </h1>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                {__APP_VERSION__}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center cursor-pointer"
              title="Abmelden"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '0.5px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)'
              }}
            >
              <LogOut size={16} />
            </button>
            <div title={user?.displayName || ''}>
              <Avatar
                name={user?.displayName || user?.email || 'You'}
                size={36}
              />
            </div>
          </div>

          <p
            className="mb-3"
            style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}
          >
            Willkommen zurück,{' '}
            <span className="text-white">{greetingName}</span>
          </p>

          <div
            className="flex items-center gap-2 mb-3"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '8px 12px'
            }}
          >
            <Search size={15} style={{ color: 'rgba(255,255,255,0.45)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Bands, Locations, Genres…"
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40"
              style={{ fontSize: 14, fontWeight: 500, fontFamily: 'inherit' }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="cursor-pointer text-white/50 hover:text-white text-xs px-2"
              >
                ×
              </button>
            )}
          </div>

          <MainNav />
        </div>
      </div>

      <main className="max-w-5xl mx-auto pb-32 px-0 md:px-4">
        <Outlet context={{ query, setQuery } satisfies MainLayoutContext} />
      </main>

      <Modal
        isOpen={!!concertId && !detailLoading && !!detailConcert}
        onClose={handleCloseDetail}
        title={detailConcert?.band || ''}
        variant="plain"
        key={location.pathname}
      >
        {detailConcert && (
          <ConcertDetails
            concert={detailConcert}
            participations={detailParticipations}
            onClose={handleCloseDetail}
          />
        )}
      </Modal>
    </div>
  )
}
