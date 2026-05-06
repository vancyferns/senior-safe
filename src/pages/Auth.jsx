import { AuthView } from '@neondatabase/auth/react/ui'
import { useParams } from 'react-router-dom'

export function Auth() {
  const { path } = useParams()

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <AuthView path={path || 'sign-in'} />
    </div>
  )
}

export default Auth