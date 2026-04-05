import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'
import { useLanguage } from '@/context/language-context'

export function HomePhilosophy() {
  const { messages: m } = useLanguage()

  return (
    <Container>
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <Card className="p-8 lg:col-span-8 lg:p-12">
          <h2 className="text-2xl font-semibold tracking-tight text-ink dark:text-white md:text-3xl">
            {m.philosophy.title}
          </h2>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ink-muted dark:text-night-muted">
            {m.site.philosophy}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {m.site.philosophyTags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-surface-muted px-4 py-2 text-sm font-medium text-ink dark:bg-white/10 dark:text-white"
              >
                {tag}
              </span>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col justify-center bg-primary p-10 text-white lg:col-span-4">
          <p className="text-5xl font-bold tracking-tight md:text-6xl">
            {m.site.yearsExperience}
          </p>
          <p className="mt-4 text-lg font-medium text-white/90">
            {m.site.yearsLabel}
          </p>
        </Card>
      </div>
    </Container>
  )
}
