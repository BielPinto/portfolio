export function Badge({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-sm font-medium text-primary dark:bg-primary/20 ${className}`}
    >
      {children}
    </span>
  )
}
