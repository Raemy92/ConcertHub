import { useNavigate } from 'react-router-dom'

import { RegisterForm } from '@/features/register-form'

export const Register = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <RegisterForm
        onSuccess={() => navigate('/')}
        onSwitchToLogin={() => navigate('/login')}
      />
    </div>
  )
}
