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
  ticketPurchasedBy?: string
}
