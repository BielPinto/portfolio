import { describe, expect, it } from 'vitest'
import { LOCALE_STORAGE_KEY, LOCALES, type Locale } from './locale'

describe('locale', () => {
  it('exposes supported locales', () => {
    expect(LOCALES).toEqual(['en', 'pt'])
  })

  it('Locale type matches supported set', () => {
    const check = (l: Locale) => LOCALES.includes(l)
    expect(check('en')).toBe(true)
    expect(check('pt')).toBe(true)
  })

  it('storage key is stable', () => {
    expect(LOCALE_STORAGE_KEY).toBe('portfolio-locale')
  })
})
