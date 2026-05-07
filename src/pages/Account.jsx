import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export function Account() {
  const { user, dbUser, syncUserToDatabase } = useAuth()
  const [form, setForm] = useState({ name: '', picture: '' })
  const [status, setStatus] = useState(null)

  useEffect(() => {
    const src = dbUser || user
    if (src) {
      setForm({ name: src.name || '', picture: src.picture || '' })
    }
  }, [dbUser, user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  const save = async () => {
    setStatus('saving')
    try {
      const userId = (dbUser && dbUser.id) || (user && user.id)
      if (!userId) throw new Error('User ID missing')

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: form.name, picture: form.picture }),
      })

      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Update failed')

      // Refresh local dbUser
      await syncUserToDatabase({ id: userId })
      setStatus('saved')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <label className="block mb-2">Name</label>
      <input name="name" value={form.name} onChange={handleChange} className="w-full mb-4 p-2 border rounded" />
      <label className="block mb-2">Picture URL</label>
      <input name="picture" value={form.picture} onChange={handleChange} className="w-full mb-4 p-2 border rounded" />
      <button onClick={save} className="bg-blue-800 text-white px-4 py-2 rounded">
        Save
      </button>
      {status === 'saving' && <p className="mt-2">Saving…</p>}
      {status === 'saved' && <p className="mt-2 text-green-600">Saved</p>}
      {status === 'error' && <p className="mt-2 text-red-600">Save failed</p>}
    </div>
  )
}

export default Account