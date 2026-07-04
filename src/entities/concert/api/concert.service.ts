import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore'

import { db } from '@/shared/api/firebase/config'

import { Concert } from '../model/types'

const CONCERTS_COLLECTION = 'concerts'

const getTodayDateString = (): string => new Date().toISOString().split('T')[0]

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

  async getAllPast(): Promise<Concert[]> {
    const q = query(
      collection(db, CONCERTS_COLLECTION),
      where('isArchived', '==', false),
      where('date', '<', getTodayDateString()),
      orderBy('date', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as Concert[]
  },

  // Whole collection, unfiltered — includes archived and future concerts.
  // Year / past filtering happens client-side in the year-stats aggregators.
  async getAll(): Promise<Concert[]> {
    const querySnapshot = await getDocs(collection(db, CONCERTS_COLLECTION))
    return querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as Concert[]
  },

  async getById(id: string): Promise<Concert | null> {
    const docRef = doc(db, CONCERTS_COLLECTION, id)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() } as Concert
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
  }
}
