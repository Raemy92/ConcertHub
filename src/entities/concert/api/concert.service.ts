import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore'

import { Concert, Participation } from '@/entities'
import { db } from '@/shared/api/firebase/config'

const CONCERTS_COLLECTION = 'concerts'
const PARTICIPATIONS_COLLECTION = 'participations'

const createParticipationId = (concertId: string, oderId: string): string =>
  `${concertId}_${oderId}`

const getParticipationRef = (
  concertId: string,
  userId: string
): DocumentReference =>
  doc(db, PARTICIPATIONS_COLLECTION, createParticipationId(concertId, userId))

const getTodayDateString = (): string => new Date().toISOString().split('T')[0]

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

export const concertService = {
  async getAllUpcoming(): Promise<Concert[]> {
    const q = query(
      collection(db, CONCERTS_COLLECTION),
      where('isArchived', '==', false),
      where('date', '>=', getTodayDateString()),
      orderBy('date', 'asc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as Concert[]
  },

  async create(
    concert: Omit<Concert, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'>
  ) {
    const now = Date.now()
    const newConcert = {
      ...concert,
      createdAt: now,
      updatedAt: now,
      isArchived: false
    }
    const docRef = await addDoc(collection(db, CONCERTS_COLLECTION), newConcert)
    return { id: docRef.id, ...newConcert }
  },

  async update(id: string, concert: Partial<Concert>) {
    const concertRef = doc(db, CONCERTS_COLLECTION, id)
    const updateData = {
      ...concert,
      updatedAt: Date.now()
    }
    await updateDoc(concertRef, updateData)
  },

  async archive(id: string) {
    const concertRef = doc(db, CONCERTS_COLLECTION, id)
    await updateDoc(concertRef, {
      isArchived: true,
      updatedAt: Date.now()
    })
  },

  async joinConcert(
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

  async leaveConcert(concertId: string, userId: string): Promise<void> {
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

  subscribeToParticipations(
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
          ).catch(() => {
            // TODO: Catch error logging
          })
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
  }
}
