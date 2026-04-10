import { LogOut, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert, concertService } from '@/entities/concert'
import { Participation, participationService } from '@/entities/participation'
import { ConcertForm } from '@/features/concert-form'
import { authService } from '@/shared/auth/auth-service'
import { Modal } from '@/shared/ui'
import { ConcertDetails } from '@/widgets/concert-details'
import { ConcertList } from '@/widgets/concert-list'

export const Home = () => {
  const { user } = useAuth()
  const { id: concertId } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingConcert, setEditingConcert] = useState<Concert | undefined>()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div>
          <div className="flex gap-2 items-end">
            <h1 className="text-4xl font-semibold tracking-tighter leading-none text-white">
              Concert
              <span className="ml-2 font-semibold inline-flex items-center rounded-md bg-red-600 px-1.5 py-0.5">
                <span className="text-black">hub</span>
              </span>
            </h1>
            <span className="text-gray-600 text-xs">{__APP_VERSION__}</span>
          </div>

          <p className="text-gray-400 text-sm mt-2">
            Willkommen zurück, {user?.displayName}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
          title="Abmelden"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Anstehende Konzerte</h2>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Konzert erstellen</span>
          </button>
        </div>
        <ConcertList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
      </main>

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
      >
        {detailConcert && (
          <ConcertDetails
            concert={detailConcert}
            participations={detailParticipations}
          />
        )}
      </Modal>
    </div>
  )
}
