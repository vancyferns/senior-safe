import React from 'react'
import { NeonAuthUIProvider } from '@neondatabase/auth/react/ui'
import '@neondatabase/auth/ui/css'
import { neonAuthClient } from '../lib/neonAuth'

export default function NeonAuthProvider({ children }) {
  if (neonAuthClient) {
    return (
      <NeonAuthUIProvider authClient={neonAuthClient} redirectTo="/home">
        {children}
      </NeonAuthUIProvider>
    )
  }

  console.warn('VITE_NEON_AUTH_URL not set; skipping Neon Auth provider')

  // Fallback: render children directly so app still works
  return <>{children}</>
}
