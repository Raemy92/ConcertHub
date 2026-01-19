import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore'

import { Concert } from '@/entities'
import { db } from '@/shared/api/firebase/config'

const CONCERTS_COLLECTION = 'concerts'

export const concertService = {
  async getAllUpcoming() {
    const today = new Date().toISOString().split('T')[0]
    const q = query(
      collection(db, CONCERTS_COLLECTION),
      where('isArchived', '==', false),
      where('date', '>=', today),
      orderBy('date', 'asc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
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
    return { id: docRef.id, ...newConcert } as Concert
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
