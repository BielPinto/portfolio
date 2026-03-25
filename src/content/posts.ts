import type { Locale } from '@/i18n/locale'

export type BlogPost = {
  id: string
  title: string
  excerpt: string
  date: string
  readTime: string
  imageSrc: string
  href: string
  featured?: boolean
}

const postsByLocale: Record<Locale, BlogPost[]> = {
  en: [
    {
      id: 'featured-1',
      title: 'Designing APIs that survive 10× traffic',
      excerpt:
        'Versioning, backpressure, and contract tests — patterns that keep services stable when load spikes.',
      date: 'Mar 12, 2026',
      readTime: '8 min read',
      imageSrc:
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80',
      href: '#',
      featured: true,
    },
    {
      id: 'p2',
      title: 'Observability without drowning in cardinality',
      excerpt:
        'Practical guardrails for metrics, logs, and traces in busy production environments.',
      date: 'Feb 28, 2026',
      readTime: '6 min read',
      imageSrc:
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
      href: '#',
    },
    {
      id: 'p3',
      title: 'Go concurrency in production services',
      excerpt:
        'Context cancellation, worker pools, and when channels beat mutexes.',
      date: 'Feb 10, 2026',
      readTime: '10 min read',
      imageSrc:
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
      href: '#',
    },
    {
      id: 'p4',
      title: 'Frontend performance for data-heavy UIs',
      excerpt:
        'Virtualization, incremental loading, and keeping interaction latency predictable.',
      date: 'Jan 22, 2026',
      readTime: '7 min read',
      imageSrc:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      href: '#',
    },
  ],
  pt: [
    {
      id: 'featured-1',
      title: 'APIs que suportam 10× mais tráfego',
      excerpt:
        'Versionamento, backpressure e testes de contrato — padrões que mantêm serviços estáveis quando a carga dispara.',
      date: '12 mar. 2026',
      readTime: '8 min de leitura',
      imageSrc:
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80',
      href: '#',
      featured: true,
    },
    {
      id: 'p2',
      title: 'Observabilidade sem afogar em cardinalidade',
      excerpt:
        'Barreiras práticas para métricas, logs e traces em ambientes de produção movimentados.',
      date: '28 fev. 2026',
      readTime: '6 min de leitura',
      imageSrc:
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
      href: '#',
    },
    {
      id: 'p3',
      title: 'Concorrência em Go em serviços de produção',
      excerpt:
        'Cancelamento com context, pools de workers e quando channels vencem mutexes.',
      date: '10 fev. 2026',
      readTime: '10 min de leitura',
      imageSrc:
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
      href: '#',
    },
    {
      id: 'p4',
      title: 'Performance de frontend para UIs com muitos dados',
      excerpt:
        'Virtualização, carregamento incremental e latência de interação previsível.',
      date: '22 jan. 2026',
      readTime: '7 min de leitura',
      imageSrc:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      href: '#',
    },
  ],
}

export function getPosts(locale: Locale): BlogPost[] {
  return postsByLocale[locale]
}

const blogHeroByLocale = {
  en: {
    eyebrow: 'ENGINEERING NOTES',
    headline: 'Ideas on systems, tooling, and craft.',
    body:
      'Long-form notes from the field — architecture, performance, and the human side of shipping software.',
    newsletterTitle: 'Join the weekly briefing',
    newsletterBody:
      'Short essays on scalable systems and sharp interfaces. No spam — unsubscribe anytime.',
    newsletterPlaceholder: 'you@company.com',
    newsletterCta: 'Subscribe',
  },
  pt: {
    eyebrow: 'NOTAS DE ENGENHARIA',
    headline: 'Ideias sobre sistemas, ferramentas e ofício.',
    body:
      'Textos longos do dia a dia — arquitetura, performance e o lado humano de entregar software.',
    newsletterTitle: 'Receba o resumo semanal',
    newsletterBody:
      'Ensaios curtos sobre sistemas escaláveis e interfaces bem feitas. Sem spam — cancele quando quiser.',
    newsletterPlaceholder: 'voce@empresa.com',
    newsletterCta: 'Inscrever-se',
  },
} as const

export function getBlogPageCopy(locale: Locale) {
  return blogHeroByLocale[locale]
}
