import { Modal } from '@/shared/ui'

interface LeaveConfirmModalProps {
  isOpen: boolean
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

export const LeaveConfirmModal = ({
  isOpen,
  loading,
  onClose,
  onConfirm
}: LeaveConfirmModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Abmeldung">
      <div className="flex flex-col gap-6">
        <p className="text-gray-400">
          Möchtest du dich wirklich von diesem Konzert abmelden?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl font-bold bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition-colors"
          >
            {loading ? 'Wird gespeichert...' : 'Ja, abmelden'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
