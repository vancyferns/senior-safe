import {
  RedirectToSignIn,
  SignedIn,
  UserButton,
} from '@neondatabase/auth/react/ui'

export function Home() {
  return (
    <>
      <SignedIn>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            gap: '2rem',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1>Welcome!</h1>
            <p>You're successfully authenticated.</p>
            <UserButton size="icon" />
          </div>
        </div>
      </SignedIn>
      <RedirectToSignIn />
    </>
  )
}

export default Home