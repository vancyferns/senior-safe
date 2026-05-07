import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Auth() {
  const navigate = useNavigate()
  const { user, isLoading, signUpLocal, signInLocal } = useAuth()

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/', { replace: true })
    }
  }, [user, isLoading, navigate])

  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (mode === 'signup' && !name.trim()) {
      setError('Name is required')
      return
    }
    
    if (!email.trim() && !phone.trim()) {
      setError('Email or phone is required')
      return
    }
    
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUpLocal({ name, email: email || null, phone: phone || null })
      } else {
        await signInLocal({ email: email || null, phone: phone || null })
      }
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(err?.message || 'Auth failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-blue-800 text-center mb-2">SeniorSafe</h1>
        <p className="text-center text-gray-600 mb-6">Learn Digital Payments Safely</p>

        <div className="mb-4 text-center">
          <button onClick={() => setMode('signin')} className={`px-4 py-2 mr-2 ${mode==='signin' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Sign In</button>
          <button onClick={() => setMode('signup')} className={`px-4 py-2 ${mode==='signup' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Sign Up</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Full name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border rounded p-2" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>

          <div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">
              {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  )
}

export default Auth