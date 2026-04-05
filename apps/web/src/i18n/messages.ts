import type { Locale } from '@/i18n/locale'

const en = {
  meta: {
    documentTitle: 'Gabriel Rocha — Portfolio',
  },
  nav: {
    home: 'Home',
    projects: 'Projects',
    about: 'About',
    blog: 'Blog',
    contact: 'Contact',
  },
  header: {
    mainNavAria: 'Main navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    languageMenuAria: 'Choose language',
    languageButtonAria: (code: string) => `Language: ${code}`,
  },
  footer: {
    github: 'GitHub',
    linkedin: 'LinkedIn',
    sourceCode: 'Source Code',
  },
  home: {
    viewPortfolio: 'View Portfolio',
    contactMe: 'Contact Me',
    scroll: 'Scroll',
    moreOn: 'More on',
    aboutLink: 'About',
    andThe: 'and',
    theBlog: 'the blog',
    codeComment: '// Initializing high-scale systems...',
    chipAws: 'AWS INFRA',
    chipDistributed: 'DISTRIBUTED',
  },
  philosophy: {
    title: 'Core Philosophy',
  },
  site: {
    title: 'Senior Software Engineer',
    name: 'Gabriel Rocha',
    tagline:
      'Architecting resilient digital infrastructure with Golang, React, and AWS. Focused on building highly scalable Distributed Systems that power high-performance applications.',
    philosophy:
      'I believe in code as architecture. Every line should contribute to a structural integrity that withstands the chaos of scale. My approach combines the rigorous logic of Backend engineering with the empathetic precision of modern UI.',
    philosophyTags: [
      'Concurrency',
      'Type-Safety',
      'Observability',
      'Performance',
    ],
    yearsExperience: '10+',
    yearsLabel: 'Years of Craftsmanship',
    contactIntro:
      'Currently open to senior leadership roles and specialized architectural consulting. Reach out for a technical deep-dive.',
    responseTimeNote: 'Average response time: 24-48 business hours.',
    copyright: '© 2026 Senior Software Engineer. Built with Precision.',
    portraitAlt: 'Professional portrait of Gabriel Rocha, software engineer',
    aboutBio: [
      'I design and build systems where reliability and clarity matter as much as raw throughput. My work spans backend services, cloud infrastructure, and interfaces that make complexity approachable.',
      'I care about measurable outcomes: latency budgets, cost-aware architectures, and teams that can own what they ship. If that resonates, I would like to hear what you are building.',
    ],
    aboutHistory:
      'Over a decade shipping production software across startups and scale-ups — from greenfield APIs to migrations and hardening of legacy paths.',
    aboutTools:
      'Go, TypeScript, React, AWS, Kubernetes, PostgreSQL, observability stacks.',
    aboutSkills:
      'Distributed systems, API design, event-driven workflows, performance tuning, and pragmatic security.',
    ctaAbout: "Let's build something scalable",
    locationLabel: 'Base',
  },
  about: {
    profile: 'Profile',
    history: 'History',
    tools: 'Tools',
    skills: 'Skills',
    viewProjects: 'View projects',
    orReadThe: 'Or read the',
    blog: 'blog',
  },
  projectsPage: {
    selectedWork: 'Selected work',
    subtitle: 'Case studies & systems',
    viewProject: 'View project',
  },
  projectsHero: {
    eyebrow: 'SENIOR SOFTWARE ENGINEER',
    headline: 'Engineering scalable systems with mathematical precision.',
    body:
      'A selection of systems work spanning infrastructure, data planes, and the interfaces that make them operable.',
  },
  blogPage: {
    recentPosts: 'Recent posts',
    featured: 'Featured',
    readMore: 'Read more',
    readMoreArrow: 'Read more →',
    newsletterThanks: 'Thanks — you are on the list (demo).',
    emailLabel: 'Email',
  },
  contact: {
    getInTouch: 'Get in touch',
    headline: "Let's build something significant.",
    email: 'Email',
    fullName: 'Full Name',
    emailAddress: 'Email Address',
    inquiryType: 'Inquiry Type',
    message: 'Message',
    sendMessage: 'Send Message',
    sending: 'Sending…',
    placeholderName: 'John Doe',
    placeholderEmail: 'john@example.com',
    placeholderMessage:
      'Tell me about your project or technical challenge...',
    successTitle: 'Message sent',
    successBody:
      'Thank you for reaching out. I will get back to you within 24–48 business hours.',
    submitError:
      'Something went wrong while sending your message. Please try again in a moment.',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    errors: {
      fullName: 'Please enter your name.',
      emailRequired: 'Email is required.',
      emailInvalid: 'Enter a valid email address.',
      inquiryType: 'Select an inquiry type.',
      message: 'Please add a short message.',
    },
    inquiryOptions: [
      'Technical Consulting',
      'Full-time opportunity',
      'Contract / advisory',
      'Other',
    ],
  },
}

export type Messages = typeof en

const pt: Messages = {
  meta: {
    documentTitle: 'Gabriel Rocha — Portfólio',
  },
  nav: {
    home: 'Início',
    projects: 'Projetos',
    about: 'Sobre',
    blog: 'Blog',
    contact: 'Contato',
  },
  header: {
    mainNavAria: 'Navegação principal',
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
    languageMenuAria: 'Escolher idioma',
    languageButtonAria: (code: string) => `Idioma: ${code}`,
  },
  footer: {
    github: 'GitHub',
    linkedin: 'LinkedIn',
    sourceCode: 'Código-fonte',
  },
  home: {
    viewPortfolio: 'Ver portfólio',
    contactMe: 'Fale comigo',
    scroll: 'Rolar',
    moreOn: 'Saiba mais em',
    aboutLink: 'Sobre',
    andThe: 'e no',
    theBlog: 'blog',
    codeComment: '// Inicializando sistemas em larga escala...',
    chipAws: 'INFRA AWS',
    chipDistributed: 'DISTRIBUÍDO',
  },
  philosophy: {
    title: 'Filosofia central',
  },
  site: {
    title: 'Engenheiro de Software Sênior',
    name: 'Gabriel Rocha',
    tagline:
      'Arquitetando infraestrutura digital resiliente com Golang, React e AWS. Focado em sistemas distribuídos altamente escaláveis que sustentam aplicações de alto desempenho.',
    philosophy:
      'Acredito que código é arquitetura. Cada linha deve contribuir para uma integridade estrutural que aguente o caos da escala. Minha abordagem combina a lógica rigorosa do backend com a precisão empática de interfaces modernas.',
    philosophyTags: [
      'Concorrência',
      'Type-safety',
      'Observabilidade',
      'Performance',
    ],
    yearsExperience: '10+',
    yearsLabel: 'Anos de ofício',
    contactIntro:
      'Aberto a posições de liderança sênior e consultoria arquitetural especializada. Entre em contato para uma conversa técnica.',
    responseTimeNote: 'Tempo médio de resposta: 24 a 48 horas úteis.',
    copyright: '© 2026 Engenheiro de Software Sênior. Feito com precisão.',
    portraitAlt: 'Retrato profissional de Gabriel Rocha, engenheiro de software',
    aboutBio: [
      'Projeto e construo sistemas em que confiabilidade e clareza importam tanto quanto vazão bruta. Meu trabalho vai de serviços de backend e infraestrutura em nuvem a interfaces que tornam a complexidade compreensível.',
      'Me importo com resultados mensuráveis: orçamentos de latência, arquiteturas conscientes de custo e times que donam o que entregam. Se isso ressoa, quero ouvir o que você está construindo.',
    ],
    aboutHistory:
      'Mais de uma década entregando software em produção em startups e empresas em escala — de APIs greenfield a migrações e endurecimento de legado.',
    aboutTools:
      'Go, TypeScript, React, AWS, Kubernetes, PostgreSQL, stacks de observabilidade.',
    aboutSkills:
      'Sistemas distribuídos, design de APIs, fluxos orientados a eventos, tuning de performance e segurança pragmática.',
    ctaAbout: 'Vamos construir algo escalável',
    locationLabel: 'Base',
  },
  about: {
    profile: 'Perfil',
    history: 'Trajetória',
    tools: 'Ferramentas',
    skills: 'Habilidades',
    viewProjects: 'Ver projetos',
    orReadThe: 'Ou leia o',
    blog: 'blog',
  },
  projectsPage: {
    selectedWork: 'Trabalhos selecionados',
    subtitle: 'Estudos de caso e sistemas',
    viewProject: 'Ver projeto',
  },
  projectsHero: {
    eyebrow: 'ENGENHEIRO DE SOFTWARE SÊNIOR',
    headline: 'Engenharia de sistemas escaláveis com precisão matemática.',
    body:
      'Uma seleção de trabalhos em sistemas — infraestrutura, planos de dados e as interfaces que os tornam operáveis.',
  },
  blogPage: {
    recentPosts: 'Posts recentes',
    featured: 'Destaque',
    readMore: 'Ler mais',
    readMoreArrow: 'Ler mais →',
    newsletterThanks: 'Obrigado — você está na lista (demo).',
    emailLabel: 'E-mail',
  },
  contact: {
    getInTouch: 'Entre em contato',
    headline: 'Vamos construir algo significativo.',
    email: 'E-mail',
    fullName: 'Nome completo',
    emailAddress: 'Endereço de e-mail',
    inquiryType: 'Tipo de consulta',
    message: 'Mensagem',
    sendMessage: 'Enviar mensagem',
    sending: 'Enviando…',
    placeholderName: 'João Silva',
    placeholderEmail: 'joao@exemplo.com',
    placeholderMessage:
      'Conte sobre seu projeto ou desafio técnico...',
    successTitle: 'Mensagem enviada',
    successBody:
      'Obrigado pelo contato. Responderei em até 24–48 horas úteis.',
    submitError:
      'Não foi possível enviar sua mensagem. Tente novamente em instantes.',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    errors: {
      fullName: 'Informe seu nome.',
      emailRequired: 'O e-mail é obrigatório.',
      emailInvalid: 'Digite um e-mail válido.',
      inquiryType: 'Selecione um tipo de consulta.',
      message: 'Adicione uma mensagem breve.',
    },
    inquiryOptions: [
      'Consultoria técnica',
      'Oportunidade em tempo integral',
      'Contrato / assessoria',
      'Outro',
    ],
  },
}

export const messages: Record<Locale, Messages> = {
  en,
  pt,
}
