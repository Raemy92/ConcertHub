import { genreGradient } from '../genre-gradients'

interface GenrePillProps {
  tag: string
}

export const GenrePill = ({ tag }: GenrePillProps) => {
  const g = genreGradient(tag)
  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold lowercase"
      style={{
        padding: '3px 8px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.06)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        fontSize: 10.5,
        color: 'rgba(255,255,255,0.85)',
        letterSpacing: 0.2
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: g.a,
          boxShadow: `0 0 6px ${g.a}`
        }}
      />
      {tag}
    </span>
  )
}
