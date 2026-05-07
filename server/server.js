import express from 'express'
import cors from 'cors'
import { Buffer } from 'node:buffer'
import 'dotenv/config'
import { query, transaction, withClient, isDatabaseConfigured } from './lib/db.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware - CORS with proper origin handling
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://sturdy-goggles-7g69vqvw697hwpv5-5173.app.github.dev',
      'https://sturdy-goggles-7g69vqvw697hwpv5-3001.app.github.dev',
      process.env.VITE_FRONTEND_URL,
      process.env.FRONTEND_URL
    ].filter(Boolean)

    // Allow requests with no origin (like mobile apps or curl requests)
    // Also allow any localhost origin for dev convenience
    if (!origin || origin.startsWith('http://localhost:') || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(null, true) // For development: allow all origins
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))

app.use(express.json())

// =============================================
// SERIALIZERS
// =============================================

const toNumber = (value) => {
  if (value === null || value === undefined) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizePhone = (phone) => {
  if (!phone) return null
  return String(phone).replace(/[^\d+]/g, '').replace(/^\+91/, '') || null
}

const serializeUser = (row) => {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    name: row.name,
    givenName: row.given_name,
    familyName: row.family_name,
    picture: row.picture,
    phoneVerified: Boolean(row.phone_verified),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const serializeWallet = (row) => {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    balance: toNumber(row.balance),
    upiPin: row.upi_pin,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const serializeTransaction = (row) => {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    amount: toNumber(row.amount),
    type: row.type,
    description: row.description,
    toName: row.to_name,
    recipientUserId: row.recipient_user_id,
    senderUserId: row.sender_user_id,
    date: row.created_at,
  }
}

const serializeContact = (row) => {
  if (!row) return null
  const linkedUserId = row.linked_user_id_ref || row.linked_user_id || null
  return {
    id: row.id,
    name: row.linked_name || row.name,
    phone: row.phone || '',
    email: row.linked_email || row.email || null,
    picture: row.linked_picture || row.picture || null,
    userId: linkedUserId,
    isUser: Boolean(linkedUserId),
  }
}

const serializeAchievementStats = (row) => {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    totalTransactions: row.total_transactions || 0,
    scamsIdentified: row.scams_identified || 0,
    qrScans: row.qr_scans || 0,
    vouchersSent: row.vouchers_sent || 0,
    billsPaid: row.bills_paid || 0,
    loanCalculations: row.loan_calculations || 0,
    totalXP: row.total_xp || 0,
    unlockedAchievements: row.unlocked_achievements || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// =============================================
// DATABASE HELPERS
// =============================================

const ensureWallet = async (client, userId, balance = 10000, upiPin = null) => {
  const result = await client.query(
    `INSERT INTO wallets (user_id, balance, upi_pin)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id)
     DO UPDATE SET
       balance = COALESCE(EXCLUDED.balance, wallets.balance),
       upi_pin = COALESCE(EXCLUDED.upi_pin, wallets.upi_pin),
       updated_at = NOW()
     RETURNING *`,
    [userId, balance, upiPin]
  )
  return result.rows[0]
}

const ensureAchievementStats = async (client, userId) => {
  const result = await client.query(
    `INSERT INTO achievement_stats (
       user_id,
       total_transactions,
       scams_identified,
       qr_scans,
       vouchers_sent,
       bills_paid,
       loan_calculations,
       total_xp,
       unlocked_achievements
     ) VALUES ($1, 0, 0, 0, 0, 0, 0, 0, $2)
     ON CONFLICT (user_id)
     DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING *`,
    [userId, []]
  )
  return result.rows[0]
}

const getUserById = async (client, userId) => {
  const result = await client.query(
    `SELECT id, email, phone, name, given_name, family_name, picture, phone_verified, created_at, updated_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  )
  return result.rows[0] || null
}

const getUserByEmail = async (client, email) => {
  const result = await client.query(
    `SELECT id, email, phone, name, given_name, family_name, picture, phone_verified, created_at, updated_at
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email]
  )
  return result.rows[0] || null
}

const getUserByPhone = async (client, phone) => {
  const normalizedPhone = normalizePhone(phone)
  if (!normalizedPhone) return null
  const result = await client.query(
    `SELECT id, email, phone, name, given_name, family_name, picture, phone_verified, created_at, updated_at
     FROM users
     WHERE phone = $1
     LIMIT 1`,
    [normalizedPhone]
  )
  return result.rows[0] || null
}


const getWalletByUserId = async (client, userId, createIfMissing = true) => {
  const existing = await client.query(
    `SELECT * FROM wallets WHERE user_id = $1 LIMIT 1`,
    [userId]
  )
  if (existing.rows[0]) return existing.rows[0]
  if (!createIfMissing) return null
  return ensureWallet(client, userId)
}

const getAchievementStatsByUserId = async (client, userId, createIfMissing = true) => {
  const existing = await client.query(
    `SELECT * FROM achievement_stats WHERE user_id = $1 LIMIT 1`,
    [userId]
  )
  if (existing.rows[0]) return existing.rows[0]
  if (!createIfMissing) return null
  return ensureAchievementStats(client, userId)
}

const upsertTransaction = async (client, transactionRow) => {
  const result = await client.query(
    `INSERT INTO transactions (user_id, amount, type, description, to_name, recipient_user_id, sender_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      transactionRow.userId,
      transactionRow.amount,
      transactionRow.type,
      transactionRow.description,
      transactionRow.toName,
      transactionRow.recipientUserId,
      transactionRow.senderUserId,
    ]
  )
  return result.rows[0]
}

const listContacts = async (client, userId) => {
  const result = await client.query(
    `SELECT c.*, u.id AS linked_user_id_ref, u.name AS linked_name, u.email AS linked_email, u.picture AS linked_picture
     FROM contacts c
     LEFT JOIN users u ON u.id = c.linked_user_id
     WHERE c.user_id = $1
     ORDER BY c.created_at ASC`,
    [userId]
  )

  const contacts = []
  for (const row of result.rows) {
    let linkedUserId = row.linked_user_id_ref || null
    if (!linkedUserId && row.email) {
      const matched = await client.query(
        `SELECT id, name, email, picture FROM users WHERE lower(email) = lower($1) LIMIT 1`,
        [row.email]
      )
      if (matched.rows[0]) {
        linkedUserId = matched.rows[0].id
        await client.query(`UPDATE contacts SET linked_user_id = $1 WHERE id = $2`, [linkedUserId, row.id])
      }
    }
    contacts.push(serializeContact({ ...row, linked_user_id: linkedUserId }))
  }
  return contacts
}

// =============================================
// ROUTES
// =============================================

app.get('/api/health', (req, res) => {
  res.json({ ok: true, databaseConfigured: isDatabaseConfigured() })
})

// Local signup (name, email, phone) - simple, no password (demo)
app.post('/api/auth/signup', async (req, res) => {
  if (!isDatabaseConfigured()) {
    console.error('❌ Signup failed: DATABASE_URL not configured')
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  const { name, email, phone } = req.body || {}
  if (!name || (!email && !phone)) {
    return res.status(400).json({ error: 'name and email or phone are required' })
  }

  try {
    const result = await transaction(async (client) => {
      // Try finding existing by email or phone
      const existing = await client.query(
        `SELECT * FROM users WHERE lower(email) = lower($1) OR phone = $2 LIMIT 1`,
        [email || '', normalizePhone(phone)]
      )

      if (existing.rows[0]) {
        const user = existing.rows[0]
        const wallet = await getWalletByUserId(client, user.id)
        const stats = await getAchievementStatsByUserId(client, user.id)
        return { user, wallet, stats }
      }

      const insert = await client.query(
        `INSERT INTO users (email, phone, name, given_name, family_name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [email ? email.toLowerCase() : null, normalizePhone(phone), name, null, null]
      )

      const newUser = insert.rows[0]
      const wallet = await ensureWallet(client, newUser.id)
      const stats = await ensureAchievementStats(client, newUser.id)
      return { user: newUser, wallet, stats }
    })

    res.json({ user: serializeUser(result.user), wallet: serializeWallet(result.wallet), stats: serializeAchievementStats(result.stats) })
  } catch (error) {
    console.error('❌ Signup error:', error)
    res.status(500).json({ error: error.message || 'Signup failed' })
  }
})

// Local sign-in by email or phone
app.post('/api/auth/signin', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  const { email, phone } = req.body || {}
  if (!email && !phone) return res.status(400).json({ error: 'email or phone is required' })

  try {
    const user = await withClient(async (client) => {
      if (email) return getUserByEmail(client, email)
      if (phone) return getUserByPhone(client, phone)
      return null
    })

    if (!user) return res.status(404).json({ error: 'User not found' })

    const wallet = await withClient(async (client) => getWalletByUserId(client, user.id))
    const stats = await withClient(async (client) => getAchievementStatsByUserId(client, user.id))

    res.json({ user: serializeUser(user), wallet: serializeWallet(wallet), stats: serializeAchievementStats(stats) })
  } catch (error) {
    console.error('❌ Signin error:', error)
    res.status(500).json({ error: error.message || 'Signin failed' })
  }
})

app.get('/api/users/search', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  const queryText = req.query.q || ''
  const currentUserId = req.query.currentUserId || null

  if (queryText.trim().length < 2) {
    return res.json({ users: [] })
  }

  const result = await query(
    `SELECT id, email, phone, name, given_name, family_name, picture, phone_verified, created_at, updated_at
     FROM users
     WHERE (name ILIKE $1 OR email ILIKE $1) ${currentUserId ? 'AND id <> $2' : ''}
     ORDER BY name ASC
     LIMIT 10`,
    currentUserId ? [`%${queryText}%`, currentUserId] : [`%${queryText}%`]
  )

  res.json({ users: result.rows.map(serializeUser) })
})

app.get('/api/users/by-phone', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  const phone = req.query.phone || ''
  const user = await withClient(async (client) => {
    return getUserByPhone(client, phone)
  })

  res.json({ user: user ? serializeUser(user) : null })
})

app.get('/api/users/by-email', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  const email = req.query.email || ''
  const user = await withClient(async (client) => {
    return getUserByEmail(client, email)
  })

  res.json({ user: user ? serializeUser(user) : null })
})

app.get('/api/users/:id', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  const userId = req.params.id
  try {
    const user = await withClient(async (client) => {
      return getUserById(client, userId)
    })

    if (!user) return res.status(404).json({ user: null })

    res.json({ user: serializeUser(user) })
  } catch (error) {
    console.error('Error fetching user by id:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch user' })
  }
})

// Update user profile (partial update)
app.patch('/api/users', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  const { userId, name, phone, phone_verified, picture, givenName, familyName } = req.body || {}
  if (!userId) return res.status(400).json({ error: 'userId is required' })

  try {
    const result = await query(
      `UPDATE users SET
         name = COALESCE($2, name),
         phone = COALESCE($3, phone),
         phone_verified = COALESCE($4, phone_verified),
         picture = COALESCE($5, picture),
         given_name = COALESCE($6, given_name),
         family_name = COALESCE($7, family_name),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId, name || null, phone || null, phone_verified === undefined ? null : phone_verified, picture || null, givenName || null, familyName || null]
    )

    const updated = result.rows[0]

    if (!updated) return res.status(404).json({ error: 'User not found' })

    // Ensure wallet and stats exist for the user
    await withClient(async (client) => {
      await ensureWallet(client, updated.id)
      await ensureAchievementStats(client, updated.id)
    })

    res.json({ user: serializeUser(updated) })
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ error: error.message || 'Failed to update user' })
  }
})

app.get('/api/wallet', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  const userId = req.body?.userId || req.query.userId || req.headers['x-user-id']
  if (!userId) return res.status(400).json({ error: 'userId is required' })

  const wallet = await withClient(async (client) => {
    return getWalletByUserId(client, userId, true)
  })

  res.json({ wallet: serializeWallet(wallet) })
})

app.patch('/api/wallet/balance', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  const userId = req.body?.userId || req.query.userId || req.headers['x-user-id']
  if (!userId) return res.status(400).json({ error: 'userId is required' })

  const result = await query(
    `INSERT INTO wallets (user_id, balance)
     VALUES ($1, $2)
     ON CONFLICT (user_id)
     DO UPDATE SET balance = EXCLUDED.balance, updated_at = NOW()
     RETURNING *`,
    [userId, req.body.balance]
  )

  res.json({ wallet: serializeWallet(result.rows[0]) })
})

app.get('/api/transactions', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  const userId = req.query.userId || req.headers['x-user-id']
  const requestedLimit = Number(req.query.limit || 50)
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(requestedLimit, 100)) : 50

  if (!userId) return res.status(400).json({ error: 'userId is required' })

  const result = await query(
    `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  )

  res.json({ transactions: result.rows.map(serializeTransaction) })
})

app.post('/api/transactions', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  if (!req.body.userId) return res.status(400).json({ error: 'userId is required' })

  const result = await query(
    `INSERT INTO transactions (user_id, amount, type, description, to_name, recipient_user_id, sender_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      req.body.userId,
      req.body.amount,
      req.body.type,
      req.body.description || null,
      req.body.toName || null,
      req.body.recipientUserId || null,
      req.body.senderUserId || null,
    ]
  )

  res.json({ transaction: serializeTransaction(result.rows[0]) })
})

app.post('/api/transfers', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  const amount = Number(req.body.amount)
  if (!req.body.senderId || !req.body.recipientId || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'senderId, recipientId, and a valid amount are required' })
  }

  try {
    const result = await transaction(async (client) => {
      const senderWalletResult = await client.query(
        `SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE`,
        [req.body.senderId]
      )
      const recipientWalletResult = await client.query(
        `SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE`,
        [req.body.recipientId]
      )

      const senderWallet = senderWalletResult.rows[0]
      const recipientWallet = recipientWalletResult.rows[0]

      if (!senderWallet) throw new Error('Could not find sender wallet')
      if (!recipientWallet) throw new Error('Could not find recipient wallet')

      const senderBalance = toNumber(senderWallet.balance)
      if (senderBalance < amount) throw new Error('Insufficient balance')

      const recipientBalance = toNumber(recipientWallet.balance)
      const senderNewBalance = senderBalance - amount
      const recipientNewBalance = recipientBalance + amount

      await client.query(
        `UPDATE wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2`,
        [senderNewBalance, req.body.senderId]
      )
      await client.query(
        `UPDATE wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2`,
        [recipientNewBalance, req.body.recipientId]
      )

      const debit = await upsertTransaction(client, {
        userId: req.body.senderId,
        amount,
        type: 'DEBIT',
        description: `Sent to ${req.body.recipientName || 'user'}`,
        toName: req.body.recipientName || null,
        recipientUserId: req.body.recipientId,
      })

      const credit = await upsertTransaction(client, {
        userId: req.body.recipientId,
        amount,
        type: 'CREDIT',
        description: `Received from ${req.body.senderName || 'user'}`,
        toName: req.body.senderName || null,
        senderUserId: req.body.senderId,
      })

      return {
        success: true,
        senderNewBalance,
        recipientNewBalance,
        debit: serializeTransaction(debit),
        credit: serializeTransaction(credit),
      }
    })

    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message || 'Transfer failed' })
  }
})

app.get('/api/contacts', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  const userId = req.query.userId || req.headers['x-user-id']
  if (!userId) return res.status(400).json({ error: 'userId is required' })

  const contacts = await withClient(async (client) => {
    return listContacts(client, userId)
  })

  res.json({ contacts })
})

app.post('/api/contacts', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  const userId = req.body?.userId || req.query.userId || req.headers['x-user-id']
  if (!userId) return res.status(400).json({ error: 'userId is required' })

  const result = await transaction(async (client) => {
    const contact = req.body
    const normalizedPhone = contact.phone ? String(contact.phone).trim() : null
    const insertResult = await client.query(
      `INSERT INTO contacts (user_id, name, phone, email, picture, linked_user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, contact.name, normalizedPhone, contact.email, contact.picture, contact.linkedUserId]
    )
    return { contact: serializeContact(insertResult.rows[0]), linkedToUser: Boolean(contact.linkedUserId) }
  })

  res.json(result)
})

app.get('/api/achievements/stats', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  const userId = req.query.userId || req.headers['x-user-id']
  if (!userId) return res.status(400).json({ error: 'userId is required' })

  const stats = await withClient(async (client) => {
    return getAchievementStatsByUserId(client, userId, true)
  })

  res.json({ stats: serializeAchievementStats(stats) })
})

app.put('/api/achievements/stats', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  const userId = req.body?.userId || req.query.userId || req.headers['x-user-id']
  if (!userId) return res.status(400).json({ error: 'userId is required' })

  const stats = req.body.stats || {}
  const unlockedAchievements = req.body.unlockedAchievements || []

  const result = await query(
    `INSERT INTO achievement_stats (
       user_id, total_transactions, scams_identified, qr_scans, vouchers_sent,
       bills_paid, loan_calculations, total_xp, unlocked_achievements
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id)
     DO UPDATE SET
       total_transactions = EXCLUDED.total_transactions,
       scams_identified = EXCLUDED.scams_identified,
       qr_scans = EXCLUDED.qr_scans,
       vouchers_sent = EXCLUDED.vouchers_sent,
       bills_paid = EXCLUDED.bills_paid,
       loan_calculations = EXCLUDED.loan_calculations,
       total_xp = EXCLUDED.total_xp,
       unlocked_achievements = EXCLUDED.unlocked_achievements,
       updated_at = NOW()
     RETURNING *`,
    [
      userId,
      stats.totalTransactions || 0,
      stats.scamsIdentified || 0,
      stats.qrScans || 0,
      stats.vouchersSent || 0,
      stats.billsPaid || 0,
      stats.loanCalculations || 0,
      stats.totalXP || 0,
      unlockedAchievements,
    ]
  )

  res.json({ stats: serializeAchievementStats(result.rows[0]) })
})

app.get('/api/admin/stats', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  const result = await query(
    `SELECT
       COUNT(DISTINCT u.id) AS total_users,
       COALESCE(SUM(w.balance), 0) AS total_balance,
       COUNT(t.id) AS total_transactions
     FROM users u
     LEFT JOIN wallets w ON u.id = w.user_id
     LEFT JOIN transactions t ON u.id = t.user_id`
  )

  const row = result.rows[0] || {}
  res.json({
    totalUsers: toNumber(row.total_users),
    totalBalance: toNumber(row.total_balance),
    totalTransactions: toNumber(row.total_transactions),
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🗄️  Database configured: ${isDatabaseConfigured()}`)
})

export default app
