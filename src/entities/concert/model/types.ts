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
