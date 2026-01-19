import { LogOut, Plus } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert } from '@/entities'
import { ConcertForm } from '@/features/concert-form'
import { authService } from '@/shared/auth/auth-service'
import { ConcertList } from '@/widgets/concert-list'

export const Home = () => {
  const { user } = useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingConcert, setEditingConcert] = useState<Concert | undefined>()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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

  console.log(user)

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white">
            CONCERT<span className="text-red-600">HUB</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Willkommen zurück, {user?.displayName}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Konzert erstellen
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            title="Abmelden"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {isFormOpen ? (
          <div className="mb-12">
            <ConcertForm
              concert={editingConcert}
              onSuccess={handleSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Anstehende Konzerte</h2>
            </div>
            <ConcertList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
          </div>
        )}
      </main>
    </div>
  )
}
