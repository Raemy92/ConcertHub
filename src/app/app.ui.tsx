import './styles/main.css'

import { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Login } from '@/views/login'
import { Register } from '@/views/register'

import { AuthProvider, useAuth } from './providers/auth.provider'

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" />

  return <>{children}</>
}

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="p-8">
                  <h1 className="text-4xl font-bold">Dashboard</h1>
                  <p className="mt-4 text-gray-400">
                    Willkommen bei ConcertHub!
                  </p>
                  <button
                    onClick={() =>
                      import('@/shared/api/firebase/config').then((m) =>
                        m.auth.signOut()
                      )
                    }
                    className="mt-8 px-4 py-2 bg-red-600 rounded-lg"
                  >
                    Abmelden
                  </button>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
