import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { useLanguage } from '@/context/language-context'
import { getBlogPageCopy, getPosts, type BlogPost } from '@/content/posts'

export function BlogPage() {
  const { locale, messages: m } = useLanguage()
  const posts = getPosts(locale)
  const blogPageCopy = getBlogPageCopy(locale)
  const featured = posts.find((p) => p.featured)
  const rest = posts.filter((p) => !p.featured)

  return (
    <>
      <Section className="pb-8 pt-8 md:pt-12">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {blogPageCopy.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-ink dark:text-white md:text-4xl lg:text-5xl">
            {blogPageCopy.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-muted dark:text-night-muted">
            {blogPageCopy.body}
          </p>
        </Container>
      </Section>

      {featured ? (
        <Section className="py-6 md:py-10">
          <Container>
            <FeaturedCard post={featured} />
          </Container>
        </Section>
      ) : null}

      <Section className="bg-surface-muted py-12 dark:bg-[#070c16] md:py-16">
        <Container>
          <h2 className="text-xl font-semibold text-ink dark:text-white">
            {m.blogPage.recentPosts}
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </Container>
      </Section>

      <Section className="py-16 md:py-20">
        <Container>
          <NewsletterBlock />
        </Container>
      </Section>
    </>
  )
}

function FeaturedCard({ post }: { post: BlogPost }) {
  const { messages: m } = useLanguage()

  return (
    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-2">
        <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[320px]">
          <img
            src={post.imageSrc}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center p-8 lg:p-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            {m.blogPage.featured}
          </span>
          <h3 className="mt-4 text-2xl font-bold tracking-tight text-ink dark:text-white md:text-3xl">
            {post.title}
          </h3>
          <p className="mt-4 text-ink-muted dark:text-night-muted">
            {post.excerpt}
          </p>
          <div className="mt-4 flex gap-4 text-sm text-ink-muted dark:text-night-muted">
            <span>{post.date}</span>
            <span aria-hidden>·</span>
            <span>{post.readTime}</span>
          </div>
          <a
            href={post.href}
            className="mt-8 inline-flex font-semibold text-primary hover:underline"
          >
            {m.blogPage.readMoreArrow}
          </a>
        </div>
      </div>
    </Card>
  )
}

function PostCard({ post }: { post: BlogPost }) {
  const { messages: m } = useLanguage()

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-ink/8 bg-surface shadow-sm dark:border-white/10 dark:bg-night">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={post.imageSrc}
          alt=""
          className="h-full w-full object-cover transition-transform hover:scale-[1.02]"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex gap-3 text-xs text-ink-muted dark:text-night-muted">
          <span>{post.date}</span>
          <span aria-hidden>·</span>
          <span>{post.readTime}</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-ink dark:text-white">
          {post.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted dark:text-night-muted">
          {post.excerpt}
        </p>
        <a
          href={post.href}
          className="mt-4 text-sm font-semibold text-primary hover:underline"
        >
          {m.blogPage.readMore}
        </a>
      </div>
    </article>
  )
}

function NewsletterBlock() {
  const { locale, messages: m } = useLanguage()
  const blogPageCopy = getBlogPageCopy(locale)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSent(true)
  }

  return (
    <Card className="bg-primary p-8 text-white md:p-12">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold md:text-3xl">
          {blogPageCopy.newsletterTitle}
        </h2>
        <p className="mt-4 text-white/90">{blogPageCopy.newsletterBody}</p>
        {sent ? (
          <p className="mt-8 text-sm font-medium text-white" role="status">
            {m.blogPage.newsletterThanks}
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              {m.blogPage.emailLabel}
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={blogPageCopy.newsletterPlaceholder}
              className="min-h-[48px] flex-1 rounded-xl border border-white/30 bg-white/10 px-4 text-white placeholder:text-white/60 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <button
              type="submit"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-white bg-white px-6 font-semibold text-primary transition-colors hover:bg-white/90"
            >
              {blogPageCopy.newsletterCta}
            </button>
          </form>
        )}
      </div>
    </Card>
  )
}
