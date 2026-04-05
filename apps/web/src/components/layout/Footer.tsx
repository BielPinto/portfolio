import { Container } from '@/components/ui/Container'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language-context'

export function Footer() {
  const { messages: m } = useLanguage()

  return (
    <footer className="border-t border-ink/8 bg-surface-muted py-10 dark:border-white/10 dark:bg-[#070c16]">
      <Container className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted dark:text-night-muted">
          {m.site.copyright}
        </p>
        <div className="flex flex-wrap gap-6 text-sm font-medium">
          <a
            href={siteConfig.social.github}
            className="text-ink-muted transition-colors hover:text-primary dark:text-night-muted dark:hover:text-primary"
            target="_blank"
            rel="noreferrer"
          >
            {m.footer.github}
          </a>
          <a
            href={siteConfig.social.linkedin}
            className="text-ink-muted transition-colors hover:text-primary dark:text-night-muted dark:hover:text-primary"
            target="_blank"
            rel="noreferrer"
          >
            {m.footer.linkedin}
          </a>
          <a
            href={siteConfig.social.sourceCode}
            className="text-ink-muted transition-colors hover:text-primary dark:text-night-muted dark:hover:text-primary"
            target="_blank"
            rel="noreferrer"
          >
            {m.footer.sourceCode}
          </a>
        </div>
      </Container>
    </footer>
  )
}
