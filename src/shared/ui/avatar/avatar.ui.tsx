interface AvatarProps {
  name: string
  size?: number
  ring?: boolean
}

const COLORS = [
  '#7cffb2',
  '#ff5577',
  '#6ae3ff',
  '#ffb020',
  '#c77dff',
  '#ff9560',
  '#a4d47c',
  '#ff9ec7'
]

const initialsOf = (name: string): string => {
  const trimmed = name.trim()
  if (!trimmed) return '??'
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const colorOf = (name: string): string => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return COLORS[hash % COLORS.length]
}

export const Avatar = ({ name, size = 32, ring = false }: AvatarProps) => {
  const color = colorOf(name)
  const initials = initialsOf(name)
  return (
    <div
      className="flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: `linear-gradient(135deg, ${color}, ${color}55)`,
        fontSize: size * 0.38,
        color: '#0a1220',
        letterSpacing: -0.2,
        boxShadow: ring ? `0 0 0 2px #0a1220, 0 0 0 3.5px ${color}` : 'none'
      }}
    >
      {initials}
    </div>
  )
}
