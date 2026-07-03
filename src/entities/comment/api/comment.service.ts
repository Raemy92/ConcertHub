import {
  addDoc,
  collection,
  CollectionReference,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc
} from 'firebase/firestore'

import { db } from '@/shared/api/firebase/config'

import { userService } from '../../user'
import { Comment } from '../model/types'

const COMMENTS_SUBCOLLECTION = 'comments'
const TEXT_MIN_LENGTH = 1
const TEXT_MAX_LENGTH = 2000

const getCommentsRef = (concertId: string): CollectionReference =>
  collection(db, 'concerts', concertId, COMMENTS_SUBCOLLECTION)

const normaliseText = (text: string): string => {
  const trimmed = text.trim()
  if (trimmed.length < TEXT_MIN_LENGTH) {
    throw new Error('Comment text must not be empty.')
  }
  if (trimmed.length > TEXT_MAX_LENGTH) {
    throw new Error(
      `Comment text must not exceed ${TEXT_MAX_LENGTH} characters.`
    )
  }
  return trimmed
}

interface CommentDocData {
  text: string
  authorId: string
  authorDisplayName: string
  createdAt: Timestamp | number
  updatedAt?: Timestamp | number
}

const toMillis = (v: Timestamp | number | undefined): number | undefined => {
  if (v === undefined) return undefined
  if (typeof v === 'number') return v
  if (v instanceof Timestamp) return v.toMillis()
  return undefined
}

interface PostInput {
  concertId: string
  authorId: string
  authorDisplayName?: string
  text: string
}

interface EditInput {
  concertId: string
  commentId: string
  text: string
}

export const commentService = {
  subscribeByConcert(
    concertId: string,
    callback: (comments: Comment[]) => void
  ): () => void {
    const q = query(getCommentsRef(concertId), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snapshot) => {
      const comments: Comment[] = snapshot.docs.map((d) => {
        const raw = d.data({ serverTimestamps: 'estimate' }) as CommentDocData
        return {
          id: d.id,
          text: raw.text,
          authorId: raw.authorId,
          authorDisplayName: raw.authorDisplayName,
          createdAt: toMillis(raw.createdAt) ?? 0,
          updatedAt: toMillis(raw.updatedAt)
        }
      })
      callback(comments)
    })
  },

  async post({
    concertId,
    authorId,
    authorDisplayName,
    text
  }: PostInput): Promise<void> {
    const cleanText = normaliseText(text)
    const displayName = await userService.resolveDisplayName(
      authorId,
      authorDisplayName
    )

    await addDoc(getCommentsRef(concertId), {
      text: cleanText,
      authorId,
      authorDisplayName: displayName,
      createdAt: serverTimestamp()
    })
  },

  async edit({ concertId, commentId, text }: EditInput): Promise<void> {
    const cleanText = normaliseText(text)
    await updateDoc(doc(getCommentsRef(concertId), commentId), {
      text: cleanText,
      updatedAt: serverTimestamp()
    })
  }
}

export const COMMENT_TEXT_MAX_LENGTH = TEXT_MAX_LENGTH
