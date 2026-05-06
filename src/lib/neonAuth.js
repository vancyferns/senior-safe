import { createAuthClient } from '@neondatabase/auth'
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters'

const rawAuthUrl = import.meta.env.VITE_NEON_AUTH_URL || null

const normalizeAuthUrl = (url) => {
  if (!url) return null

  const trimmed = url.replace(/\/+$/, '')

  // Neon project Auth URLs are sometimes copied with a trailing /auth segment.
  // The SDK appends auth routes internally, so strip a final /auth to avoid /auth/auth/* requests.
  return trimmed.endsWith('/auth') ? trimmed.replace(/\/auth$/, '') : trimmed
}

export const neonAuthConfig = {
  authUrl: normalizeAuthUrl(rawAuthUrl),
  restUrl: import.meta.env.VITE_NEON_REST_URL?.replace(/\/+$/, '') || null,
}

export const neonAuthClient = neonAuthConfig.authUrl
  ? createAuthClient(neonAuthConfig.authUrl, {
      adapter: BetterAuthReactAdapter(),
    })
  : null
