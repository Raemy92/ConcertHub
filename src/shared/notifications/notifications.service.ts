import { deleteDoc, doc, setDoc } from 'firebase/firestore'
import {
  deleteToken,
  getToken,
  MessagePayload,
  onMessage
} from 'firebase/messaging'

import { db } from '@/shared/api/firebase/config'
import { getMessagingInstance } from '@/shared/api/firebase/messaging'

const TOKEN_ID_STORAGE_KEY = 'ch:fcm:tokenId'

const getOrCreateTokenId = (): string => {
  let id = localStorage.getItem(TOKEN_ID_STORAGE_KEY)
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`
    localStorage.setItem(TOKEN_ID_STORAGE_KEY, id)
  }
  return id
}

export const isNotificationsSupported = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window)) return false
  if (!('serviceWorker' in navigator)) return false
  const messaging = await getMessagingInstance()
  return messaging !== null
}

export const getCurrentPermission = ():
  | NotificationPermission
  | 'unsupported' => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

export const requestPermissionAndRegister = async (
  uid: string
): Promise<string | null> => {
  const messaging = await getMessagingInstance()
  if (!messaging) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const registration = await navigator.serviceWorker.ready

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) {
    console.error(
      'VITE_FIREBASE_VAPID_KEY is not set — cannot register for push'
    )
    return null
  }

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration
  })

  if (!token) return null

  const tokenId = getOrCreateTokenId()
  await setDoc(
    doc(db, 'users', uid, 'fcmTokens', tokenId),
    {
      token,
      userAgent: navigator.userAgent,
      createdAt: Date.now(),
      lastSeenAt: Date.now()
    },
    { merge: true }
  )

  return token
}

export const unregisterCurrentDevice = async (uid: string): Promise<void> => {
  const messaging = await getMessagingInstance()
  const tokenId = localStorage.getItem(TOKEN_ID_STORAGE_KEY)

  if (messaging) {
    try {
      await deleteToken(messaging)
    } catch (err) {
      console.warn('FCM deleteToken failed:', err)
    }
  }

  if (tokenId) {
    try {
      await deleteDoc(doc(db, 'users', uid, 'fcmTokens', tokenId))
    } catch (err) {
      console.warn('Firestore token delete failed:', err)
    }
    localStorage.removeItem(TOKEN_ID_STORAGE_KEY)
  }
}

export const onForegroundMessage = (
  callback: (payload: MessagePayload) => void
): (() => void) => {
  let unsubscribe = () => {}
  getMessagingInstance().then((messaging) => {
    if (!messaging) return
    unsubscribe = onMessage(messaging, callback)
  })
  return () => unsubscribe()
}
