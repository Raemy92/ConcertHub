import { Modal } from '@/shared/ui'

interface ArchiveConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export const ArchiveConfirmModal = ({
  isOpen,
  onClose,
  onConfirm
}: ArchiveConfirmModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Konzert archivieren">
      <div className="flex flex-col gap-6">
        <p className="text-gray-400">
          Möchtest du dieses Konzert wirklich archivieren? Es wird danach nicht
          mehr in der Liste angezeigt.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl font-bold bg-gray-800 hover:bg-gray-700 text-white transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            Ja, archivieren
          </button>
        </div>
      </div>
    </Modal>
  )
}
