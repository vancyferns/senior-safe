import { AccountView } from '@neondatabase/auth/react/ui'
import { useParams } from 'react-router-dom'

export function Account() {
  const { path } = useParams()

  return <AccountView path={path || 'account'} />
}

export default Account