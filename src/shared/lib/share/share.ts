export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export interface ShareInput {
  title: string
  text?: string
  url: string
}

export async function shareOrCopy(input: ShareInput): Promise<ShareResult> {
  const data: ShareData = {
    title: input.title,
    url: input.url,
    ...(input.text !== undefined ? { text: input.text } : {})
  }

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    (typeof navigator.canShare !== 'function' || navigator.canShare(data))
  ) {
    try {
      await navigator.share(data)
      return 'shared'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return 'cancelled'
      }
    }
  }

  try {
    await navigator.clipboard.writeText(input.url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
