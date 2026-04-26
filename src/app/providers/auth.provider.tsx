import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState
} from 'react'

import { NotificationPrefs } from '@/entities/user'
import { auth, db } from '@/shared/api/firebase/config'

export interface AppUser {
  uid: string
  email: string | null
  displayName: string
  photoURL: string | null
  notificationPrefs?: NotificationPrefs
}

interface AuthContextType {
  user: AppUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubUserDoc: (() => void) | undefined

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubUserDoc?.()
      unsubUserDoc = undefined

      if (!firebaseUser) {
        setUser(null)
        setLoading(false)
        return
      }

      let displayName = firebaseUser.displayName
      if (!displayName) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          displayName = userDoc.data().displayName
        }
      }

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName:
          displayName || firebaseUser.email || 'Unbekannter Benutzer',
        photoURL: firebaseUser.photoURL
      })
      setLoading(false)

      unsubUserDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
        if (!snap.exists()) return
        const data = snap.data()
        setUser((prev) =>
          prev
            ? {
                ...prev,
                notificationPrefs: data.notificationPrefs as
                  | NotificationPrefs
                  | undefined
              }
            : prev
        )
      })
    })

    return () => {
      unsubUserDoc?.()
      unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
