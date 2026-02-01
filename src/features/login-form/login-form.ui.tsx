import { Lock, LogIn, Mail } from 'lucide-react'
import { FormEvent, useState } from 'react'

import { authService } from '@/shared/auth/auth-service'
import { FormInput } from '@/shared/ui'

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister: () => void
}

export const LoginForm = ({
  onSuccess,
  onSwitchToRegister
}: LoginFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await authService.login({ email, password })
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      await authService.loginWithGoogle()
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Google Login fehlgeschlagen'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl shadow-xl border border-gray-800">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white">Willkommen zurück</h2>
        <p className="text-gray-400 mt-2">
          Melde dich an, um deine Konzerte zu planen
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label="E-Mail"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="deine@email.ch"
          required
          icon={Mail}
        />

        <FormInput
          label="Passwort"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          required
          icon={Lock}
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? (
            'Lädt...'
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Anmelden
            </>
          )}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-800"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-900 text-gray-500">
            Oder weiter mit
          </span>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="w-5 h-5"
        />
        Google Login
      </button>

      <p className="mt-8 text-center text-gray-400">
        Noch kein Konto?{' '}
        <button
          onClick={onSwitchToRegister}
          className="text-red-500 hover:underline font-medium"
        >
          Jetzt registrieren
        </button>
      </p>
    </div>
  )
}
