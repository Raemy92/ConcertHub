import { initializeApp } from 'firebase-admin/app'

initializeApp()

export { onCommentCreate } from './triggers/on-comment-create'
export { onConcertCreate } from './triggers/on-concert-create'
export { onParticipationCreate } from './triggers/on-participation-create'
