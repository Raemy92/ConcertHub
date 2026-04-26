import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging'
import { logger } from 'firebase-functions/v2'

import { NotificationPayload } from '../types'

interface TokenRef {
  uid: string
  tokenId: string
  token: string
}

const INVALID_TOKEN_ERRORS = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument'
])

const collectTokens = async (uids: string[]): Promise<TokenRef[]> => {
  const db = getFirestore()
  const results: TokenRef[] = []
  await Promise.all(
    uids.map(async (uid) => {
      const snap = await db
        .collection('users')
        .doc(uid)
        .collection('fcmTokens')
        .get()
      snap.forEach((doc) => {
        const token = doc.data().token as string | undefined
        if (token) results.push({ uid, tokenId: doc.id, token })
      })
    })
  )
  return results
}

export const sendToUsers = async (
  uids: string[],
  payload: NotificationPayload
): Promise<void> => {
  if (uids.length === 0) {
    logger.info('sendToUsers: no recipients, skipping')
    return
  }

  const refs = await collectTokens(uids)
  if (refs.length === 0) {
    logger.info('sendToUsers: no FCM tokens registered for recipients', {
      recipientCount: uids.length
    })
    return
  }

  // Data-only payload. The browser MUST NOT auto-display — our service
  // worker's onBackgroundMessage is the single source of truth. If we also
  // set a top-level `notification:` field, the FCM Web SDK would auto-show
  // one notification AND still call onBackgroundMessage, resulting in two
  // pop-ups for the same event.
  const message: MulticastMessage = {
    tokens: refs.map((r) => r.token),
    data: {
      title: payload.title,
      body: payload.body,
      concertId: payload.data.concertId
    },
    webpush: {
      fcmOptions: {
        link: `/concert/${payload.data.concertId}`
      }
    }
  }

  const response = await getMessaging().sendEachForMulticast(message)
  logger.info('sendToUsers: delivered', {
    success: response.successCount,
    failure: response.failureCount,
    tokenCount: refs.length
  })

  if (response.failureCount === 0) return

  const db = getFirestore()
  const deletions: Promise<unknown>[] = []
  response.responses.forEach((res, idx) => {
    if (res.success) return
    const ref = refs[idx]
    const code = res.error?.code ?? ''
    if (INVALID_TOKEN_ERRORS.has(code)) {
      logger.info('Pruning stale token', { uid: ref.uid, tokenId: ref.tokenId })
      deletions.push(
        db
          .collection('users')
          .doc(ref.uid)
          .collection('fcmTokens')
          .doc(ref.tokenId)
          .delete()
          .catch((err) =>
            logger.warn('Failed to prune stale token', {
              uid: ref.uid,
              tokenId: ref.tokenId,
              err
            })
          )
      )
    } else {
      logger.warn('Transient FCM error — not pruning token', {
        uid: ref.uid,
        tokenId: ref.tokenId,
        code,
        message: res.error?.message
      })
    }
  })

  await Promise.all(deletions)
}
