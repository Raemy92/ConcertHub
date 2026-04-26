import { getMessaging, isSupported, Messaging } from 'firebase/messaging'

import { app } from './config'

let cached: Messaging | null | undefined

export const getMessagingInstance = async (): Promise<Messaging | null> => {
  if (cached !== undefined) return cached

  const supported = await isSupported()
  cached = supported ? getMessaging(app) : null
  return cached
}
