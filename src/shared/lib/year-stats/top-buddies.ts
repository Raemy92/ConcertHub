import { Concert } from '@/entities/concert'
import { Participation } from '@/entities/participation'

export interface Buddy {
  uid: string
  displayName: string
  count: number
  latestSharedDate: string
}

/**
 * Up to three other users ranked by the number of distinct attended concerts
 * they share with the viewer, descending. `participations` must be the
 * participations of *all* users (co-attendance cannot be derived from the
 * viewer's own rows). Ties break by later `latestSharedDate`, then display
 * name ascending. Returns `[]` on empty input.
 */
export const topBuddies = (
  attendedConcerts: Concert[],
  participations: Participation[],
  viewerUid: string
): Buddy[] => {
  if (attendedConcerts.length === 0) return []

  const dateById = new Map(attendedConcerts.map((c) => [c.id, c.date]))
  const attendedIds = new Set(attendedConcerts.map((c) => c.id))

  const buddies = new Map<string, Buddy>()
  for (const p of participations) {
    if (!attendedIds.has(p.concertId)) continue
    if (p.userId === viewerUid) continue

    const sharedDate = dateById.get(p.concertId) ?? ''
    const existing = buddies.get(p.userId)
    if (existing) {
      existing.count += 1
      if (sharedDate > existing.latestSharedDate) {
        existing.latestSharedDate = sharedDate
      }
      if (p.displayName) existing.displayName = p.displayName
    } else {
      buddies.set(p.userId, {
        uid: p.userId,
        displayName: p.displayName ?? '',
        count: 1,
        latestSharedDate: sharedDate
      })
    }
  }

  return Array.from(buddies.values())
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      if (a.latestSharedDate !== b.latestSharedDate)
        return a.latestSharedDate < b.latestSharedDate ? 1 : -1
      return a.displayName.localeCompare(b.displayName)
    })
    .slice(0, 3)
}
