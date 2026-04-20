import { Menu, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert, concertService } from '@/entities/concert'
import { Participation, participationService } from '@/entities/participation'
import { ConcertForm } from '@/features/concert-form'
import { Modal } from '@/shared/ui'
import { AppSidebar } from '@/widgets/app-sidebar'
import { ConcertDetails } from '@/widgets/concert-details'
import { MobileNavDrawer } from '@/widgets/mobile-nav-drawer'

export interface MainLayoutContext {
  query: string
  setQuery: (q: string) => void
  openCreate: () => void
  openEdit: (concert: Concert) => void
  refreshTrigger: number
}

export const MainLayout = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [navOpen, setNavOpen] = useState(false)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingConcert, setEditingConcert] = useState<Concert | undefined>()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const openCreate = () => {
    setEditingConcert(undefined)
    setIsFormOpen(true)
  }

  const openEdit = (concert: Concert) => {
    setEditingConcert(concert)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingConcert(undefined)
    setRefreshTrigger((prev) => prev + 1)
  }

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

  const greetingName = user?.displayName?.split(' ')[0] || 'Crew'

  return (
    <div className="min-h-screen text-white relative md:flex">
      <AppSidebar onCreate={openCreate} />

      <div className="flex-1 min-w-0 md:h-screen md:overflow-y-auto">
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
          <div className="max-w-5xl mx-auto px-0 xl:px-4">
            <div className="flex items-center gap-2.5 mb-3 md:hidden">
              <button
                onClick={() => setNavOpen(true)}
                aria-label="Menü öffnen"
                aria-haspopup="dialog"
                aria-expanded={navOpen}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)'
                }}
              >
                <Menu size={18} />
              </button>
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
          </div>
        </div>

        <main className="max-w-5xl mx-auto pb-32 px-0 md:px-4">
          <Outlet
            context={
              {
                query,
                setQuery,
                openCreate,
                openEdit,
                refreshTrigger
              } satisfies MainLayoutContext
            }
          />
        </main>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
          editingConcert ? 'Konzert bearbeiten' : 'Neues Konzert erstellen'
        }
      >
        <ConcertForm
          concert={editingConcert}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

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

      <MobileNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />
    </div>
  )
}
