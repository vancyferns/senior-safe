import React, { useEffect, useState } from 'react'
import { neonAuthConfig, loadNeonAuthSDK } from '../lib/neonAuth'

export default function NeonAuthProvider({ children }) {
  const [ProviderComponent, setProviderComponent] = useState(null)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      if (!neonAuthConfig.authUrl) {
        console.warn('VITE_NEON_AUTH_URL not set; skipping Neon Auth provider')
        return
      }

      const sdk = await loadNeonAuthSDK()
      if (!sdk) return

      // Try common export names; SDK may export provider under different names
      const Provider = sdk?.NeonAuthUIProvider || sdk?.NeonAuthProvider || sdk?.default?.NeonAuthUIProvider || sdk?.default?.NeonAuthProvider

      if (Provider && mounted) {
        setProviderComponent(() => Provider)
      } else {
        console.warn('Neon Auth provider export not found in SDK; falling back')
      }
    })()

    return () => { mounted = false }
  }, [])

  if (ProviderComponent) {
    return (
      <ProviderComponent config={{ authUrl: neonAuthConfig.authUrl }}>
        {children}
      </ProviderComponent>
    )
  }

  // Fallback: render children directly so app still works
  return <>{children}</>
}
