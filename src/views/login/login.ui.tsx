import { useLocation, useNavigate } from 'react-router-dom'

import { LoginForm } from '@/features/login-form'

export const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || '/'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <LoginForm
        onSuccess={() => navigate(from, { replace: true })}
        onSwitchToRegister={() => navigate('/register', { state: { from } })}
      />
    </div>
  )
}
