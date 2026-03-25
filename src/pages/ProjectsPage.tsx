import { ProjectCard } from '@/components/projects/ProjectCard'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { useLanguage } from '@/context/language-context'
import { getProjects } from '@/content/projects'

export function ProjectsPage() {
  const { locale, messages: m } = useLanguage()
  const projects = getProjects(locale)
  const hero = m.projectsHero

  return (
    <>
      <Section className="pb-8 pt-8 md:pt-12">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {hero.eyebrow}
              </p>
              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-ink dark:text-white md:text-4xl lg:text-5xl">
                {hero.headline}
              </h1>
              <p className="mt-6 max-w-xl text-lg text-ink-muted dark:text-night-muted">
                {hero.body}
              </p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-ink/10 bg-surface-muted dark:border-white/10">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-90"
                style={{
                  backgroundImage:
                    'url(https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=900&q=80)',
                }}
                aria-hidden
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2">
                <div className="h-2 w-3/4 max-w-xs rounded bg-white/40" />
                <div className="h-2 w-1/2 max-w-[200px] rounded bg-white/30" />
                <div className="h-2 w-2/3 max-w-[280px] rounded bg-white/25" />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-surface-muted py-12 dark:bg-[#070c16] md:py-20">
        <Container>
          <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-2xl font-semibold text-ink dark:text-white">
              {m.projectsPage.selectedWork}
            </h2>
            <p className="text-sm text-ink-muted dark:text-night-muted">
              {m.projectsPage.subtitle}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
