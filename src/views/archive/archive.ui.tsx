import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import { MainLayoutContext } from '@/app/layouts/main-layout'
import { Concert } from '@/entities/concert'
import { ConcertForm } from '@/features/concert-form'
import { Modal } from '@/shared/ui'
import { ConcertList } from '@/widgets/concert-list'

export const Archive = () => {
  const { query, setQuery } = useOutletContext<MainLayoutContext>()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingConcert, setEditingConcert] = useState<Concert | undefined>()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleEdit = (concert: Concert) => {
    setEditingConcert(concert)
    setIsFormOpen(true)
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setEditingConcert(undefined)
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <>
      <ConcertList
        variant="past"
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        query={query}
        onResetQuery={() => setQuery('')}
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Konzert bearbeiten"
      >
        <ConcertForm
          concert={editingConcert}
          onSuccess={handleSuccess}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>
    </>
  )
}
