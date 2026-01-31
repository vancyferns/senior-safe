const { createClient } = require('@supabase/supabase-js')

// Environment variables required:
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase service role config')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const randomCode = () => Math.floor(100000 + Math.random() * 900000).toString()

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')

  if (!token) return res.status(401).json({ error: 'Missing access token' })

  const { phone } = req.body || {}
  if (!phone) return res.status(400).json({ error: 'Missing phone' })

  try {
    // Validate user from provided access token using Supabase admin
    const { data: userData, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !userData?.user) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    const userId = userData.user.id

    // Rate limit: don't send more than 1 OTP per 60 seconds
    const { data: recent } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (recent && recent.length > 0) {
      const last = recent[0]
      const lastTs = new Date(last.created_at).getTime()
      if (Date.now() - lastTs < 60 * 1000) {
        return res.status(429).json({ error: 'OTP recently sent. Try again later.' })
      }
    }

    const code = randomCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes

    // Insert verification record
    const { error: insertErr } = await supabase.from('phone_verifications').insert({
      user_id: userId,
      phone,
      code,
      expires_at: expiresAt,
      verified: false
    })

    if (insertErr) {
      console.error('Insert error', insertErr)
      return res.status(500).json({ error: 'Database error' })
    }

    // Send SMS via Twilio REST API
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
      // In dev, return the code so developer can test without Twilio
      return res.status(200).json({ ok: true, dev_code: code })
    }

    const body = new URLSearchParams()
    body.append('To', phone)
    body.append('From', TWILIO_FROM_NUMBER)
    body.append('Body', `Your SeniorSafe verification code is ${code}`)

    const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    })

    if (!twilioRes.ok) {
      const text = await twilioRes.text()
      console.error('Twilio error', text)
      return res.status(502).json({ error: 'Failed to send SMS' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
