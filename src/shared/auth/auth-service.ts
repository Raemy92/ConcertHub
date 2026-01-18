import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User as FirebaseUser
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

import { AuthCredentials } from '@/entities'
import { auth, db, googleProvider } from '@/shared/api/firebase/config'

const saveUser = async (user: FirebaseUser, displayName?: string) => {
  const userRef = doc(db, 'users', user.uid)
  await setDoc(
    userRef,
    {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName,
      photoURL: user.photoURL,
      lastLogin: Date.now()
    },
    { merge: true }
  )
}

export const authService = {
  async login({ email, password }: AuthCredentials) {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )
    await saveUser(userCredential.user)
    return userCredential
  },

  async register({ email, password, displayName }: AuthCredentials) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )
    await saveUser(userCredential.user, displayName)
    return userCredential
  },

  async loginWithGoogle() {
    const userCredential = await signInWithPopup(auth, googleProvider)
    await saveUser(userCredential.user)
    return userCredential
  },

  async logout() {
    return signOut(auth)
  }
}
