import { useLocation, useNavigate } from 'react-router-dom'

import { RegisterForm } from '@/features/register-form'

export const Register = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || '/'

  return (
    <RegisterForm
      onSuccess={() => navigate(from, { replace: true })}
      onSwitchToLogin={() => navigate('/login', { state: { from } })}
    />
  )
}
