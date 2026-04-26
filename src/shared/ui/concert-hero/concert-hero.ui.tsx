import { useLayoutEffect, useRef, useState } from 'react'

import { genreOf } from '../genre-gradients'

interface ConcertHeroProps {
  band: string
  openingBands?: string[]
  genres: string[]
  date: string
  height?: number
  size?: 'md' | 'lg'
  showDate?: boolean
  clampOpeningBands?: boolean
}

const NOISE_URL = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`

const OPENING_LINE_HEIGHT_PX = 14
const OPENING_MAX_LINES = 2
const OPENING_MAX_HEIGHT_PX = OPENING_LINE_HEIGHT_PX * OPENING_MAX_LINES
const OPENING_SUFFIX = ' … und weitere'

const buildOpeningText = (bands: string[], visibleCount: number): string => {
  if (visibleCount >= bands.length) return `+ ${bands.join(' · ')}`
  if (visibleCount <= 0) return `+ ${bands.length} weitere`
  return `+ ${bands.slice(0, visibleCount).join(' · ')}${OPENING_SUFFIX}`
}

const OpeningBandsLine = ({
  bands,
  clamp
}: {
  bands: string[]
  clamp: boolean
}) => {
  const [visibleCount, setVisibleCount] = useState(bands.length)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!clamp) {
      setVisibleCount(bands.length)
      return
    }
    const wrapper = wrapperRef.current
    const measure = measureRef.current
    if (!wrapper || !measure) return

    const recalc = () => {
      const fits = (count: number): boolean => {
        measure.textContent = buildOpeningText(bands, count)
        return measure.scrollHeight <= OPENING_MAX_HEIGHT_PX
      }

      if (fits(bands.length)) {
        setVisibleCount(bands.length)
        return
      }

      let lo = 0
      let hi = bands.length - 1
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2)
        if (fits(mid)) lo = mid
        else hi = mid - 1
      }
      setVisibleCount(lo)
    }

    recalc()
    const observer = new ResizeObserver(recalc)
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [bands, clamp])

  const sharedStyle = {
    fontSize: 11,
    letterSpacing: 0.4,
    lineHeight: `${OPENING_LINE_HEIGHT_PX}px`,
    color: 'rgba(255,255,255,0.75)'
  } as const

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className="font-semibold uppercase"
        style={{
          ...sharedStyle,
          ...(clamp
            ? { maxHeight: OPENING_MAX_HEIGHT_PX, overflow: 'hidden' }
            : {})
        }}
      >
        {buildOpeningText(bands, visibleCount)}
      </div>
      {clamp && (
        <div
          ref={measureRef}
          aria-hidden
          className="font-semibold uppercase"
          style={{
            ...sharedStyle,
            position: 'absolute',
            visibility: 'hidden',
            pointerEvents: 'none',
            top: 0,
            left: 0,
            right: 0
          }}
        />
      )}
    </div>
  )
}

export const ConcertHero = ({
  band,
  openingBands,
  genres,
  date,
  height = 140,
  size = 'md',
  showDate = true,
  clampOpeningBands = true
}: ConcertHeroProps) => {
  const g = genreOf(genres)
  const dateObj = date ? new Date(date) : null
  const validDate = dateObj && !Number.isNaN(dateObj.getTime())

  return (
    <div
      className="relative w-full overflow-hidden isolate"
      style={{ height, background: g.hue }}
    >
      <div
        className="absolute mix-blend-screen"
        style={{
          top: '-20%',
          right: '-10%',
          width: '60%',
          height: '130%',
          background: `radial-gradient(circle at 40% 40%, ${g.a}aa, transparent 60%)`,
          filter: 'blur(14px)'
        }}
      />
      <div
        className="absolute mix-blend-screen"
        style={{
          bottom: '-30%',
          left: '-10%',
          width: '70%',
          height: '130%',
          background: `radial-gradient(circle at 60% 40%, ${g.b}, transparent 70%)`,
          filter: 'blur(20px)'
        }}
      />
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{
          background: `repeating-linear-gradient(115deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 9px)`
        }}
      />
      <div
        className="absolute inset-0 mix-blend-overlay opacity-35"
        style={{ background: NOISE_URL }}
      />
      <div className="absolute inset-0 flex flex-col justify-end gap-0.5 px-4 py-3.5">
        <div
          className="font-extrabold text-white"
          style={{
            fontSize: size === 'lg' ? 34 : 26,
            letterSpacing: -1.2,
            lineHeight: 0.95,
            textShadow: '0 2px 14px rgba(0,0,0,0.4)',
            textWrap: 'balance'
          }}
        >
          {band}
        </div>
        {openingBands && openingBands.length > 0 && (
          <OpeningBandsLine bands={openingBands} clamp={clampOpeningBands} />
        )}
      </div>
      {validDate && showDate && (
        <div
          className="absolute top-3 right-3 text-center text-white font-bold uppercase"
          style={{
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 10,
            padding: '5px 9px',
            fontSize: 11,
            letterSpacing: 0.4,
            lineHeight: 1.2,
            border: '0.5px solid rgba(255,255,255,0.2)'
          }}
        >
          <div style={{ fontSize: 9, opacity: 0.7 }}>
            {dateObj!.toLocaleString('de-CH', { month: 'short' })}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>
            {dateObj!.getDate()}
          </div>
        </div>
      )}
    </div>
  )
}
