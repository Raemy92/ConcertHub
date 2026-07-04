const PALETTE = [
  '#7cffb2',
  '#ffb020',
  '#4fc3f7',
  '#f06292',
  '#ba68c8',
  '#ff8a65',
  '#81c784',
  '#ffd54f',
  '#90caf9',
  '#a1887f'
]

const FALLBACK = '#9aa3b2'

export const USER_COLOR_PALETTE = PALETTE
export const USER_COLOR_FALLBACK = FALLBACK

export const colorForUserId = (uid: string | undefined | null): string => {
  if (!uid) return FALLBACK
  let hash = 0
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) >>> 0
  }
  return PALETTE[hash % PALETTE.length]
}
