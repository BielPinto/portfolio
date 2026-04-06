import { afterEach, describe, expect, it, vi } from 'vitest'
import { submitContact } from './contact'

const payload = {
  name: 'Ada',
  email: 'ada@example.com',
  message: 'Hello',
}

describe('submitContact', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns parsed body on success', async () => {
    const json = {
      id: '22222222-2222-2222-2222-222222222222',
      created_at: '2020-01-01T00:00:00Z',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => json,
      })
    )

    await expect(submitContact(payload)).resolves.toEqual(json)
    expect(fetch).toHaveBeenCalledWith(
      '/contact',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    )
  })

  it('throws with server message when present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid email' }),
      })
    )

    await expect(submitContact(payload)).rejects.toThrow('Invalid email')
  })

  it('throws with status when body has no message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({}),
      })
    )

    await expect(submitContact(payload)).rejects.toThrow('Request failed (502)')
  })
})
