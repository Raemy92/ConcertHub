import { ReactNode } from 'react'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export const AuthShell = ({
  title,
  subtitle,
  children,
  footer
}: AuthShellProps) => {
  return (
    <div
      className="min-h-screen relative flex flex-col items-stretch overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 30% 10%, #1a1550 0%, #07091f 55%, #04061a 100%)'
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: -40,
          right: -40,
          width: 280,
          height: 280,
          borderRadius: 999,
          background:
            'radial-gradient(circle, rgba(124,255,178,0.25), transparent 60%)',
          filter: 'blur(40px)'
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          bottom: 0,
          left: -60,
          width: 320,
          height: 320,
          borderRadius: 999,
          background:
            'radial-gradient(circle, rgba(199,125,255,0.2), transparent 60%)',
          filter: 'blur(40px)'
        }}
      />

      <div
        className="relative z-10 flex-1 flex flex-col w-full mx-auto"
        style={{ padding: '0 24px', maxWidth: 480 }}
      >
        <div className="pt-24 sm:pt-28 mb-8">
          <div
            className="font-semibold tracking-tighter leading-none text-white mb-6"
            style={{ fontSize: 28, letterSpacing: -1 }}
          >
            Concert
            <span
              className="ml-1 font-semibold inline-flex items-center"
              style={{
                background: 'var(--accent)',
                color: '#0a1220',
                padding: '2px 8px',
                borderRadius: 8
              }}
            >
              hub
            </span>
          </div>
          <h1
            className="font-extrabold text-white"
            style={{ fontSize: 34, letterSpacing: -1.2, marginBottom: 8 }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.4
            }}
          >
            {subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-3">{children}</div>

        <div className="flex-1" />

        <div
          className="text-center"
          style={{
            padding: '20px 0 50px',
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)'
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  )
}
