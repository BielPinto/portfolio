import { Link } from 'react-router-dom'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { useLanguage } from '@/context/language-context'

const portraitSrc =
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80'

export function AboutPage() {
  const { messages: m } = useLanguage()

  return (
    <>
      <Section className="pb-8 pt-8 md:pt-12">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:mx-0">
                <div
                  className="pointer-events-none absolute -inset-4 rounded-3xl bg-primary/20 blur-2xl dark:bg-primary/30"
                  aria-hidden
                />
                <div className="relative overflow-hidden rounded-2xl border border-ink/10 shadow-lg dark:border-white/10">
                  <img
                    src={portraitSrc}
                    alt={m.site.portraitAlt}
                    className="aspect-square w-full object-cover"
                    width={469}
                    height={469}
                  />
                </div>
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-primary">
                {m.about.profile}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink dark:text-white md:text-4xl">
                {m.site.name}
              </h1>
              <p className="mt-2 text-lg text-ink-muted dark:text-night-muted">
                {m.site.title}
              </p>
            </div>
            <div className="lg:col-span-7">
              <div className="space-y-6 text-lg leading-relaxed text-ink-muted dark:text-night-muted">
                {m.site.aboutBio.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className="mt-10 grid gap-6 sm:grid-cols-3">
                <Card className="p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-ink dark:text-white">
                    {m.about.history}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted dark:text-night-muted">
                    {m.site.aboutHistory}
                  </p>
                </Card>
                <Card className="p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-ink dark:text-white">
                    {m.about.tools}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted dark:text-night-muted">
                    {m.site.aboutTools}
                  </p>
                </Card>
                <Card className="p-6 sm:col-span-1">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-ink dark:text-white">
                    {m.about.skills}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted dark:text-night-muted">
                    {m.site.aboutSkills}
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-ink/8 bg-surface-muted py-16 dark:border-white/10 dark:bg-[#070c16]">
        <Container className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-semibold text-ink dark:text-white md:text-3xl">
            {m.site.ctaAbout}
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <ButtonLink to="/contact">{m.home.contactMe}</ButtonLink>
            <ButtonLink to="/projects" variant="outline">
              {m.about.viewProjects}
            </ButtonLink>
          </div>
          <p className="mt-8 text-sm text-ink-muted dark:text-night-muted">
            {m.about.orReadThe}{' '}
            <Link
              to="/blog"
              className="font-medium text-primary hover:underline"
            >
              {m.about.blog}
            </Link>
            .
          </p>
        </Container>
      </Section>
    </>
  )
}
