export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL?: string | null
  createdAt: number
}

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
  date: string // ISO Format YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  price: number
  createdBy: string // User UID
  createdAt: number
  updatedAt: number
  isArchived: boolean
}
