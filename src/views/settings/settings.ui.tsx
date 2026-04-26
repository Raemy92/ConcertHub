import { NotificationSettings } from '@/features/notification-settings'

export const Settings = () => (
  <div
    className="mx-auto"
    style={{
      maxWidth: 640,
      padding: '8px 16px 80px'
    }}
  >
    <div style={{ marginBottom: 20 }}>
      <h1
        className="text-white font-semibold tracking-tight"
        style={{ fontSize: 24, letterSpacing: -0.6 }}
      >
        Einstellungen
      </h1>
    </div>

    <NotificationSettings />
  </div>
)
