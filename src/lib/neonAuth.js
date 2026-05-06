export const neonAuthConfig = {
  authUrl: import.meta.env.VITE_NEON_AUTH_URL || null,
}

// Dynamic import helper so app doesn't crash if SDK not installed yet
export async function loadNeonAuthSDK() {
  try {
    return await import('@neondatabase/neon-js')
  } catch (err) {
    console.warn('Neon Auth SDK not available:', err.message || err)
    return null
  }
}
