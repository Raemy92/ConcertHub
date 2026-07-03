import {
  Bell,
  BellOff,
  CalendarPlus,
  MessageCircle,
  UserPlus
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import { NotificationPrefs, userService } from '@/entities/user'
import {
  getCurrentPermission,
  isNotificationsSupported,
  requestPermissionAndRegister,
  unregisterCurrentDevice
} from '@/shared/notifications'
import { ToggleRow } from '@/shared/ui'

const DEFAULT_PREFS: NotificationPrefs = {
  newConcert: true,
  newParticipant: true,
  newComment: false
}

type Status = 'loading' | 'supported' | 'unsupported' | 'denied'

export const NotificationSettings = () => {
  const { user } = useAuth()

  const [status, setStatus] = useState<Status>('loading')
  const [masterOn, setMasterOn] = useState(false)
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS)
  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supported = await isNotificationsSupported()
      if (cancelled) return

      if (!supported) {
        setStatus('unsupported')
        return
      }

      const perm = getCurrentPermission()
      if (perm === 'denied') {
        setStatus('denied')
      } else {
        setStatus('supported')
      }

      const hasTokenLocally = Boolean(localStorage.getItem('ch:fcm:tokenId'))
      setMasterOn(perm === 'granted' && hasTokenLocally)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (user?.notificationPrefs) {
      setPrefs(user.notificationPrefs)
    }
  }, [user?.notificationPrefs])

  if (!user) return null

  const disabled = status === 'loading' || status === 'unsupported' || busy

  const handleMasterToggle = async (next: boolean) => {
    if (!user) return
    setErrorMsg(null)
    setBusy(true)
    try {
      if (next) {
        const token = await requestPermissionAndRegister(user.uid)
        if (!token) {
          setMasterOn(false)
          const perm = getCurrentPermission()
          if (perm === 'denied') {
            setStatus('denied')
            setErrorMsg(
              'Benachrichtigungen wurden vom Browser blockiert. Bitte in den Browser-Einstellungen für diese Seite erlauben.'
            )
          } else {
            setErrorMsg(
              'Aktivieren fehlgeschlagen. Bitte später erneut versuchen.'
            )
          }
          return
        }
        if (!user.notificationPrefs) {
          await userService.updateNotificationPrefs(user.uid, DEFAULT_PREFS)
          setPrefs(DEFAULT_PREFS)
        }
        setMasterOn(true)
      } else {
        await unregisterCurrentDevice(user.uid)
        setMasterOn(false)
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Etwas ist schiefgelaufen. Bitte später erneut versuchen.')
    } finally {
      setBusy(false)
    }
  }

  const handlePrefToggle = async (
    key: keyof NotificationPrefs,
    next: boolean
  ) => {
    if (!user) return
    const optimistic = { ...prefs, [key]: next }
    setPrefs(optimistic)
    try {
      await userService.updateNotificationPrefs(user.uid, optimistic)
    } catch (err) {
      console.error(err)
      setPrefs(prefs)
      setErrorMsg('Speichern fehlgeschlagen.')
    }
  }

  return (
    <div className="flex flex-col" style={{ gap: 14 }}>
      <div>
        <h2
          className="text-white font-semibold"
          style={{ fontSize: 18, letterSpacing: -0.3 }}
        >
          Benachrichtigungen
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.55)',
            marginTop: 4
          }}
        >
          Erhalte Push-Nachrichten auf diesem Gerät, wenn etwas Neues passiert.
        </p>
      </div>

      {status === 'unsupported' && (
        <InfoBox
          tone="amber"
          title="Auf diesem Gerät nicht verfügbar"
          body="Push-Benachrichtigungen funktionieren hier nicht. Auf iOS musst Du die App zuerst zum Home-Bildschirm hinzufügen und von dort aus öffnen."
        />
      )}

      {status === 'denied' && (
        <InfoBox
          tone="amber"
          title="Vom Browser blockiert"
          body="Du hast Benachrichtigungen in den Browser-Einstellungen abgelehnt. Erlaube sie dort erneut, um den Schalter zu aktivieren."
        />
      )}

      <ToggleRow
        icon={masterOn ? Bell : BellOff}
        label="Push-Benachrichtigungen"
        sublabel={
          masterOn ? 'Aktiv auf diesem Gerät' : 'Für dieses Gerät aktivieren'
        }
        active={masterOn}
        onChange={handleMasterToggle}
        disabled={disabled || status === 'denied'}
      />

      {masterOn && (
        <>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              fontWeight: 600,
              padding: '4px 2px 0'
            }}
          >
            Kategorien
          </div>

          <ToggleRow
            icon={CalendarPlus}
            label="Neue Konzerte"
            sublabel="Wenn jemand ein Konzert erstellt"
            active={prefs.newConcert}
            onChange={(next) => handlePrefToggle('newConcert', next)}
            disabled={busy}
          />

          <ToggleRow
            icon={UserPlus}
            label="Neue Teilnehmende"
            sublabel="Wenn sich jemand zu einem Deiner Konzerte anmeldet"
            active={prefs.newParticipant}
            onChange={(next) => handlePrefToggle('newParticipant', next)}
            disabled={busy}
          />

          <ToggleRow
            icon={MessageCircle}
            label="Neue Kommentare"
            sublabel="Du wirst informiert, wenn jemand auf einem deiner Konzerte kommentiert"
            active={prefs.newComment ?? false}
            onChange={(next) => handlePrefToggle('newComment', next)}
            disabled={busy}
          />
        </>
      )}

      {errorMsg && (
        <div
          style={{
            fontSize: 12,
            color: '#ff7788',
            padding: '8px 12px',
            background: 'rgba(255,119,136,0.08)',
            border: '0.5px solid rgba(255,119,136,0.25)',
            borderRadius: 10
          }}
        >
          {errorMsg}
        </div>
      )}
    </div>
  )
}

const InfoBox = ({
  title,
  body
}: {
  tone: 'amber'
  title: string
  body: string
}) => (
  <div
    style={{
      padding: '12px 14px',
      background: 'rgba(255,176,32,0.08)',
      border: '0.5px solid rgba(255,176,32,0.25)',
      borderRadius: 12
    }}
  >
    <div
      className="text-white font-semibold"
      style={{ fontSize: 13, marginBottom: 4 }}
    >
      {title}
    </div>
    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>
      {body}
    </div>
  </div>
)
