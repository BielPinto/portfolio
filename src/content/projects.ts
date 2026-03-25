import type { Locale } from '@/i18n/locale'

export type Project = {
  id: string
  title: string
  excerpt: string
  tags: string[]
  imageSrc: string
  href: string
}

const projectsByLocale: Record<Locale, Project[]> = {
  en: [
    {
      id: 'cloud-infra',
      title: 'Nexus Distributed Mesh',
      excerpt:
        'Multi-region orchestration layer with automated failover and cost-aware autoscaling for stateful workloads.',
      tags: ['Go', 'Kubernetes', 'AWS'],
      imageSrc:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
      href: '#',
    },
    {
      id: 'blockchain',
      title: 'Chronos Indexer',
      excerpt:
        'High-throughput indexer and explorer API with deterministic replay and rich aggregation queries.',
      tags: ['Rust', 'gRPC', 'Postgres'],
      imageSrc:
        'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
      href: '#',
    },
    {
      id: 'data-viz',
      title: 'Signal Analytics Console',
      excerpt:
        'Real-time operational dashboards with drill-down tracing from metrics to exemplar traces.',
      tags: ['React', 'OTel', 'ClickHouse'],
      imageSrc:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
      href: '#',
    },
    {
      id: 'security',
      title: 'Fortress Guard',
      excerpt:
        'Unified security posture UI: policy as code, drift detection, and automated remediation hooks.',
      tags: ['TypeScript', 'AWS', 'OPA'],
      imageSrc:
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
      href: '#',
    },
  ],
  pt: [
    {
      id: 'cloud-infra',
      title: 'Malha distribuída Nexus',
      excerpt:
        'Camada de orquestração multi-região com failover automático e autoscaling consciente de custo para cargas com estado.',
      tags: ['Go', 'Kubernetes', 'AWS'],
      imageSrc:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
      href: '#',
    },
    {
      id: 'blockchain',
      title: 'Indexador Chronos',
      excerpt:
        'Indexador e API de explorer em alto throughput com replay determinístico e consultas de agregação ricas.',
      tags: ['Rust', 'gRPC', 'Postgres'],
      imageSrc:
        'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
      href: '#',
    },
    {
      id: 'data-viz',
      title: 'Console Signal Analytics',
      excerpt:
        'Painéis operacionais em tempo real com rastreamento drill-down de métricas até traces exemplares.',
      tags: ['React', 'OTel', 'ClickHouse'],
      imageSrc:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
      href: '#',
    },
    {
      id: 'security',
      title: 'Fortress Guard',
      excerpt:
        'UI unificada de postura de segurança: policy as code, detecção de drift e ganchos de remediação automática.',
      tags: ['TypeScript', 'AWS', 'OPA'],
      imageSrc:
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
      href: '#',
    },
  ],
}

export function getProjects(locale: Locale): Project[] {
  return projectsByLocale[locale]
}
