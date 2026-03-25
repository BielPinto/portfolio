import { createContext, useContext } from 'react'
import type { Locale } from '@/i18n/locale'
import type { Messages } from '@/i18n/messages'

export type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  messages: Messages
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}
