import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ThemeProvider } from '@/context/ThemeProvider'
import { useTheme } from '@/hooks/useTheme'

function mockMatchMedia(matchesDark: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-color-scheme: dark') ? matchesDark : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('matchMedia', mockMatchMedia(false))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.classList.remove('dark')
  })

  it('throws outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within ThemeProvider'
    )
  })

  it('toggles theme and syncs document class', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    })

    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
