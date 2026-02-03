export interface AuthCredentials {
  email: string
  password: string
  displayName?: string
}

export interface Concert {
  id?: string
  band: string
  openingBands: string[]
  genres: string[]
  location: string
  date: string
  startTime: string
  endTime: string
  doors: string
  eventUrl?: string
  price: number
  createdBy: string
  createdAt: number
  updatedAt: number
  isArchived: boolean
}

export interface Participation {
  id?: string
  concertId?: string
  userId: string
  displayName?: string
  isDriver: boolean
  availableSeats?: number
  driverId?: string
  joinedAt: number
  hasTicket?: boolean
}
