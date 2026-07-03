import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Send,
  X
} from 'lucide-react'
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import {
  Comment,
  COMMENT_TEXT_MAX_LENGTH,
  commentService
} from '@/entities/comment'
import { Concert } from '@/entities/concert'
import { Participation } from '@/entities/participation'
import { colorForUserId } from '@/shared/ui'

interface ConcertCommentsProps {
  concert: Concert
  participations: Participation[]
}

const TEXTAREA_LINE_HEIGHT = 20
const TEXTAREA_MAX_LINES = 5
const TEXTAREA_VERTICAL_PADDING = 16

const formatTimestamp = (ms: number): string =>
  new Date(ms).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

const autoGrow = (el: HTMLTextAreaElement | null): void => {
  if (!el) return
  el.style.height = 'auto'
  const maxHeight =
    TEXTAREA_LINE_HEIGHT * TEXTAREA_MAX_LINES + TEXTAREA_VERTICAL_PADDING
  el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
}

const SkeletonBubble = ({ side }: { side: 'left' | 'right' }) => (
  <div
    className="flex"
    style={{ justifyContent: side === 'right' ? 'flex-end' : 'flex-start' }}
  >
    <div
      className="animate-pulse"
      style={{
        width: '60%',
        maxWidth: 260,
        height: 48,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.05)'
      }}
    />
  </div>
)

interface BubbleProps {
  comment: Comment
  isOwn: boolean
  isMenuOpen: boolean
  onOpenMenu: () => void
  onCloseMenu: () => void
  onStartEdit: () => void
}

const Bubble = ({
  comment,
  isOwn,
  isMenuOpen,
  onOpenMenu,
  onCloseMenu,
  onStartEdit
}: BubbleProps) => {
  const color = isOwn ? 'var(--accent)' : colorForUserId(comment.authorId)
  const align = isOwn ? 'flex-end' : 'flex-start'
  const background = isOwn ? 'rgba(124,255,178,0.12)' : 'rgba(255,255,255,0.04)'
  const border = `0.5px solid ${
    isOwn ? 'rgba(124,255,178,0.25)' : 'rgba(255,255,255,0.08)'
  }`

  return (
    <div
      className="flex flex-col"
      style={{ alignItems: align, gap: 2, maxWidth: '100%' }}
    >
      <div
        className="font-semibold uppercase"
        style={{
          fontSize: 10,
          letterSpacing: 0.6,
          color,
          padding: '0 4px'
        }}
      >
        {comment.authorDisplayName}
      </div>
      <div
        className="relative"
        style={{
          maxWidth: '85%',
          padding: '8px 12px',
          borderRadius: 14,
          background,
          border,
          color: '#fff',
          fontSize: 14,
          lineHeight: 1.35,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {comment.text}
        {isOwn && (
          <button
            type="button"
            onClick={isMenuOpen ? onCloseMenu : onOpenMenu}
            aria-label="Aktionen"
            className="absolute cursor-pointer flex items-center justify-center"
            style={{
              top: -8,
              right: -8,
              width: 22,
              height: 22,
              borderRadius: 999,
              background: 'rgba(10,18,32,0.85)',
              color: 'rgba(255,255,255,0.75)',
              border: '0.5px solid rgba(255,255,255,0.15)'
            }}
          >
            <MoreHorizontal size={12} />
          </button>
        )}
        {isOwn && isMenuOpen && (
          <div
            className="absolute"
            style={{
              top: 22,
              right: -8,
              zIndex: 5,
              background: 'rgba(22,26,46,0.98)',
              backdropFilter: 'blur(20px)',
              border: '0.5px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              padding: 4,
              minWidth: 132,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
            }}
          >
            <button
              type="button"
              onClick={onStartEdit}
              className="w-full flex items-center gap-2 cursor-pointer font-medium"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: 'transparent',
                color: '#fff',
                fontSize: 13,
                textAlign: 'left'
              }}
            >
              <Pencil size={13} />
              Bearbeiten
            </button>
          </div>
        )}
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.4)',
          padding: '0 4px'
        }}
      >
        {formatTimestamp(comment.createdAt)}
        {comment.updatedAt && ' · (bearbeitet)'}
      </div>
    </div>
  )
}

interface EditingBubbleProps {
  value: string
  onChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  busy: boolean
}

const EditingBubble = ({
  value,
  onChange,
  onSave,
  onCancel,
  busy
}: EditingBubbleProps) => {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    autoGrow(ref.current)
    ref.current?.focus()
  }, [])

  useEffect(() => {
    autoGrow(ref.current)
  }, [value])

  const trimmedLength = value.trim().length
  const canSave = trimmedLength > 0 && !busy

  return (
    <div
      className="flex flex-col gap-1.5"
      style={{ alignSelf: 'flex-end', width: '100%' }}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={COMMENT_TEXT_MAX_LENGTH}
        disabled={busy}
        rows={1}
        style={{
          width: '100%',
          resize: 'none',
          padding: '8px 12px',
          borderRadius: 14,
          background: 'rgba(124,255,178,0.08)',
          border: '0.5px solid rgba(124,255,178,0.35)',
          color: '#fff',
          fontSize: 14,
          lineHeight: `${TEXTAREA_LINE_HEIGHT}px`,
          fontFamily: 'inherit',
          outline: 'none'
        }}
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="cursor-pointer font-medium"
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.85)',
            border: '0.5px solid rgba(255,255,255,0.12)',
            fontSize: 12
          }}
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className={`font-semibold ${canSave ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            background: canSave ? 'var(--accent)' : 'rgba(124,255,178,0.25)',
            color: '#0a1220',
            border: 'none',
            fontSize: 12,
            opacity: canSave ? 1 : 0.6
          }}
        >
          Speichern
        </button>
      </div>
    </div>
  )
}

export const ConcertComments = ({
  concert,
  participations
}: ConcertCommentsProps) => {
  const { user } = useAuth()
  const concertId = concert.id

  const canComment =
    !!user &&
    (user.uid === concert.createdBy ||
      participations.some((p) => p.userId === user.uid))

  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loaded, setLoaded] = useState(false)
  const [input, setInput] = useState('')
  const [posting, setPosting] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const shouldScrollOnNextRender = useRef(false)

  useEffect(() => {
    if (!concertId) return
    const unsub = commentService.subscribeByConcert(concertId, (next) => {
      setComments(next)
      setLoaded(true)
    })
    return unsub
  }, [concertId])

  useEffect(() => {
    autoGrow(inputRef.current)
  }, [input])

  useEffect(() => {
    if (!shouldScrollOnNextRender.current) return
    shouldScrollOnNextRender.current = false
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [comments, expanded])

  if (!concertId) return null

  const trimmedInput = input.trim()
  const canPost =
    trimmedInput.length > 0 && !posting && Boolean(user) && canComment

  const submit = async () => {
    if (!user || !canPost) return
    setErrorMsg(null)
    setPosting(true)
    try {
      await commentService.post({
        concertId,
        authorId: user.uid,
        authorDisplayName: user.displayName,
        text: trimmedInput
      })
      setInput('')
      shouldScrollOnNextRender.current = true
    } catch (err) {
      console.error(err)
      setErrorMsg('Konnte den Kommentar nicht senden.')
    } finally {
      setPosting(false)
    }
  }

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    void submit()
  }

  const handleInputKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void submit()
    }
  }

  const startEdit = (c: Comment) => {
    if (!c.id) return
    setOpenMenuId(null)
    setEditingId(c.id)
    setEditingText(c.text)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingText('')
  }

  const saveEdit = async () => {
    if (!editingId) return
    const text = editingText.trim()
    if (!text || savingEdit) return
    setErrorMsg(null)
    setSavingEdit(true)
    try {
      await commentService.edit({ concertId, commentId: editingId, text })
      setEditingId(null)
      setEditingText('')
    } catch (err) {
      console.error(err)
      setErrorMsg('Konnte den Kommentar nicht speichern.')
    } finally {
      setSavingEdit(false)
    }
  }

  const toggleExpanded = () => {
    setOpenMenuId(null)
    setExpanded((v) => {
      const next = !v
      if (next) shouldScrollOnNextRender.current = true
      return next
    })
  }

  const Chevron = expanded ? ChevronUp : ChevronDown

  return (
    <section
      className="mx-4 mt-4"
      style={{
        borderRadius: 14,
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.08)'
      }}
    >
      <button
        type="button"
        onClick={toggleExpanded}
        className="w-full flex items-center gap-2.5 cursor-pointer text-left"
        style={{
          padding: '12px 14px',
          background: 'transparent',
          color: '#fff'
        }}
        aria-expanded={expanded}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.7)'
          }}
        >
          <MessageCircle size={14} />
        </div>
        <span className="font-semibold flex-1" style={{ fontSize: 13.5 }}>
          Kommentare
          <span
            style={{
              fontWeight: 600,
              color: 'rgba(255,255,255,0.45)',
              marginLeft: 8
            }}
          >
            · {comments.length}
          </span>
        </span>
        <Chevron size={16} color="rgba(255,255,255,0.55)" />
      </button>

      {expanded && (
        <div
          style={{
            borderTop: '0.5px solid rgba(255,255,255,0.08)',
            padding: '12px'
          }}
        >
          <div
            ref={listRef}
            className="flex flex-col gap-3"
            style={{
              maxHeight: 320,
              overflowY: 'auto',
              padding: '4px 4px 12px'
            }}
            onClick={() => openMenuId && setOpenMenuId(null)}
          >
            {!loaded ? (
              <>
                <SkeletonBubble side="left" />
                <SkeletonBubble side="right" />
              </>
            ) : comments.length === 0 ? (
              <div
                style={{
                  padding: 14,
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.55)',
                  textAlign: 'center'
                }}
              >
                Noch keine Kommentare.
              </div>
            ) : (
              comments.map((c) => {
                const isOwn = Boolean(user && c.authorId === user.uid)
                const isEditing = isOwn && editingId === c.id
                if (isEditing) {
                  return (
                    <EditingBubble
                      key={c.id}
                      value={editingText}
                      onChange={setEditingText}
                      onSave={() => void saveEdit()}
                      onCancel={cancelEdit}
                      busy={savingEdit}
                    />
                  )
                }
                return (
                  <Bubble
                    key={c.id}
                    comment={c}
                    isOwn={isOwn}
                    isMenuOpen={openMenuId === c.id}
                    onOpenMenu={() => setOpenMenuId(c.id ?? null)}
                    onCloseMenu={() => setOpenMenuId(null)}
                    onStartEdit={() => startEdit(c)}
                  />
                )
              })
            )}
          </div>

          {user && !canComment && (
            <div
              style={{
                marginTop: 8,
                padding: '10px 12px',
                fontSize: 12,
                color: 'rgba(255,255,255,0.55)',
                background: 'rgba(255,255,255,0.03)',
                border: '0.5px dashed rgba(255,255,255,0.12)',
                borderRadius: 12,
                textAlign: 'center'
              }}
            >
              Nur Teilnehmende können kommentieren.
            </div>
          )}

          {user && canComment && (
            <form
              onSubmit={handleFormSubmit}
              className="flex gap-2 items-end"
              style={{ paddingTop: 8 }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKey}
                placeholder="Schreib einen Kommentar…"
                maxLength={COMMENT_TEXT_MAX_LENGTH}
                rows={1}
                disabled={posting}
                style={{
                  flex: 1,
                  resize: 'none',
                  padding: '10px 12px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.04)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: 14,
                  lineHeight: `${TEXTAREA_LINE_HEIGHT}px`,
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!canPost}
                aria-label="Senden"
                className={canPost ? 'cursor-pointer' : 'cursor-not-allowed'}
                style={{
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: canPost
                    ? 'var(--accent)'
                    : 'rgba(124,255,178,0.2)',
                  color: '#0a1220',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: canPost ? 1 : 0.55
                }}
              >
                <Send size={16} />
              </button>
            </form>
          )}

          {errorMsg && (
            <div
              className="flex items-center gap-2"
              style={{
                marginTop: 8,
                padding: '8px 10px',
                fontSize: 12,
                color: '#ff7788',
                background: 'rgba(255,119,136,0.08)',
                border: '0.5px solid rgba(255,119,136,0.25)',
                borderRadius: 10
              }}
            >
              <X size={12} />
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
