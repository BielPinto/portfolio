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
      id: 'intelbras-iot',
      title: 'Remote device management at scale',
      excerpt:
        'Cloud-native IoT platform for millions of devices: Golang microservices, MQTT, TR-069/TR-369, Redis caching, and async processing — contributing to 30%+ infra and DB cost reduction with zero-downtime operations.',
      tags: ['Go', 'MQTT', 'Kubernetes'],
      imageSrc:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
      href: '#',
    },
    {
      id: 'f4g-health',
      title: 'Multi-tenant healthcare platform',
      excerpt:
        'Secure, compliant SaaS: Next.js front end, NestJS and Prisma on the backend, tenant isolation, real-time clinical data visualization, and close collaboration with design and DevOps.',
      tags: ['Next.js', 'NestJS', 'Prisma'],
      imageSrc:
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
      href: '#',
    },
    {
      id: 'forbusiness-erp',
      title: 'ERP integrations & process automation',
      excerpt:
        'Enterprise workflows with Fluig (BPMN) and RM Totvs: integrations, dashboards, validations, and automation for mobility, energy, and industrial clients — from intern to engineer in three months.',
      tags: ['BPMN', 'Fluig', 'Totvs RM'],
      imageSrc:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      href: '#',
    },
    {
      id: 'portfolio',
      title: 'This portfolio (open source)',
      excerpt:
        'Modern React SPA with i18n, theme switching, and a Go API for contact — the site you are browsing, versioned on GitHub.',
      tags: ['React', 'Go', 'TypeScript'],
      imageSrc:
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
      href: 'https://github.com/BielPinto/portfolio',
    },
  ],
  pt: [
    {
      id: 'intelbras-iot',
      title: 'Gestão remota de dispositivos em escala',
      excerpt:
        'Plataforma IoT cloud-native para milhões de dispositivos: microsserviços em Golang, MQTT, TR-069/TR-369, cache Redis e processamento assíncrono — contribuindo para redução de mais de 30% em custos de infra e banco, com operações sem downtime.',
      tags: ['Go', 'MQTT', 'Kubernetes'],
      imageSrc:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
      href: '#',
    },
    {
      id: 'f4g-health',
      title: 'Plataforma multi-tenant de saúde',
      excerpt:
        'SaaS seguro e em conformidade: Next.js no front, NestJS e Prisma no backend, isolamento por tenant, visualização clínica em tempo real e trabalho conjunto com design e DevOps.',
      tags: ['Next.js', 'NestJS', 'Prisma'],
      imageSrc:
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
      href: '#',
    },
    {
      id: 'forbusiness-erp',
      title: 'Integrações ERP e automação de processos',
      excerpt:
        'Fluxos corporativos com Fluig (BPMN) e RM Totvs: integrações, painéis, validações e automação para clientes de mobilidade, energia e indústria — de estagiário a engenheiro em três meses.',
      tags: ['BPMN', 'Fluig', 'Totvs RM'],
      imageSrc:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      href: '#',
    },
    {
      id: 'portfolio',
      title: 'Este portfólio (open source)',
      excerpt:
        'SPA em React com i18n, troca de tema e API em Go para contato — o site que você está vendo, versionado no GitHub.',
      tags: ['React', 'Go', 'TypeScript'],
      imageSrc:
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
      href: 'https://github.com/BielPinto/portfolio',
    },
  ],
}

export function getProjects(locale: Locale): Project[] {
  return projectsByLocale[locale]
}
