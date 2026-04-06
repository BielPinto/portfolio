import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiUrl, CONTACT_SUBMIT_PATH, getApiBaseUrl } from './api'

describe('getApiBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns empty when unset', () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    expect(getApiBaseUrl()).toBe('')
  })

  it('trims and strips trailing slash', () => {
    vi.stubEnv('VITE_API_BASE_URL', ' https://api.example.com/ ')
    expect(getApiBaseUrl()).toBe('https://api.example.com')
  })
})

describe('apiUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses path only when base is empty', () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    expect(apiUrl('/v1/x')).toBe('/v1/x')
    expect(apiUrl('rel')).toBe('/rel')
  })

  it('prefixes with base when set', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
    expect(apiUrl('/contact')).toBe('https://api.example.com/contact')
  })
})

describe('CONTACT_SUBMIT_PATH', () => {
  it('is the public contact POST path', () => {
    expect(CONTACT_SUBMIT_PATH).toBe('/contact')
  })
})
