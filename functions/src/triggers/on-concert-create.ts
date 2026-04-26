import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v2'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'

import { sendToUsers } from '../lib/send-to-users'
import { ConcertDoc } from '../types'

export const onConcertCreate = onDocumentCreated(
  { document: 'concerts/{concertId}', region: 'europe-west1' },
  async (event) => {
    const snap = event.data
    if (!snap) {
      logger.warn('onConcertCreate fired without snapshot')
      return
    }

    const concert = snap.data() as ConcertDoc
    const concertId = event.params.concertId

    const db = getFirestore()
    const usersSnap = await db
      .collection('users')
      .where('notificationPrefs.newConcert', '==', true)
      .get()

    const recipients = usersSnap.docs
      .map((d) => d.id)
      .filter((uid) => uid !== concert.createdBy)

    if (recipients.length === 0) {
      logger.info('onConcertCreate: no recipients after exclusions', {
        concertId
      })
      return
    }

    await sendToUsers(recipients, {
      title: 'Neues Konzert',
      body: `${concert.band} — ${concert.date}`,
      data: { concertId }
    })
  }
)
