export interface NotificationPrefs {
  newConcert: boolean
  newParticipant: boolean
}

export interface NotificationPayload {
  title: string
  body: string
  data: {
    concertId: string
  }
}

export interface ConcertDoc {
  band: string
  openingBands?: string[]
  genres?: string[]
  location: string
  date: string
  startTime?: string
  endTime?: string
  doors?: string
  eventUrl?: string
  price?: number
  createdBy: string
  createdAt: number
  updatedAt: number
  isArchived: boolean
}

export interface ParticipationDoc {
  concertId: string
  userId: string
  displayName?: string
  isDriver?: boolean
  availableSeats?: number
  driverId?: string | null
  joinedAt: number
  hasTicket?: boolean
}

export interface UserDoc {
  uid?: string
  email?: string | null
  displayName?: string | null
  photoURL?: string | null
  notificationPrefs?: NotificationPrefs
}
