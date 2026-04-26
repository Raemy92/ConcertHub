import { Lock, Mail } from 'lucide-react'
import { FormEvent, useState } from 'react'

import { authService } from '@/shared/auth/auth-service'
import { AuthShell, FormInput } from '@/shared/ui'

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
    <AuthShell
      title="Willkommen zurück."
      subtitle="Konzerte, Tickets, Mitfahrgelegenheit - alles an einem Ort."
      footer={
        <>
          Noch kein Konto?{' '}
          <button
            onClick={onSwitchToRegister}
            className="font-semibold cursor-pointer bg-transparent border-none p-0"
            style={{ color: 'var(--accent)', fontSize: 13 }}
          >
            Registrieren
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          {loading ? 'Lädt…' : 'Anmelden'}
        </button>
      </form>

      <div className="flex items-center gap-2.5 my-1">
        <div
          className="flex-1"
          style={{ height: 0.5, background: 'rgba(255,255,255,0.1)' }}
        />
        <span
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: 0.5
          }}
        >
          ODER
        </span>
        <div
          className="flex-1"
          style={{ height: 0.5, background: 'rgba(255,255,255,0.1)' }}
        />
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="font-semibold cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
        style={{
          padding: 13,
          borderRadius: 14,
          background: 'rgba(255,255,255,0.05)',
          color: '#fff',
          border: '0.5px solid rgba(255,255,255,0.15)',
          fontSize: 14
        }}
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          width={18}
          height={18}
        />
        Mit Google fortfahren
      </button>
    </AuthShell>
  )
}
