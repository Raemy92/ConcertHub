import { useNavigate } from 'react-router-dom'

import { LoginForm } from '@/features/login-form'

export const Login = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <LoginForm
        onSuccess={() => navigate('/')}
        onSwitchToRegister={() => navigate('/register')}
      />
    </div>
  )
}
