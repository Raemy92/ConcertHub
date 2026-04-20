import { LogOut, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert, concertService } from '@/entities/concert'
import { Participation, participationService } from '@/entities/participation'
import { ConcertForm } from '@/features/concert-form'
import { authService } from '@/shared/auth/auth-service'
import { Avatar, Modal } from '@/shared/ui'
import { ConcertDetails } from '@/widgets/concert-details'
import { ConcertList } from '@/widgets/concert-list'

export const Home = () => {
  const { user } = useAuth()
  const { id: concertId } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingConcert, setEditingConcert] = useState<Concert | undefined>()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [query, setQuery] = useState('')

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
    navigate('/', { replace: true })
  }

  const handleCreateNew = () => {
    setEditingConcert(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (concert: Concert) => {
    setEditingConcert(concert)
    setIsFormOpen(true)
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setEditingConcert(undefined)
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleLogout = async () => {
    await authService.logout()
  }

  const greetingName = user?.displayName?.split(' ')[0] || 'Crew'
  const showFab = !concertId && !isFormOpen

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
        <div className="max-w-5xl mx-auto px-0 lg:px-4">
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
            className="flex items-center gap-2"
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
        <ConcertList
          onEdit={handleEdit}
          refreshTrigger={refreshTrigger}
          query={query}
          onResetQuery={() => setQuery('')}
          onCreate={handleCreateNew}
        />
      </main>

      {showFab && (
        <button
          onClick={handleCreateNew}
          aria-label="Konzert erstellen"
          className="fixed flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
          style={{
            bottom: 28,
            right: 'max(16px, calc((100vw - 1024px) / 2 + 16px))',
            zIndex: 30,
            width: 56,
            height: 56,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #8affc0, #5ee09a)',
            color: '#0a1220',
            border: 'none',
            boxShadow:
              '0 10px 28px rgba(124,255,178,0.35), 0 2px 6px rgba(0,0,0,0.3)'
          }}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
          editingConcert ? 'Konzert bearbeiten' : 'Neues Konzert erstellen'
        }
      >
        <ConcertForm
          concert={editingConcert}
          onSuccess={handleSuccess}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!concertId && !detailLoading && !!detailConcert}
        onClose={handleCloseDetail}
        title={detailConcert?.band || ''}
        variant="plain"
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
