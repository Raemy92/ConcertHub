import { X } from 'lucide-react'
import { ReactNode, useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  variant?: 'default' | 'sheet' | 'plain'
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  variant = 'default'
}: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return

    const body = document.body
    const html = document.documentElement
    const prevBodyOverflow = body.style.overflow
    const prevHtmlOverflow = html.style.overflow
    body.style.overflow = 'hidden'
    html.style.overflow = 'hidden'

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)

    return () => {
      body.style.overflow = prevBodyOverflow
      html.style.overflow = prevHtmlOverflow
      window.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isSheet = variant === 'sheet'
  const isPlain = variant === 'plain'

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex p-0 sm:p-4 animate-fade-in ${
        isSheet
          ? 'items-end sm:items-center justify-center'
          : 'items-stretch sm:items-center justify-center'
      }`}
      style={{
        background: 'rgba(4,6,18,0.65)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex flex-col w-full overflow-hidden text-white animate-slide-up ${
          isSheet
            ? 'max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[90vh]'
            : 'max-w-2xl sm:rounded-3xl max-h-screen sm:max-h-[92vh] h-full sm:h-auto'
        }`}
        style={{
          background: 'rgba(14,18,36,0.92)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.55)'
        }}
      >
        {!isPlain && (
          <div
            className="flex items-center justify-between px-5 sm:px-6"
            style={{
              padding: '14px 20px 12px',
              borderBottom: '0.5px solid rgba(255,255,255,0.06)'
            }}
          >
            <h2
              className="font-bold text-white truncate pr-4"
              style={{ fontSize: 17, letterSpacing: -0.3 }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center transition-colors"
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                border: '0.5px solid rgba(255,255,255,0.1)'
              }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  )
}
