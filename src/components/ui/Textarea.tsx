import type { TextareaHTMLAttributes } from 'react'

export function Textarea({
  className = '',
  id,
  rows = 5,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { id?: string }) {
  return (
    <textarea
      id={id}
      rows={rows}
      className={`w-full resize-y rounded-xl border border-ink/12 bg-surface-muted px-4 py-4 text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-night-muted/60 ${className}`}
      {...props}
    />
  )
}
