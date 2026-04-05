import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'outline' | 'ghost'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-white shadow-sm hover:bg-[#0052cc] dark:hover:bg-[#3385ff]',
  outline:
    'border border-ink/15 bg-transparent text-ink hover:bg-surface-muted dark:border-white/15 dark:text-white dark:hover:bg-white/5',
  ghost: 'text-ink-muted hover:text-ink dark:text-night-muted dark:hover:text-white',
}

type ButtonProps = {
  children: ReactNode
  variant?: Variant
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled,
  onClick,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function ButtonLink({
  to,
  children,
  variant = 'primary',
  className = '',
}: {
  to: string
  children: ReactNode
  variant?: Variant
  className?: string
}) {
  return (
    <Link
      to={to}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  )
}

export function AnchorButton({
  href,
  children,
  variant = 'primary',
  className = '',
}: {
  href: string
  children: ReactNode
  variant?: Variant
  className?: string
}) {
  return (
    <a
      href={href}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </a>
  )
}
