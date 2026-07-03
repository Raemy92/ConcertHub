export interface NotificationPrefs {
  newConcert: boolean
  newParticipant: boolean
  newComment?: boolean
}

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  lastLogin?: number
  notificationPrefs?: NotificationPrefs
}
