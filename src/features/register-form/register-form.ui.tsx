import { Lock, Mail, User } from 'lucide-react'
import { FormEvent, useState } from 'react'

import { authService } from '@/shared/auth/auth-service'
import { AuthShell, FormInput } from '@/shared/ui'

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
    <AuthShell
      title="Komm an Bord."
      subtitle="Plane Shows mit deinen Freunden. Verpasse keine Mitfahrt."
      footer={
        <>
          Bereits ein Konto?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-semibold cursor-pointer bg-transparent border-none p-0"
            style={{ color: 'var(--accent)', fontSize: 13 }}
          >
            Anmelden
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          placeholder="du@konzerthub.ch"
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

        {error && (
          <p className="text-center" style={{ color: '#ff7788', fontSize: 13 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="font-bold cursor-pointer disabled:opacity-50"
          style={{
            marginTop: 8,
            padding: 15,
            borderRadius: 14,
            background: 'linear-gradient(180deg, #8affc0, #5ee09a)',
            color: '#031615',
            border: 'none',
            fontSize: 15,
            boxShadow: '0 6px 20px rgba(124,255,178,0.3)'
          }}
        >
          {loading ? 'Lädt…' : 'Konto erstellen'}
        </button>
      </form>
    </AuthShell>
  )
}
