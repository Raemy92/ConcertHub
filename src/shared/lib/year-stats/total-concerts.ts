import { Concert } from '@/entities/concert'

/** Number of concerts the viewer attended in the year. */
export const totalConcerts = (attendedConcerts: Concert[]): number =>
  attendedConcerts.length
