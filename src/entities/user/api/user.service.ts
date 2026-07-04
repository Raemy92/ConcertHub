import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'

import { db } from '@/shared/api/firebase/config'

import { NotificationPrefs, User } from '../model/types'

const USERS_COLLECTION = 'users'

const UNKNOWN_USER_NAME = 'Unbekannter Benutzer'

export const userService = {
  async getById(uid: string): Promise<User | null> {
    const snap = await getDoc(doc(db, USERS_COLLECTION, uid))
    if (!snap.exists()) return null
    return { uid: snap.id, ...snap.data() } as User
  },

  subscribe(uid: string, callback: (user: User | null) => void): () => void {
    return onSnapshot(doc(db, USERS_COLLECTION, uid), (snap) => {
      if (!snap.exists()) {
        callback(null)
        return
      }
      callback({ uid: snap.id, ...snap.data() } as User)
    })
  },

  async updateNotificationPrefs(
    uid: string,
    prefs: NotificationPrefs
  ): Promise<void> {
    await setDoc(
      doc(db, USERS_COLLECTION, uid),
      { notificationPrefs: prefs },
      { merge: true }
    )
  },

  async resolveDisplayName(uid: string, fallback?: string): Promise<string> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid))
      const displayName = userDoc.exists()
        ? (userDoc.data().displayName as string | undefined)
        : undefined

      return displayName?.trim() || fallback?.trim() || UNKNOWN_USER_NAME
    } catch {
      return fallback?.trim() || UNKNOWN_USER_NAME
    }
  }
}
