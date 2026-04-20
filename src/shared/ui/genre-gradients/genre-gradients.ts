export interface GenreGradient {
  a: string
  b: string
  hue: string
}

const makeHue = (a: string, b: string): string =>
  `linear-gradient(135deg, ${a} 0%, ${b} 60%, #0e1530 100%)`

const g = (a: string, b: string): GenreGradient => ({
  a,
  b,
  hue: makeHue(a, b)
})

export const GENRE_GRADIENTS: Record<string, GenreGradient> = {
  indie: g('#7cffb2', '#2d5a4a'),
  shoegaze: g('#ff9ec7', '#3a1f3a'),
  alternative: g('#a4c674', '#2a3820'),
  'post-punk': g('#ffb020', '#3a2510'),
  punk: g('#ff7755', '#3a1530'),
  grunge: g('#8a7355', '#2a2015'),
  rock: g('#ff5577', '#3a1530'),
  'hard-rock': g('#d94560', '#3a1525'),
  stoner: g('#c68940', '#2a1a10'),

  'heavy-metal': g('#c0c9d4', '#1a1f2e'),
  'power-metal': g('#9ec4e8', '#1a2a3a'),
  thrash: g('#b8d94a', '#2a2a15'),
  'groove-metal': g('#d97a40', '#3a1f10'),
  'progressive-metal': g('#7a9eff', '#1a2040'),
  metalcore: g('#ff4a7a', '#3a1525'),
  deathcore: g('#c03030', '#3a0f10'),
  'death-metal': g('#8a1a1a', '#2a0a0a'),
  'black-metal': g('#3a2a4a', '#15101a'),
  doom: g('#4a4050', '#1a151f'),
  sludge: g('#5a5a30', '#1f1f10'),
  'post-metal': g('#3a5a7a', '#101a2a'),

  electronic: g('#6ae3ff', '#1a3a6a'),
  'hip-hop': g('#ff9560', '#3a1a25'),
  pop: g('#ff8ad1', '#3a1f3a'),
  folk: g('#a4d47c', '#2a3a1f'),
  jazz: g('#d4a574', '#2a1f15'),
  experimental: g('#c77dff', '#2a1540')
}

export interface GenreGroup {
  label: string
  keys: string[]
}

export const GENRE_GROUPS: GenreGroup[] = [
  {
    label: 'Rock',
    keys: [
      'indie',
      'shoegaze',
      'alternative',
      'post-punk',
      'punk',
      'grunge',
      'rock',
      'hard-rock',
      'stoner'
    ]
  },
  {
    label: 'Metal',
    keys: [
      'heavy-metal',
      'power-metal',
      'thrash',
      'groove-metal',
      'progressive-metal',
      'metalcore',
      'deathcore',
      'death-metal',
      'black-metal',
      'doom',
      'sludge',
      'post-metal'
    ]
  },
  {
    label: 'Weitere',
    keys: ['electronic', 'hip-hop', 'pop', 'folk', 'jazz', 'experimental']
  }
]

// Maps legacy / synonymous genre names onto the canonical key.
const GENRE_ALIASES: Record<string, string> = {
  metal: 'heavy-metal'
}

const FALLBACK = GENRE_GRADIENTS.indie

const slug = (s: string): string => s.toLowerCase().trim().replace(/\s+/g, '-')

const resolveKey = (genre: string): string => {
  const key = slug(genre)
  return GENRE_ALIASES[key] ?? key
}

export const genreGradient = (genre: string | undefined): GenreGradient => {
  if (!genre) return FALLBACK
  return GENRE_GRADIENTS[resolveKey(genre)] ?? FALLBACK
}

export const genreOf = (genres: string[] | undefined): GenreGradient => {
  if (!genres) return FALLBACK
  for (const genre of genres) {
    const hit = GENRE_GRADIENTS[resolveKey(genre)]
    if (hit) return hit
  }
  return FALLBACK
}
