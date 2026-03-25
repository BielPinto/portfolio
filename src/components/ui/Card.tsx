import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-ink/8 bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-night dark:shadow-none ${className}`}
    >
      {children}
    </div>
  )
}
