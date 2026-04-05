import { CONTACT_SUBMIT_PATH, apiUrl } from '@/config/api'

export type SubmitContactPayload = {
  name: string
  email: string
  message: string
}

export type SubmitContactResult = {
  id: string
  created_at: string
}

type ErrorBody = {
  message?: string
  error?: string
}

export async function submitContact(
  payload: SubmitContactPayload,
): Promise<SubmitContactResult> {
  const res = await fetch(apiUrl(CONTACT_SUBMIT_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (res.ok) {
    return (await res.json()) as SubmitContactResult
  }

  let detail = ''
  try {
    const body = (await res.json()) as ErrorBody
    detail = body.message?.trim() ?? ''
  } catch {
    /* ignore */
  }

  const err = new Error(detail || `Request failed (${res.status})`)
  ;(err as Error & { status: number }).status = res.status
  throw err
}
