import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'
import { Input } from '@/components/ui/Input'
import { Section } from '@/components/ui/Section'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { submitContact } from '@/api/contact'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language-context'
import type { Messages } from '@/i18n/messages'

type FormState = {
  fullName: string
  email: string
  inquiryType: string
  message: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

function validate(values: FormState, msg: Messages['contact']): FormErrors {
  const e: FormErrors = {}
  if (!values.fullName.trim()) e.fullName = msg.errors.fullName
  if (!values.email.trim()) {
    e.email = msg.errors.emailRequired
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    e.email = msg.errors.emailInvalid
  }
  if (!values.inquiryType) e.inquiryType = msg.errors.inquiryType
  if (!values.message.trim()) e.message = msg.errors.message
  return e
}

function ContactFormColumn() {
  const { messages: m } = useLanguage()
  const inquiryOptions = m.contact.inquiryOptions

  const [values, setValues] = useState<FormState>({
    fullName: '',
    email: '',
    inquiryType: inquiryOptions[0],
    message: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle')

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const next = validate(values, m.contact)
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setStatus('submitting')
    try {
      const message = `Inquiry: ${values.inquiryType}\n\n${values.message.trim()}`
      await submitContact({
        name: values.fullName.trim(),
        email: values.email.trim(),
        message,
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div>
      <Card className="p-6 shadow-lg md:p-10">
        {status === 'success' ? (
          <div
            className="flex flex-col items-center py-12 text-center"
            role="status"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <CheckIcon />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-ink dark:text-white">
              {m.contact.successTitle}
            </h2>
            <p className="mt-2 max-w-sm text-ink-muted dark:text-night-muted">
              {m.contact.successBody}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium text-ink dark:text-white"
                >
                  {m.contact.fullName}
                </label>
                <Input
                  id="fullName"
                  autoComplete="name"
                  placeholder={m.contact.placeholderName}
                  value={values.fullName}
                  onChange={(ev) =>
                    setValues((v) => ({
                      ...v,
                      fullName: ev.target.value,
                    }))
                  }
                  aria-invalid={!!errors.fullName}
                  aria-describedby={
                    errors.fullName ? 'fullName-error' : undefined
                  }
                />
                {errors.fullName ? (
                  <p
                    id="fullName-error"
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {errors.fullName}
                  </p>
                ) : null}
              </div>
              <div className="sm:col-span-1">
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-ink dark:text-white"
                >
                  {m.contact.emailAddress}
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={m.contact.placeholderEmail}
                  value={values.email}
                  onChange={(ev) =>
                    setValues((v) => ({ ...v, email: ev.target.value }))
                  }
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email ? (
                  <p
                    id="email-error"
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {errors.email}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="inquiryType"
                className="mb-2 block text-sm font-medium text-ink dark:text-white"
              >
                {m.contact.inquiryType}
              </label>
              <Select
                id="inquiryType"
                value={values.inquiryType}
                onChange={(ev) =>
                  setValues((v) => ({
                    ...v,
                    inquiryType: ev.target.value,
                  }))
                }
                aria-invalid={!!errors.inquiryType}
                aria-describedby={
                  errors.inquiryType ? 'inquiry-error' : undefined
                }
              >
                {inquiryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
              {errors.inquiryType ? (
                <p
                  id="inquiry-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.inquiryType}
                </p>
              ) : null}
            </div>

            <div className="mt-6">
              <label
                htmlFor="message"
                className="mb-2 block text-sm font-medium text-ink dark:text-white"
              >
                {m.contact.message}
              </label>
              <Textarea
                id="message"
                placeholder={m.contact.placeholderMessage}
                value={values.message}
                onChange={(ev) =>
                  setValues((v) => ({
                    ...v,
                    message: ev.target.value,
                  }))
                }
                aria-invalid={!!errors.message}
                aria-describedby={
                  errors.message ? 'message-error' : undefined
                }
              />
              {errors.message ? (
                <p
                  id="message-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.message}
                </p>
              ) : null}
            </div>

            <div className="mt-8">
              <Button type="submit" disabled={status === 'submitting'}>
                {status === 'submitting'
                  ? m.contact.sending
                  : m.contact.sendMessage}
              </Button>
              {status === 'error' ? (
                <p
                  className="mt-4 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {m.contact.submitError}
                </p>
              ) : null}
            </div>
          </form>
        )}
      </Card>
      <p className="mt-8 text-center text-sm text-ink-muted dark:text-night-muted">
        {m.site.responseTimeNote}
      </p>
    </div>
  )
}

export function ContactPage() {
  const { locale, messages: m } = useLanguage()

  return (
    <Section className="py-10 md:py-16">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              {m.contact.getInTouch}
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-ink dark:text-white md:text-4xl lg:text-5xl">
              {m.contact.headline}
            </h1>
            <p className="mt-6 max-w-lg text-lg text-ink-muted dark:text-night-muted">
              {m.site.contactIntro}
            </p>

            <div className="mt-10 space-y-8">
              <div className="flex gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20"
                  aria-hidden
                >
                  <MailIcon />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink dark:text-white">
                    {m.contact.email}
                  </p>
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="mt-1 block text-lg text-primary hover:underline"
                  >
                    {siteConfig.email}
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20"
                  aria-hidden
                >
                  <PinIcon />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink dark:text-white">
                    {m.site.locationLabel}
                  </p>
                  <p className="mt-1 text-lg text-ink-muted dark:text-night-muted">
                    {siteConfig.location}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap gap-6">
              <a
                href={siteConfig.social.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-medium text-ink transition-colors hover:text-primary dark:text-white dark:hover:text-primary"
              >
                <GithubIcon />
                {m.contact.github}
              </a>
              <a
                href={siteConfig.social.linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-medium text-ink transition-colors hover:text-primary dark:text-white dark:hover:text-primary"
              >
                <LinkedinIcon />
                {m.contact.linkedin}
              </a>
            </div>
          </div>

          <ContactFormColumn key={locale} />
        </div>
      </Container>
    </Section>
  )
}

function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16v12H4V6zm0 0l8 6 8-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2" fill="currentColor" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function LinkedinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
