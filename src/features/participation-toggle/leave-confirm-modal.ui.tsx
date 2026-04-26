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
      <div className="flex flex-col gap-5">
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
          Möchtest du dich wirklich von diesem Konzert abmelden?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 font-semibold cursor-pointer"
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: '0.5px solid rgba(255,255,255,0.1)',
              fontSize: 14,
              opacity: loading ? 0.5 : 1
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 font-semibold cursor-pointer"
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(255,85,119,0.15)',
              color: '#ff7788',
              border: '0.5px solid rgba(255,85,119,0.35)',
              fontSize: 14,
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Wird gespeichert …' : 'Ja, abmelden'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
