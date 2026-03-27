import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import portraitSrc from '@/assets/myself.jpeg'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language-context'
import { LOCALES, type Locale } from '@/i18n/locale'
import { useTheme } from '@/hooks/useTheme'
import { Container } from '@/components/ui/Container'

const paths = [
  { to: '/', key: 'home' as const },
  { to: '/projects', key: 'projects' as const },
  { to: '/about', key: 'about' as const },
  { to: '/blog', key: 'blog' as const },
  { to: '/contact', key: 'contact' as const },
] as const

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink/10 text-ink transition-colors hover:bg-surface-muted dark:border-white/10 dark:text-white dark:hover:bg-white/5"
    >
      {theme === 'dark' ? (
        <SunIcon className="h-5 w-5" aria-hidden />
      ) : (
        <MoonIcon className="h-5 w-5" aria-hidden />
      )}
    </button>
  )
}

const localeLabels: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
}

function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, messages: m } = useLanguage()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const code = locale === 'en' ? 'EN' : 'PT'

  useEffect(() => {
    function handlePointerDown(ev: PointerEvent) {
      const el = wrapRef.current
      if (!el || !(ev.target instanceof Node) || el.contains(ev.target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  return (
    <div className={`relative ${className ?? ''}`} ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={m.header.languageButtonAria(code)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-ink/10 px-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted dark:border-white/10 dark:text-white dark:hover:bg-white/5"
      >
        <GlobeIcon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        <span>{code}</span>
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label={m.header.languageMenuAria}
          className="absolute right-0 z-[60] mt-1 min-w-[10rem] rounded-lg border border-ink/10 bg-surface py-1 shadow-lg dark:border-white/10 dark:bg-night"
        >
          {LOCALES.map((loc) => (
            <li key={loc} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={locale === loc}
                className={`flex w-full items-center px-3 py-2 text-left text-sm font-medium transition-colors ${
                  locale === loc
                    ? 'bg-primary/10 text-primary'
                    : 'text-ink hover:bg-surface-muted dark:text-white dark:hover:bg-white/5'
                }`}
                onClick={() => {
                  setLocale(loc)
                  setOpen(false)
                }}
              >
                {localeLabels[loc]}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function Header() {
  const { messages: m } = useLanguage()
  const [open, setOpen] = useState(false)
  const menuId = 'mobile-nav'

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-ink/8 bg-surface/90 backdrop-blur-md dark:border-white/10 dark:bg-night/90">
      <Container className="flex h-16 items-center justify-between gap-4 md:h-[4.75rem]">
        <Link
          to="/"
          className="flex items-center gap-3 text-lg font-semibold tracking-tight text-ink dark:text-white"
          onClick={() => setOpen(false)}
        >
          <img
            src={portraitSrc}
            alt={m.site.portraitAlt}
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-primary/25 dark:ring-primary/40"
          />
          {siteConfig.brand}
        </Link>

        <nav
          className="hidden items-center gap-8 lg:flex"
          aria-label={m.header.mainNavAria}
        >
          {paths.map(({ to, key }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-ink-muted hover:text-ink dark:text-night-muted dark:hover:text-white'
                }`
              }
            >
              {m.nav[key]}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <LanguageSwitcher />
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink/10 text-ink dark:border-white/10 dark:text-white"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? m.header.closeMenu : m.header.openMenu}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </Container>

      <div
        id={menuId}
        className={`border-t border-ink/8 bg-surface dark:border-white/10 dark:bg-night lg:hidden ${
          open ? 'block' : 'hidden'
        }`}
      >
        <Container className="flex flex-col gap-1 py-4">
          {paths.map(({ to, key }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-lg px-3 py-3 text-base font-medium ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-ink dark:text-white'
                }`
              }
            >
              {m.nav[key]}
            </NavLink>
          ))}
        </Container>
      </div>
    </header>
  )
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
