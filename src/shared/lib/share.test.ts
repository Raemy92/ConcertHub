import { afterEach, describe, expect, it, vi } from 'vitest'

import { shareOrCopy } from './share'

const originalShare = Object.getOwnPropertyDescriptor(
  Navigator.prototype,
  'share'
)
const originalCanShare = Object.getOwnPropertyDescriptor(
  Navigator.prototype,
  'canShare'
)
const originalClipboard = Object.getOwnPropertyDescriptor(
  Navigator.prototype,
  'clipboard'
)

function setShare(fn: ((data: ShareData) => Promise<void>) | undefined): void {
  if (fn === undefined) {
    // @ts-expect-error — allow deletion for unsupported-environment tests
    delete (navigator as Navigator).share
    return
  }
  Object.defineProperty(navigator, 'share', {
    value: fn,
    configurable: true,
    writable: true
  })
}

function setCanShare(fn: ((data: ShareData) => boolean) | undefined): void {
  if (fn === undefined) {
    // @ts-expect-error — allow deletion
    delete (navigator as Navigator).canShare
    return
  }
  Object.defineProperty(navigator, 'canShare', {
    value: fn,
    configurable: true,
    writable: true
  })
}

function setClipboard(writeText: (text: string) => Promise<void>): void {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true
  })
}

function restoreDescriptor(
  key: 'share' | 'canShare' | 'clipboard',
  descriptor: PropertyDescriptor | undefined
): void {
  if (descriptor) {
    Object.defineProperty(navigator, key, descriptor)
  } else {
    // @ts-expect-error — allow deletion for cleanup
    delete (navigator as Navigator)[key]
  }
}

afterEach(() => {
  restoreDescriptor('share', originalShare)
  restoreDescriptor('canShare', originalCanShare)
  restoreDescriptor('clipboard', originalClipboard)
})

describe('shareOrCopy', () => {
  it('returns "shared" when native share resolves', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    setShare(share)
    setCanShare(undefined)
    setClipboard(vi.fn().mockResolvedValue(undefined))

    const result = await shareOrCopy({
      title: 'Band',
      url: 'https://example.com/concert/1'
    })

    expect(result).toBe('shared')
    expect(share).toHaveBeenCalledWith({
      title: 'Band',
      url: 'https://example.com/concert/1'
    })
  })

  it('returns "cancelled" when user dismisses the share sheet (AbortError)', async () => {
    const abort = new Error('aborted')
    abort.name = 'AbortError'
    setShare(vi.fn().mockRejectedValue(abort))
    setCanShare(undefined)
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)

    const result = await shareOrCopy({
      title: 'Band',
      url: 'https://example.com/concert/1'
    })

    expect(result).toBe('cancelled')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('falls through to clipboard when native share fails with a non-AbortError', async () => {
    setShare(vi.fn().mockRejectedValue(new Error('boom')))
    setCanShare(undefined)
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)

    const result = await shareOrCopy({
      title: 'Band',
      url: 'https://example.com/concert/1'
    })

    expect(result).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('https://example.com/concert/1')
  })

  it('copies via clipboard when navigator.share is missing', async () => {
    setShare(undefined)
    setCanShare(undefined)
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)

    const result = await shareOrCopy({
      title: 'Band',
      url: 'https://example.com/concert/1'
    })

    expect(result).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('https://example.com/concert/1')
  })

  it('returns "failed" when clipboard write rejects', async () => {
    setShare(undefined)
    setCanShare(undefined)
    setClipboard(vi.fn().mockRejectedValue(new Error('denied')))

    const result = await shareOrCopy({
      title: 'Band',
      url: 'https://example.com/concert/1'
    })

    expect(result).toBe('failed')
  })

  it('skips native share when canShare rejects the payload and falls back to clipboard', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    setShare(share)
    setCanShare(vi.fn().mockReturnValue(false))
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)

    const result = await shareOrCopy({
      title: 'Band',
      url: 'https://example.com/concert/1'
    })

    expect(result).toBe('copied')
    expect(share).not.toHaveBeenCalled()
    expect(writeText).toHaveBeenCalledWith('https://example.com/concert/1')
  })
})
