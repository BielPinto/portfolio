import type { Locale } from '@/i18n/locale'

const en = {
  meta: {
    documentTitle: 'Gabriel Pinto — Portfolio',
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
    codeComment: '// Pipelines tuned for millions of devices...',
    chipAws: 'AWS & CLOUD',
    chipDistributed: 'IOT & EVENT-DRIVEN',
  },
  philosophy: {
    title: 'Core Philosophy',
  },
  site: {
    title: 'Senior Software Engineer',
    name: 'Gabriel Pinto',
    tagline:
      'Golang-focused backend engineer building cloud-native microservices and high-performance APIs for IoT and real-time platforms. React on the front, AWS and hybrid cloud in production — with MQTT, Kafka, and resilient distributed design.',
    philosophy:
      'I focus on scalability, resilience, clean architecture, and maintainability — systems that behave under real production load. I combine rigorous backend engineering with clear interfaces, and I have led stand-ups, sprint planning, and cross-team alignment alongside hands-on delivery.',
    philosophyTags: [
      'Scalability',
      'Clean Architecture',
      'Event-driven',
      'Observability',
    ],
    yearsExperience: '7+',
    yearsLabel: 'Years of experience',
    contactIntro:
      'Open to senior engineering roles, architecture discussions, and selective consulting. Reach out if you want to talk APIs, IoT platforms, or cloud-native delivery.',
    responseTimeNote: 'Average response time: 24-48 business hours.',
    copyright: '© 2026 Gabriel Pinto. Built with precision.',
    portraitAlt: 'Professional portrait of Gabriel Pinto, software engineer',
    aboutBio: [
      'I am a Senior Software Engineer with 7+ years building cloud-native platforms and distributed systems, with Golang as my primary backend language. I design REST and gRPC APIs and scalable microservices for large-scale IoT ecosystems and real-time device management — including event-driven stacks with Kafka and MQTT, and React applications deployed on AWS and Huawei Cloud.',
      'At Intelbras I work on remote device management for millions of connected devices, with high availability and zero downtime; I have also contributed to cost reductions of over 30% through Redis, async processing, and query optimization. I lead day-to-day technical coordination when needed and specialize in protocols such as MQTT, TR-069, and TR-369, plus modernization of legacy components into modular microservices.',
    ],
    aboutHistory:
      'Intelbras (2022–present): Senior Software Engineer on cloud IoT — Golang, Node.js, firmware collaboration, and technical leadership. F4G (2023–2024): multi-tenant healthcare — Next.js, NestJS, Prisma. For Business (2019–2022): ERP integrations with Fluig and RM Totvs, promoted from intern to engineer in three months. Earlier: support and DevOps roles that grounded me in networks, CI/CD, and production discipline.',
    aboutTools:
      'Go, Node.js, TypeScript, React, Next.js, NestJS, Prisma, Flutter (integration), Docker, Kubernetes, AWS, Redis, PostgreSQL, Kafka, MQTT, Jenkins, Git.',
    aboutSkills:
      'REST and gRPC API design, cloud-native and event-driven architecture, IoT (MQTT, TR-069, TR-369), distributed systems, performance and cost optimization, BPMN / Fluig / RM Totvs, technical leadership in agile teams.',
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
    headline: 'Cloud-native platforms from IoT scale to regulated SaaS.',
    body:
      'Highlights from Intelbras device management, F4G healthcare, enterprise automation with Fluig/Totvs, and this open-source portfolio.',
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
    documentTitle: 'Gabriel Pinto — Portfólio',
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
    codeComment: '// Pipelines afinados para milhões de dispositivos...',
    chipAws: 'AWS & NUVEM',
    chipDistributed: 'IOT & EVENT-DRIVEN',
  },
  philosophy: {
    title: 'Filosofia central',
  },
  site: {
    title: 'Engenheiro de Software Sênior',
    name: 'Gabriel Pinto',
    tagline:
      'Backend com foco em Golang: microsserviços cloud-native e APIs de alta performance para IoT e plataformas em tempo real. React no front, AWS e nuvem híbrida em produção — com MQTT, Kafka e design distribuído resiliente.',
    philosophy:
      'Priorizo escalabilidade, resiliência, clean architecture e manutenibilidade — sistemas que se comportam bem sob carga real. Uno engenharia de backend rigorosa a interfaces claras; também conduzo dailies, planejamento de sprint e alinhamento entre times além da execução técnica.',
    philosophyTags: [
      'Escalabilidade',
      'Clean Architecture',
      'Event-driven',
      'Observabilidade',
    ],
    yearsExperience: '7+',
    yearsLabel: 'Anos de experiência',
    contactIntro:
      'Aberto a posições sênior, conversas de arquitetura e consultoria pontual. Fale comigo sobre APIs, plataformas IoT ou entrega cloud-native.',
    responseTimeNote: 'Tempo médio de resposta: 24 a 48 horas úteis.',
    copyright: '© 2026 Gabriel Pinto. Feito com precisão.',
    portraitAlt: 'Retrato profissional de Gabriel Pinto, engenheiro de software',
    aboutBio: [
      'Sou Engenheiro de Software Sênior com mais de 7 anos construindo plataformas cloud-native e sistemas distribuídos, com Golang como linguagem principal no backend. Projeto APIs REST e gRPC e microsserviços escaláveis para ecossistemas IoT em larga escala e gestão remota de dispositivos — incluindo arquitetura orientada a eventos com Kafka e MQTT, e frontends em React em ambientes AWS e Huawei Cloud.',
      'Na Intelbras atuo em gestão remota de dispositivos para milhões de conexões, com alta disponibilidade e zero downtime; também contribuí para redução de mais de 30% em custos de infra e banco com Redis, processamento assíncrono e otimização de consultas. Assumo coordenação técnica do dia a dia quando necessário e especializo-me em protocolos como MQTT, TR-069 e TR-369, além de modernização de legado em microsserviços modulares.',
    ],
    aboutHistory:
      'Intelbras (2022–presente): Engenheiro de Software Sênior em IoT na nuvem — Golang, Node.js, colaboração com firmware e liderança técnica. F4G (2023–2024): saúde multi-tenant — Next.js, NestJS, Prisma. For Business (2019–2022): integrações ERP com Fluig e RM Totvs, promovido de estagiário a engenheiro em três meses. Anteriormente: suporte e DevOps — redes, CI/CD e disciplina de produção.',
    aboutTools:
      'Go, Node.js, TypeScript, React, Next.js, NestJS, Prisma, Flutter (integração), Docker, Kubernetes, AWS, Redis, PostgreSQL, Kafka, MQTT, Jenkins, Git.',
    aboutSkills:
      'Design de APIs REST e gRPC, arquitetura cloud-native e orientada a eventos, IoT (MQTT, TR-069, TR-369), sistemas distribuídos, otimização de performance e custo, BPMN / Fluig / RM Totvs, liderança técnica em times ágeis.',
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
    headline: 'Plataformas cloud-native da escala IoT a SaaS regulado.',
    body:
      'Destaques na Intelbras (gestão de dispositivos), F4G (saúde), automação enterprise com Fluig/Totvs e este portfólio open source.',
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
