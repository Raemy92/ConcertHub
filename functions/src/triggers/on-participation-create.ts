import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v2'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'

import { sendToUsers } from '../lib/send-to-users'
import { ConcertDoc, ParticipationDoc, UserDoc } from '../types'

export const onParticipationCreate = onDocumentCreated(
  { document: 'participations/{participationId}', region: 'europe-west1' },
  async (event) => {
    const snap = event.data
    if (!snap) {
      logger.warn('onParticipationCreate fired without snapshot')
      return
    }

    const participation = snap.data() as ParticipationDoc
    const { concertId, userId: joinerId } = participation
    if (!concertId || !joinerId) {
      logger.warn('onParticipationCreate: missing concertId or userId', {
        participationId: event.params.participationId
      })
      return
    }

    const db = getFirestore()
    const concertSnap = await db.collection('concerts').doc(concertId).get()
    if (!concertSnap.exists) {
      logger.warn('onParticipationCreate: concert not found', { concertId })
      return
    }
    const concert = concertSnap.data() as ConcertDoc

    const coParticipantsSnap = await db
      .collection('participations')
      .where('concertId', '==', concertId)
      .get()

    const candidateUids = new Set<string>()
    if (concert.createdBy) candidateUids.add(concert.createdBy)
    coParticipantsSnap.docs.forEach((d) => {
      const uid = (d.data() as ParticipationDoc).userId
      if (uid) candidateUids.add(uid)
    })
    candidateUids.delete(joinerId)

    if (candidateUids.size === 0) {
      logger.info('onParticipationCreate: no candidates after exclusions', {
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
      if (data.notificationPrefs?.newParticipant === true) {
        recipients.push(docSnap.id)
      }
    })

    if (recipients.length === 0) {
      logger.info('onParticipationCreate: no opted-in recipients', {
        concertId
      })
      return
    }

    const joinerName = participation.displayName?.trim() || 'Jemand'

    await sendToUsers(recipients, {
      title: 'Neue Zusage',
      body: `${joinerName} kommt ans ${concert.band}-Konzert`,
      data: { concertId }
    })
  }
)
