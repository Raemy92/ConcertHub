import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v2'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'

import { sendToUsers } from '../lib/send-to-users'
import { ConcertDoc, ParticipationDoc, UserDoc } from '../types'

interface CommentDoc {
  text?: string
  authorId?: string
  authorDisplayName?: string
  createdAt?: number
  updatedAt?: number
}

const EXCERPT_MAX_LENGTH = 80

const excerpt = (text: string): string =>
  text.length <= EXCERPT_MAX_LENGTH
    ? text
    : `${text.slice(0, EXCERPT_MAX_LENGTH)}…`

export const onCommentCreate = onDocumentCreated(
  {
    document: 'concerts/{concertId}/comments/{commentId}',
    region: 'europe-west1'
  },
  async (event) => {
    const snap = event.data
    if (!snap) {
      logger.warn('onCommentCreate fired without snapshot')
      return
    }

    const comment = snap.data() as CommentDoc
    const concertId = event.params.concertId
    const { authorId, text, authorDisplayName } = comment

    if (!authorId || !text) {
      logger.warn('onCommentCreate: missing authorId or text', {
        commentId: event.params.commentId
      })
      return
    }

    const db = getFirestore()

    const concertSnap = await db.collection('concerts').doc(concertId).get()
    if (!concertSnap.exists) {
      logger.warn('onCommentCreate: concert not found', { concertId })
      return
    }
    const concert = concertSnap.data() as ConcertDoc

    const participantsSnap = await db
      .collection('participations')
      .where('concertId', '==', concertId)
      .get()

    const candidateUids = new Set<string>()
    if (concert.createdBy) candidateUids.add(concert.createdBy)
    participantsSnap.docs.forEach((d) => {
      const uid = (d.data() as ParticipationDoc).userId
      if (uid) candidateUids.add(uid)
    })
    candidateUids.delete(authorId)

    if (candidateUids.size === 0) {
      logger.info('onCommentCreate: no candidates after exclusions', {
        concertId
      })
      return
    }

    const userDocs = await Promise.all(
      Array.from(candidateUids).map((uid) =>
        db.collection('users').doc(uid).get()
      )
    )

    const recipients: string[] = []
    userDocs.forEach((docSnap) => {
      if (!docSnap.exists) return
      const data = docSnap.data() as UserDoc
      if (data.notificationPrefs?.newComment === true) {
        recipients.push(docSnap.id)
      }
    })

    if (recipients.length === 0) {
      logger.info('onCommentCreate: no opted-in recipients', { concertId })
      return
    }

    const authorName = authorDisplayName?.trim() || 'Jemand'

    await sendToUsers(recipients, {
      title: 'Neuer Kommentar',
      body: `${authorName} (${concert.band}): ${excerpt(text)}`,
      data: { concertId }
    })
  }
)
