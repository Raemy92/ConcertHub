import { Lock, LogIn, Mail } from 'lucide-react'
import { FormEvent, useState } from 'react'

import { authService } from '@/shared/auth/auth-service'

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
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            E-Mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
              placeholder="deine@email.ch"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Passwort
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

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
