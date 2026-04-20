import { useLocation, useNavigate } from 'react-router-dom'

import { LoginForm } from '@/features/login-form'

export const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || '/'

  return (
    <LoginForm
      onSuccess={() => navigate(from, { replace: true })}
      onSwitchToRegister={() => navigate('/register', { state: { from } })}
    />
  )
}
