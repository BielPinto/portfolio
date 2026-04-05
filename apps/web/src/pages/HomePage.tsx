import { Link } from 'react-router-dom'
import { CodeSnippetCard } from '@/components/home/CodeSnippetCard'
import { HomePhilosophy } from '@/components/home/HomePhilosophy'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { useLanguage } from '@/context/language-context'

const heroBg =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80'

export function HomePage() {
  const { messages: m } = useLanguage()

  return (
    <>
      {/* Mobile hero — full-bleed workspace feel + scroll hint */}
      <section className="relative min-h-[88vh] lg:hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/92 via-white/88 to-surface dark:from-night/92 dark:via-night/90 dark:to-night" />
        <div className="relative flex min-h-[88vh] flex-col">
          <div className="flex flex-1 flex-col justify-end px-4 pb-8 pt-28">
            <Badge>{m.site.title}</Badge>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-ink dark:text-white">
              {m.site.name} – {m.site.title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink-muted dark:text-night-muted">
              {m.site.tagline}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/projects">{m.home.viewPortfolio}</ButtonLink>
              <ButtonLink to="/contact" variant="outline">
                {m.home.contactMe}
              </ButtonLink>
            </div>
            <div className="mt-10 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-widest text-ink-muted dark:text-night-muted">
              <span>{m.home.scroll}</span>
              <span
                className="inline-block h-10 w-px bg-ink/20 dark:bg-white/20"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      {/* Desktop hero */}
      <Section className="relative overflow-hidden pb-8 pt-8 md:pt-12 lg:pt-16">
        <div
          className="pointer-events-none absolute right-0 top-0 hidden h-full w-1/2 bg-gradient-to-l from-primary/8 to-transparent lg:block dark:from-primary/15"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 top-24 hidden w-[42%] border-l border-ink/5 dark:border-white/5 lg:block"
          aria-hidden
        />
        <Container className="hidden lg:block">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
            <div>
              <Badge>{m.site.title}</Badge>
              <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-ink dark:text-white xl:text-5xl 2xl:text-6xl">
                {m.site.name} – {m.site.title}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted dark:text-night-muted">
                {m.site.tagline}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <ButtonLink to="/projects" className="gap-3">
                  {m.home.viewPortfolio}
                  <ArrowRightIcon />
                </ButtonLink>
                <ButtonLink to="/contact" variant="outline">
                  {m.home.contactMe}
                </ButtonLink>
              </div>
            </div>
            <div className="relative flex justify-end">
              <CodeSnippetCard />
            </div>
          </div>
        </Container>

        {/* Mobile: show code card below fold */}
        <Container className="mt-10 lg:hidden">
          <CodeSnippetCard />
        </Container>
      </Section>

      <Section className="bg-surface-muted py-12 dark:bg-[#070c16] md:py-20">
        <HomePhilosophy />
      </Section>

      <Section className="py-12 md:py-16">
        <Container className="text-center">
          <p className="text-sm text-ink-muted dark:text-night-muted">
            {m.home.moreOn}{' '}
            <Link
              to="/about"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {m.home.aboutLink}
            </Link>{' '}
            {m.home.andThe}{' '}
            <Link
              to="/blog"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {m.home.theBlog}
            </Link>
            .
          </p>
        </Container>
      </Section>
    </>
  )
}

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="opacity-90"
      aria-hidden
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
