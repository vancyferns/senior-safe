import { useAuth } from '../context/AuthContext'

export function Home() {
  const { user, isAuthenticated } = useAuth()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {isAuthenticated && user ? (
        <div style={{ textAlign: 'center' }}>
          <h1>Welcome, {user.name || user.email}!</h1>
          <p>You are signed in.</p>
          {user.picture && (
            <img src={user.picture} alt="Profile" style={{ width: 64, height: 64, borderRadius: 32, marginTop: 12 }} />
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h1>Welcome!</h1>
          <p>Please sign in to continue.</p>
        </div>
      )}
    </div>
  )
}

export default Home