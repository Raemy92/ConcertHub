import { initializeApp } from 'firebase-admin/app'

initializeApp()

export { onConcertCreate } from './triggers/on-concert-create'
export { onParticipationCreate } from './triggers/on-participation-create'
