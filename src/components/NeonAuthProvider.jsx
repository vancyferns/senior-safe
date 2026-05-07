import React from 'react'

/**
 * NeonAuthProvider stub - not used in this architecture.
 * 
 * This app uses local email/phone authentication with backend API:
 * Frontend → Backend API → Neon Database
 * 
 * The backend (server.js) handles:
 * - User creation/lookup via email or phone
 * - User data persistence in Neon
 * - All database writes
 * 
 * See server/lib/db.js for database operations.
 */
export default function NeonAuthProvider({ children }) {
  // Simply pass through - auth is handled by AuthContext + backend API
  return <>{children}</>
}
