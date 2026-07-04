import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  DocumentReference,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore'

import { db } from '@/shared/api/firebase/config'

import { userService } from '../../user'
import { Participation } from '../model/types'

const PARTICIPATIONS_COLLECTION = 'participations'

const createParticipationId = (concertId: string, userId: string): string =>
  `${concertId}_${userId}`

const getParticipationRef = (
  concertId: string,
  userId: string
): DocumentReference =>
  doc(db, PARTICIPATIONS_COLLECTION, createParticipationId(concertId, userId))

export const participationService = {
  async join(
    participation: Omit<Participation, 'id' | 'joinedAt'>
  ): Promise<Participation> {
    const { concertId, userId } = participation
    const participationId = createParticipationId(concertId!, userId)
    const participationRef = getParticipationRef(concertId!, userId)

    const displayName = await userService.resolveDisplayName(
      userId,
      participation.displayName
    )

    const newParticipation = {
      ...participation,
      displayName,
      joinedAt: Date.now()
    }
    await setDoc(participationRef, newParticipation)
    return { id: participationId, ...newParticipation } as Participation
  },

  async leave(concertId: string, userId: string): Promise<void> {
    const participationRef = getParticipationRef(concertId, userId)

    const passengersQuery = query(
      collection(db, PARTICIPATIONS_COLLECTION),
      where('concertId', '==', concertId),
      where('driverId', '==', userId)
    )
    const passengersSnapshot = await getDocs(passengersQuery)
    const updates = passengersSnapshot.docs.map((d) =>
      updateDoc(doc(db, PARTICIPATIONS_COLLECTION, d.id), { driverId: null })
    )
    await Promise.all(updates)

    await deleteDoc(participationRef)
  },

  subscribeByConcert(
    concertId: string,
    callback: (participations: Participation[]) => void
  ): () => void {
    const q = query(
      collection(db, PARTICIPATIONS_COLLECTION),
      where('concertId', '==', concertId)
    )

    return onSnapshot(q, async (snapshot) => {
      const participations = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      })) as Participation[]

      const fixes = participations
        .filter((p) => !p.displayName || p.displayName.trim().length === 0)
        .map(async (p) => {
          const resolved = await userService.resolveDisplayName(p.userId)
          p.displayName = resolved
          updateDoc(
            doc(
              db,
              PARTICIPATIONS_COLLECTION,
              createParticipationId(concertId, p.userId)
            ),
            { displayName: resolved }
          ).catch(console.error)
        })

      if (fixes.length > 0) {
        await Promise.all(fixes)
      }

      callback(participations)
    })
  },

  // Promote an existing participation to driver in place — preserves hasTicket,
  // ticketPurchasedBy and everything else. Any previous passenger assignment is
  // cleared, since a driver can't also be someone else's passenger.
  async becomeDriver(
    concertId: string,
    userId: string,
    seats: number
  ): Promise<void> {
    const participationRef = getParticipationRef(concertId, userId)
    await updateDoc(participationRef, {
      isDriver: true,
      availableSeats: seats,
      driverId: null
    })
  },

  // Demote a driver back to a plain participant in place. Every passenger that
  // was assigned to this driver is released (driverId cleared); the driver's own
  // ticket and other fields are untouched.
  async stopDriving(concertId: string, userId: string): Promise<void> {
    const passengersQuery = query(
      collection(db, PARTICIPATIONS_COLLECTION),
      where('concertId', '==', concertId),
      where('driverId', '==', userId)
    )
    const passengersSnapshot = await getDocs(passengersQuery)

    const batch = writeBatch(db)
    passengersSnapshot.docs.forEach((d) =>
      batch.update(doc(db, PARTICIPATIONS_COLLECTION, d.id), { driverId: null })
    )
    batch.update(getParticipationRef(concertId, userId), {
      isDriver: false,
      availableSeats: deleteField()
    })
    await batch.commit()
  },

  async assignPassenger(
    concertId: string,
    driverId: string,
    passengerId: string
  ): Promise<void> {
    const participationRef = getParticipationRef(concertId, passengerId)
    await updateDoc(participationRef, { driverId })
  },

  async removePassenger(concertId: string, passengerId: string): Promise<void> {
    const participationRef = getParticipationRef(concertId, passengerId)
    await updateDoc(participationRef, { driverId: null })
  },

  // Toggling one's own ticket status always counts as a self-purchase, so any
  // foreign buyer link is cleared — "I have my ticket" means I got it myself.
  async updateTicketStatus(
    concertId: string,
    userId: string,
    hasTicket: boolean
  ): Promise<void> {
    const participationRef = getParticipationRef(concertId, userId)
    await updateDoc(participationRef, {
      hasTicket,
      ticketPurchasedBy: deleteField()
    })
  },

  // Buyer marks one or more existing participants as having a ticket they
  // purchased. Batched so the whole assignment lands atomically.
  async bulkAssignTickets(
    concertId: string,
    buyerUid: string,
    targetUids: string[]
  ): Promise<void> {
    if (targetUids.length === 0) return
    const batch = writeBatch(db)
    targetUids.forEach((uid) => {
      batch.set(
        getParticipationRef(concertId, uid),
        { hasTicket: true, ticketPurchasedBy: buyerUid },
        { merge: true }
      )
    })
    await batch.commit()
  },

  // Whole collection, every user — the co-attendance source for year-stats
  // "Top 3 Buddies". Read rule permits it (participations is read: if isSignedIn()).
  async getAll(): Promise<Participation[]> {
    const querySnapshot = await getDocs(
      collection(db, PARTICIPATIONS_COLLECTION)
    )
    return querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as Participation[]
  },

  subscribeConcertIdsByUser(
    userId: string,
    callback: (concertIds: Set<string>) => void
  ): () => void {
    const q = query(
      collection(db, PARTICIPATIONS_COLLECTION),
      where('userId', '==', userId)
    )
    return onSnapshot(q, (snapshot) => {
      const ids = new Set(
        snapshot.docs
          .map((d) => d.data().concertId as string | undefined)
          .filter(Boolean) as string[]
      )
      callback(ids)
    })
  }
}
