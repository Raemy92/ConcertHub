import './styles/main.css'

import { ReactNode } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation
} from 'react-router-dom'

import { OfflineStatus } from '@/shared/ui'
import { Archive } from '@/views/archive'
import { Home } from '@/views/home'
import { Login } from '@/views/login'
import { Register } from '@/views/register'
import { Settings } from '@/views/settings'
import { Statistics } from '@/views/statistics'

import { MainLayout } from './layouts/main-layout'
import { AuthProvider, useAuth } from './providers/auth.provider'

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div>Loading...</div>
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />

  return <>{children}</>
}

const App = () => {
  return (
    <AuthProvider>
      <OfflineStatus />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />}>
              <Route path="concert/:id" />
            </Route>
            <Route path="/archive" element={<Archive />}>
              <Route path="concert/:id" />
            </Route>
            <Route path="/settings" element={<Settings />} />
            <Route path="/stats" element={<Statistics />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
