import { Lock, Mail, User, UserPlus } from 'lucide-react'
import { FormEvent, useState } from 'react'

import { authService } from '@/shared/auth/auth-service'
import { FormInput } from '@/shared/ui'

interface RegisterFormProps {
  onSuccess?: () => void
  onSwitchToLogin: () => void
}

export const RegisterForm = ({
  onSuccess,
  onSwitchToLogin
}: RegisterFormProps) => {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    setLoading(true)

    try {
      await authService.register({ email, password, displayName })
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Registrierung fehlgeschlagen'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl shadow-xl border border-gray-800">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white">Konto erstellen</h2>
        <p className="text-gray-400 mt-2">
          Werde Teil der ConcertHub Community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label="Anzeigename"
          type="text"
          value={displayName}
          onChange={setDisplayName}
          placeholder="Dein Name"
          required
          icon={User}
        />

        <FormInput
          label="E-Mail"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="deine@email.de"
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

        <FormInput
          label="Passwort bestätigen"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
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
              <UserPlus className="w-5 h-5" />
              Registrieren
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-gray-400">
        Bereits ein Konto oder mit deinem Google-Konto registrieren?{' '}
        <button
          onClick={onSwitchToLogin}
          className="text-red-500 hover:underline font-medium"
        >
          Jetzt anmelden
        </button>
      </p>
    </div>
  )
}
