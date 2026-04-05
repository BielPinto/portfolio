/** Base URL for the portfolio API (no trailing slash). Empty uses same origin — Vite proxies `/api` and `POST /contact` to the Go server in dev. */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!raw) return ''
  return raw.replace(/\/$/, '')
}

/** Matches `POST /contact` on the Go API (also duplicated as `POST /api/v1/public/contact` after rebuilding the backend image). */
export const CONTACT_SUBMIT_PATH = '/contact'

export function apiUrl(path: string): string {
  const base = getApiBaseUrl()
  const p = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${p}` : p
}
