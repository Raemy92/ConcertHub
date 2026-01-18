export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL?: string | null
  createdAt: number
}

export interface AuthCredentials {
  email: string
  password: string
  displayName?: string
}
