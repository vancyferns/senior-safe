const { createClient } = require('@supabase/supabase-js')

// Environment variables required:
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')

  if (!token) return res.status(401).json({ error: 'Missing access token' })

  const { phone, code } = req.body || {}
  if (!phone || !code) return res.status(400).json({ error: 'Missing phone or code' })

  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !userData?.user) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    const userId = userData.user.id

    // Find matching verification
    const { data: rows, error: fetchErr } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('phone', phone)
      .eq('code', code)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchErr) {
      console.error('Fetch error', fetchErr)
      return res.status(500).json({ error: 'Database error' })
    }

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'Invalid code' })
    }

    const record = rows[0]
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Code expired' })
    }

    // Mark verification as verified
    await supabase
      .from('phone_verifications')
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq('id', record.id)

    // Update user's phone and mark as verified
    const normalized = phone.replace(/\D/g, '').replace(/^0+/, '')
    await supabase
      .from('users')
      .update({ phone: normalized, phone_verified: true, updated_at: new Date().toISOString() })
      .eq('id', userId)

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
