import type { SelectHTMLAttributes } from 'react'

export function Select({
  className = '',
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { id?: string }) {
  return (
    <select
      id={id}
      className={`w-full appearance-none rounded-xl border border-ink/12 bg-surface-muted px-4 py-4 text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-white/5 dark:text-white ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}
