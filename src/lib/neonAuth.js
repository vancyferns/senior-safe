import { createAuthClient } from '@neondatabase/auth'

export const neonAuthConfig = {
  authUrl: import.meta.env.VITE_NEON_AUTH_URL || null,
}

export const neonAuthClient = neonAuthConfig.authUrl
  ? createAuthClient(neonAuthConfig.authUrl)
  : null
