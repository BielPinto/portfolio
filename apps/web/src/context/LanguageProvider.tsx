import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { LanguageContext } from '@/context/language-context'
import { LOCALE_STORAGE_KEY, type Locale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
  if (stored === 'en' || stored === 'pt') return stored
  const nav = navigator.language.toLowerCase()
  if (nav.startsWith('pt')) return 'pt'
  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(LOCALE_STORAGE_KEY, next)
  }, [])

  const valueMessages = messages[locale]

  useEffect(() => {
    document.documentElement.lang = locale === 'pt' ? 'pt-BR' : 'en'
    document.title = valueMessages.meta.documentTitle
  }, [locale, valueMessages.meta.documentTitle])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      messages: valueMessages,
    }),
    [locale, setLocale, valueMessages],
  )

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}
