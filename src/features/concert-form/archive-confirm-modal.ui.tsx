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
      <div className="flex flex-col gap-5">
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
          Möchtest du dieses Konzert wirklich archivieren? Es wird danach nicht
          mehr in der Liste angezeigt.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 font-semibold cursor-pointer"
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: '0.5px solid rgba(255,255,255,0.1)',
              fontSize: 14
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 font-semibold cursor-pointer"
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(255,85,119,0.15)',
              color: '#ff7788',
              border: '0.5px solid rgba(255,85,119,0.35)',
              fontSize: 14
            }}
          >
            Ja, archivieren
          </button>
        </div>
      </div>
    </Modal>
  )
}
