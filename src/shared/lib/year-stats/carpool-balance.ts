import { Concert } from '@/entities/concert'
import { Participation } from '@/entities/participation'

export interface CarpoolBalance {
  drove: number
  rode: number
  seatsOffered: number
}

/**
 * The viewer's carpool involvement across attended concerts: times they drove,
 * times they rode with someone, and the total seats they offered as a driver.
 */
export const carpoolBalance = (
  attendedConcerts: Concert[],
  participations: Participation[],
  viewerUid: string
): CarpoolBalance => {
  const attendedIds = new Set(attendedConcerts.map((c) => c.id))
  const mine = participations.filter(
    (p) => p.userId === viewerUid && attendedIds.has(p.concertId)
  )

  let drove = 0
  let rode = 0
  let seatsOffered = 0
  for (const p of mine) {
    if (p.isDriver) {
      drove += 1
      seatsOffered += p.availableSeats ?? 0
    }
    if (p.driverId) rode += 1
  }
  return { drove, rode, seatsOffered }
}
