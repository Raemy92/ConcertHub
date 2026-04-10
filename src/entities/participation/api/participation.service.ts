import {
  collection,
  deleteDoc,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore'

import { db } from '@/shared/api/firebase/config'

import { Participation } from '../model/types'

const PARTICIPATIONS_COLLECTION = 'participations'

const createParticipationId = (concertId: string, userId: string): string =>
  `${concertId}_${userId}`

const getParticipationRef = (
  concertId: string,
  userId: string
): DocumentReference =>
  doc(db, PARTICIPATIONS_COLLECTION, createParticipationId(concertId, userId))

const resolveUserDisplayName = async (
  userId: string,
  fallback?: string
): Promise<string> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    const displayName = userDoc.exists()
      ? (userDoc.data().displayName as string | undefined)
      : undefined

    return displayName?.trim() || fallback?.trim() || 'Unbekannter Benutzer'
  } catch {
    return fallback?.trim() || 'Unbekannter Benutzer'
  }
}

export const participationService = {
  async join(
    participation: Omit<Participation, 'id' | 'joinedAt'>
  ): Promise<Participation> {
    const { concertId, userId } = participation
    const participationId = createParticipationId(concertId!, userId)
    const participationRef = getParticipationRef(concertId!, userId)

    const displayName = await resolveUserDisplayName(
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
          const resolved = await resolveUserDisplayName(p.userId)
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

  async updateTicketStatus(
    concertId: string,
    userId: string,
    hasTicket: boolean
  ): Promise<void> {
    const participationRef = getParticipationRef(concertId, userId)
    await updateDoc(participationRef, { hasTicket })
  }
}
