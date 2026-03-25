import { useLanguage } from '@/context/language-context'
import type { Project } from '@/content/projects'

export function ProjectCard({ project }: { project: Project }) {
  const { messages: m } = useLanguage()

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-ink/8 bg-surface shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-night dark:hover:border-white/15">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
        <img
          src={project.imageSrc}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
        <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink dark:text-white">
          {project.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted dark:text-night-muted">
          {project.excerpt}
        </p>
        <a
          href={project.href}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"
        >
          {m.projectsPage.viewProject}
          <span aria-hidden>→</span>
        </a>
      </div>
    </article>
  )
}
