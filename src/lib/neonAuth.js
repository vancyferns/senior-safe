import { createAuthClient } from '@neondatabase/auth'
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters'

export const neonAuthConfig = {
  authUrl: import.meta.env.VITE_NEON_AUTH_URL || null,
  restUrl: import.meta.env.VITE_NEON_REST_URL?.replace(/\/+$/, '') || null,
}

export const neonAuthClient = neonAuthConfig.authUrl
  ? createAuthClient(neonAuthConfig.authUrl, {
      adapter: BetterAuthReactAdapter(),
    })
  : null
