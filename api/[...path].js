import { Buffer } from 'node:buffer'
import { query, transaction, withClient, isDatabaseConfigured } from './_lib/db.js'
import { mapGooglePayload, verifyGoogleCredential } from './_lib/google.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
}

const json = (res, status, payload) => {
  res.statusCode = status
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value))
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

const errorResponse = (res, status, message, details = null) => {
  json(res, status, {
    error: message,
    ...(details ? { details } : {}),
  })
}

const readBody = async (req) => {
  if (req.body && typeof req.body === 'object') {
    return req.body
  }

  if (typeof req.body === 'string' && req.body.length > 0) {
    return JSON.parse(req.body)
  }

  const chunks = []

  for await (const chunk of req) {
    chunks.push(chunk)
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim()

  if (!raw) {
    return {}
  }

  return JSON.parse(raw)
}

const getRequestContext = (req) => {
  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname.replace(/^\/api\/?/, '')
  const segments = path.split('/').filter(Boolean)

  return { url, path, segments }
}

const normalizePhone = (phone) => {
  if (!phone) return null
  return String(phone).replace(/[^\d+]/g, '').replace(/^\+91/, '') || null
}

const toNumber = (value) => {
  if (value === null || value === undefined) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const serializeUser = (row) => {
  if (!row) return null

  return {
    id: row.id,
    googleId: row.google_id,
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
    `SELECT id, google_id, email, phone, name, given_name, family_name, picture, phone_verified, created_at, updated_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  )

  return result.rows[0] || null
}

const getUserByEmail = async (client, email) => {
  const result = await client.query(
    `SELECT id, google_id, email, phone, name, given_name, family_name, picture, phone_verified, created_at, updated_at
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
    `SELECT id, google_id, email, phone, name, given_name, family_name, picture, phone_verified, created_at, updated_at
     FROM users
     WHERE phone = $1
     LIMIT 1`,
    [normalizedPhone]
  )

  return result.rows[0] || null
}

const upsertUserFromGoogle = async (client, googleUser) => {
  const googleId = googleUser.googleId
  const email = googleUser.email?.toLowerCase()

  if (!googleId || !email) {
    throw new Error('Google profile is missing required fields')
  }

  const existing = await client.query(
    `SELECT id
     FROM users
     WHERE google_id = $1 OR lower(email) = lower($2)
     LIMIT 1`,
    [googleId, email]
  )

  if (existing.rows[0]) {
    const result = await client.query(
      `UPDATE users
       SET google_id = $1,
           email = $2,
           phone = COALESCE($3, phone),
           name = $4,
           given_name = $5,
           family_name = $6,
           picture = $7,
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        googleId,
        email,
        normalizePhone(googleUser.phone),
        googleUser.name,
        googleUser.givenName,
        googleUser.familyName,
        googleUser.picture,
        existing.rows[0].id,
      ]
    )

    return result.rows[0]
  }

  const result = await client.query(
    `INSERT INTO users (
       google_id,
       email,
       phone,
       name,
       given_name,
       family_name,
       picture
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      googleId,
      email,
      normalizePhone(googleUser.phone),
      googleUser.name,
      googleUser.givenName,
      googleUser.familyName,
      googleUser.picture,
    ]
  )

  return result.rows[0]
}

const getWalletByUserId = async (client, userId, createIfMissing = true) => {
  const existing = await client.query(
    `SELECT *
     FROM wallets
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  )

  if (existing.rows[0]) {
    return existing.rows[0]
  }

  if (!createIfMissing) {
    return null
  }

  return ensureWallet(client, userId)
}

const getAchievementStatsByUserId = async (client, userId, createIfMissing = true) => {
  const existing = await client.query(
    `SELECT *
     FROM achievement_stats
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  )

  if (existing.rows[0]) {
    return existing.rows[0]
  }

  if (!createIfMissing) {
    return null
  }

  return ensureAchievementStats(client, userId)
}

const upsertTransaction = async (client, transactionRow) => {
  const result = await client.query(
    `INSERT INTO transactions (
       user_id,
       amount,
       type,
       description,
       to_name,
       recipient_user_id,
       sender_user_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
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
    `SELECT
       c.*,
       u.id AS linked_user_id_ref,
       u.name AS linked_name,
       u.email AS linked_email,
       u.picture AS linked_picture
     FROM contacts c
     LEFT JOIN users u ON u.id = c.linked_user_id
     WHERE c.user_id = $1
     ORDER BY c.created_at ASC`,
    [userId]
  )

  const contacts = []

  for (const row of result.rows) {
    let linkedUserId = row.linked_user_id_ref || null
    let linkedName = row.linked_name || null
    let linkedEmail = row.linked_email || null
    let linkedPicture = row.linked_picture || null

    if (!linkedUserId && row.email) {
      const matched = await client.query(
        `SELECT id, name, email, picture
         FROM users
         WHERE lower(email) = lower($1)
         LIMIT 1`,
        [row.email]
      )

      if (matched.rows[0]) {
        linkedUserId = matched.rows[0].id
        linkedName = matched.rows[0].name
        linkedEmail = matched.rows[0].email
        linkedPicture = matched.rows[0].picture

        await client.query(
          `UPDATE contacts
           SET linked_user_id = $1
           WHERE id = $2`,
          [linkedUserId, row.id]
        )
      }
    }

    contacts.push(
      serializeContact({
        ...row,
        linked_user_id: linkedUserId,
        linked_name: linkedName,
        linked_email: linkedEmail,
        linked_picture: linkedPicture,
      })
    )
  }

  return contacts
}

const findLinkedUserForContact = async (client, email, linkedUserId) => {
  if (linkedUserId) {
    const result = await client.query(
      `SELECT id, name, email, picture
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [linkedUserId]
    )

    return result.rows[0] || null
  }

  if (!email) {
    return null
  }

  const result = await client.query(
    `SELECT id, name, email, picture
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email]
  )

  return result.rows[0] || null
}

const addContact = async (client, userId, contact) => {
  const linkedUser = await findLinkedUserForContact(client, contact.email, contact.linkedUserId)
  const finalLinkedUserId = linkedUser?.id || contact.linkedUserId || null
  const finalName = linkedUser?.name || contact.name
  const finalEmail = linkedUser?.email || contact.email || null
  const finalPicture = linkedUser?.picture || contact.picture || null
  const normalizedPhone = contact.phone ? String(contact.phone).trim() : null

  const existing = await client.query(
    `SELECT id
     FROM contacts
     WHERE user_id = $1
       AND (
         ($2::uuid IS NOT NULL AND linked_user_id = $2::uuid)
         OR ($3::text IS NOT NULL AND phone = $3::text)
         OR ($4::text IS NOT NULL AND lower(email) = lower($4::text))
         OR lower(name) = lower($5::text)
       )
     LIMIT 1`,
    [userId, finalLinkedUserId, normalizedPhone, finalEmail, finalName]
  )

  if (existing.rows[0]) {
    const duplicate = await client.query(
      `SELECT c.*,
              u.id AS linked_user_id_ref,
              u.name AS linked_name,
              u.email AS linked_email,
              u.picture AS linked_picture
       FROM contacts c
       LEFT JOIN users u ON u.id = c.linked_user_id
       WHERE c.id = $1
       LIMIT 1`,
      [existing.rows[0].id]
    )

    return {
      contact: serializeContact(duplicate.rows[0]),
      alreadyExists: true,
      linkedToUser: Boolean(duplicate.rows[0]?.linked_user_id_ref || duplicate.rows[0]?.linked_user_id),
    }
  }

  const result = await client.query(
    `INSERT INTO contacts (
       user_id,
       name,
       phone,
       email,
       picture,
       linked_user_id
     ) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, finalName, normalizedPhone, finalEmail, finalPicture, finalLinkedUserId]
  )

  return {
    contact: serializeContact({
      ...result.rows[0],
      linked_user_id: finalLinkedUserId,
      linked_name: finalName,
      linked_email: finalEmail,
      linked_picture: finalPicture,
    }),
    linkedToUser: Boolean(finalLinkedUserId),
  }
}

const handleAuthGoogle = async (req, res) => {
  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'Method not allowed')
  }

  if (!isDatabaseConfigured()) {
    return errorResponse(res, 500, 'DATABASE_URL is not configured')
  }

  const body = await readBody(req)
  const { credential, user: fallbackUser = {} } = body || {}

  try {
    const verification = await verifyGoogleCredential({ credential, fallbackUser })
    const googleUser = {
      ...mapGooglePayload(verification.payload),
      ...fallbackUser,
      ...verification.user,
    }

    if (!googleUser.googleId || !googleUser.email) {
      return errorResponse(res, 400, 'Google profile is missing required fields')
    }

    const result = await transaction(async (client) => {
      const user = await upsertUserFromGoogle(client, googleUser)
      const wallet = await ensureWallet(client, user.id)
      const stats = await ensureAchievementStats(client, user.id)

      return {
        user,
        wallet,
        stats,
      }
    })

    return json(res, 200, {
      verified: verification.verified,
      user: serializeUser(result.user),
      wallet: serializeWallet(result.wallet),
      stats: serializeAchievementStats(result.stats),
    })
  } catch (error) {
    return errorResponse(res, 401, error.message || 'Google credential verification failed')
  }
}

const handleUsers = async (req, res, segments, url) => {
  if (!isDatabaseConfigured()) {
    return errorResponse(res, 500, 'DATABASE_URL is not configured')
  }

  if (segments[1] === 'search' && req.method === 'GET') {
    const queryText = url.searchParams.get('q') || ''
    const currentUserId = url.searchParams.get('currentUserId') || null

    if (queryText.trim().length < 2) {
      return json(res, 200, { users: [] })
    }

    const result = await query(
      `SELECT id, google_id, email, phone, name, given_name, family_name, picture, phone_verified, created_at, updated_at
       FROM users
       WHERE (name ILIKE $1 OR email ILIKE $1)
         ${currentUserId ? 'AND id <> $2' : ''}
       ORDER BY name ASC
       LIMIT 10`,
      currentUserId ? [`%${queryText}%`, currentUserId] : [`%${queryText}%`]
    )

    return json(res, 200, {
      users: result.rows.map(serializeUser),
    })
  }

  if (segments[1] === 'by-phone' && req.method === 'GET') {
    const phone = url.searchParams.get('phone') || ''

    const result = await withClient(async (client) => {
      const user = await getUserByPhone(client, phone)
      return user ? serializeUser(user) : null
    })

    return json(res, 200, { user: result })
  }

  if (segments[1] === 'by-email' && req.method === 'GET') {
    const email = url.searchParams.get('email') || ''

    const result = await withClient(async (client) => {
      const user = await getUserByEmail(client, email)
      return user ? serializeUser(user) : null
    })

    return json(res, 200, { user: result })
  }

  if (segments[1] === 'me' && req.method === 'GET') {
    const userId = url.searchParams.get('userId') || req.headers['x-user-id'] || null

    if (!userId) {
      return errorResponse(res, 400, 'userId is required')
    }

    const result = await withClient(async (client) => {
      const user = await getUserById(client, userId)
      return user ? serializeUser(user) : null
    })

    if (!result) {
      return errorResponse(res, 404, 'User not found')
    }

    return json(res, 200, { user: result })
  }

  if (segments.length >= 2 && segments[1] === 'me' && segments[2] === 'phone' && req.method === 'PATCH') {
    const body = await readBody(req)
    const userId = body.userId || url.searchParams.get('userId') || req.headers['x-user-id'] || null

    if (!userId) {
      return errorResponse(res, 400, 'userId is required')
    }

    const normalizedPhone = normalizePhone(body.phone)

    const result = await query(
      `UPDATE users
       SET phone = $1,
           phone_verified = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, google_id, email, phone, name, given_name, family_name, picture, phone_verified, created_at, updated_at`,
      [normalizedPhone, Boolean(body.verified), userId]
    )

    if (!result.rows[0]) {
      return errorResponse(res, 404, 'User not found')
    }

    return json(res, 200, { user: serializeUser(result.rows[0]) })
  }

  if (segments.length === 2 && req.method === 'GET') {
    const userId = segments[1]

    const result = await withClient(async (client) => {
      const user = await getUserById(client, userId)
      return user ? serializeUser(user) : null
    })

    if (!result) {
      return errorResponse(res, 404, 'User not found')
    }

    return json(res, 200, { user: result })
  }

  return errorResponse(res, 404, 'Route not found')
}

const handleWallet = async (req, res, segments, url) => {
  if (!isDatabaseConfigured()) {
    return errorResponse(res, 500, 'DATABASE_URL is not configured')
  }

  const body = req.method === 'GET' ? {} : await readBody(req)
  const userId = body.userId || url.searchParams.get('userId') || req.headers['x-user-id'] || null

  if (!userId) {
    return errorResponse(res, 400, 'userId is required')
  }

  if (req.method === 'GET') {
    const wallet = await withClient(async (client) => {
      return getWalletByUserId(client, userId, true)
    })

    return json(res, 200, { wallet: serializeWallet(wallet) })
  }

  if (segments[1] === 'balance' && req.method === 'PATCH') {
    const result = await query(
      `INSERT INTO wallets (user_id, balance)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET
         balance = EXCLUDED.balance,
         updated_at = NOW()
       RETURNING *`,
      [userId, body.balance]
    )

    return json(res, 200, { wallet: serializeWallet(result.rows[0]) })
  }

  if (segments[1] === 'pin' && req.method === 'PATCH') {
    const result = await query(
      `INSERT INTO wallets (user_id, upi_pin)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET
         upi_pin = EXCLUDED.upi_pin,
         updated_at = NOW()
       RETURNING *`,
      [userId, body.pin]
    )

    return json(res, 200, { wallet: serializeWallet(result.rows[0]) })
  }

  if (req.method === 'POST') {
    const wallet = await query(
      `INSERT INTO wallets (user_id, balance)
       VALUES ($1, COALESCE($2, 10000))
       ON CONFLICT (user_id)
       DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [userId, body.balance]
    )

    return json(res, 200, { wallet: serializeWallet(wallet.rows[0]) })
  }

  return errorResponse(res, 404, 'Route not found')
}

const handleTransactions = async (req, res, segments, url) => {
  if (!isDatabaseConfigured()) {
    return errorResponse(res, 500, 'DATABASE_URL is not configured')
  }

  if (req.method === 'GET') {
    const userId = url.searchParams.get('userId') || req.headers['x-user-id'] || null
    const requestedLimit = Number(url.searchParams.get('limit') || 50)
    const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(requestedLimit, 100)) : 50

    if (!userId) {
      return errorResponse(res, 400, 'userId is required')
    }

    const result = await query(
      `SELECT *
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    )

    return json(res, 200, {
      transactions: result.rows.map(serializeTransaction),
    })
  }

  if (req.method === 'POST') {
    const body = await readBody(req)

    if (!body.userId) {
      return errorResponse(res, 400, 'userId is required')
    }

    const result = await query(
      `INSERT INTO transactions (
         user_id,
         amount,
         type,
         description,
         to_name,
         recipient_user_id,
         sender_user_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        body.userId,
        body.amount,
        body.type,
        body.description || null,
        body.toName || null,
        body.recipientUserId || null,
        body.senderUserId || null,
      ]
    )

    return json(res, 200, { transaction: serializeTransaction(result.rows[0]) })
  }

  return errorResponse(res, 404, 'Route not found')
}

const handleTransfers = async (req, res) => {
  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'Method not allowed')
  }

  if (!isDatabaseConfigured()) {
    return errorResponse(res, 500, 'DATABASE_URL is not configured')
  }

  const body = await readBody(req)
  const amount = Number(body.amount)

  if (!body.senderId || !body.recipientId || !Number.isFinite(amount) || amount <= 0) {
    return errorResponse(res, 400, 'senderId, recipientId, and a valid amount are required')
  }

  try {
    const result = await transaction(async (client) => {
      const senderWalletResult = await client.query(
        `SELECT *
         FROM wallets
         WHERE user_id = $1
         FOR UPDATE`,
        [body.senderId]
      )

      const recipientWalletResult = await client.query(
        `SELECT *
         FROM wallets
         WHERE user_id = $1
         FOR UPDATE`,
        [body.recipientId]
      )

      const senderWallet = senderWalletResult.rows[0]
      const recipientWallet = recipientWalletResult.rows[0]

      if (!senderWallet) {
        throw new Error('Could not find sender wallet')
      }

      if (!recipientWallet) {
        throw new Error('Could not find recipient wallet')
      }

      const senderBalance = toNumber(senderWallet.balance)

      if (senderBalance < amount) {
        throw new Error('Insufficient balance')
      }

      const recipientBalance = toNumber(recipientWallet.balance)
      const senderNewBalance = senderBalance - amount
      const recipientNewBalance = recipientBalance + amount

      await client.query(
        `UPDATE wallets
         SET balance = $1,
             updated_at = NOW()
         WHERE user_id = $2`,
        [senderNewBalance, body.senderId]
      )

      await client.query(
        `UPDATE wallets
         SET balance = $1,
             updated_at = NOW()
         WHERE user_id = $2`,
        [recipientNewBalance, body.recipientId]
      )

      const debit = await upsertTransaction(client, {
        userId: body.senderId,
        amount,
        type: 'DEBIT',
        description: `Sent to ${body.recipientName || 'user'}`,
        toName: body.recipientName || null,
        recipientUserId: body.recipientId,
        senderUserId: null,
      })

      const credit = await upsertTransaction(client, {
        userId: body.recipientId,
        amount,
        type: 'CREDIT',
        description: `Received from ${body.senderName || 'user'}`,
        toName: body.senderName || null,
        recipientUserId: null,
        senderUserId: body.senderId,
      })

      return {
        success: true,
        senderNewBalance,
        recipientNewBalance,
        debit: serializeTransaction(debit),
        credit: serializeTransaction(credit),
      }
    })

    return json(res, 200, result)
  } catch (error) {
    return errorResponse(res, 400, error.message || 'Transfer failed')
  }
}

const handleContacts = async (req, res, segments, url) => {
  if (!isDatabaseConfigured()) {
    return errorResponse(res, 500, 'DATABASE_URL is not configured')
  }

  const body = req.method === 'GET' ? {} : await readBody(req)
  const userId = body.userId || url.searchParams.get('userId') || req.headers['x-user-id'] || null

  if (!userId) {
    return errorResponse(res, 400, 'userId is required')
  }

  if (req.method === 'GET') {
    const contacts = await withClient(async (client) => {
      return listContacts(client, userId)
    })

    return json(res, 200, { contacts })
  }

  if (req.method === 'POST') {
    const result = await transaction(async (client) => {
      return addContact(client, userId, {
        name: body.name,
        phone: body.phone,
        email: body.email,
        picture: body.picture,
        linkedUserId: body.linkedUserId,
      })
    })

    return json(res, 200, result)
  }

  return errorResponse(res, 404, 'Route not found')
}

const handleAchievements = async (req, res, segments, url) => {
  if (!isDatabaseConfigured()) {
    return errorResponse(res, 500, 'DATABASE_URL is not configured')
  }

  const body = req.method === 'GET' ? {} : await readBody(req)
  const userId = body.userId || url.searchParams.get('userId') || req.headers['x-user-id'] || null

  if (!userId) {
    return errorResponse(res, 400, 'userId is required')
  }

  if (segments[1] === 'stats' && req.method === 'GET') {
    const stats = await withClient(async (client) => {
      return getAchievementStatsByUserId(client, userId, true)
    })

    return json(res, 200, { stats: serializeAchievementStats(stats) })
  }

  if (segments[1] === 'stats' && req.method === 'PUT') {
    const stats = body.stats || {}
    const unlockedAchievements = body.unlockedAchievements || []

    const result = await query(
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

    return json(res, 200, { stats: serializeAchievementStats(result.rows[0]) })
  }

  return errorResponse(res, 404, 'Route not found')
}

const handleAdmin = async (req, res, segments) => {
  if (!isDatabaseConfigured()) {
    return errorResponse(res, 500, 'DATABASE_URL is not configured')
  }

  if (segments[1] !== 'stats' || req.method !== 'GET') {
    return errorResponse(res, 404, 'Route not found')
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

  return json(res, 200, {
    totalUsers: toNumber(row.total_users),
    totalBalance: toNumber(row.total_balance),
    totalTransactions: toNumber(row.total_transactions),
  })
}

const handlePhoneVerifications = async (req, res) => {
  if (!isDatabaseConfigured()) {
    return errorResponse(res, 500, 'DATABASE_URL is not configured')
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return errorResponse(res, 405, 'Method not allowed')
  }

  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost')
    const userId = url.searchParams.get('userId')
    const phone = url.searchParams.get('phone')

    const result = await query(
      `SELECT *
       FROM phone_verifications
       WHERE ($1::uuid IS NULL OR user_id = $1)
         AND ($2::text IS NULL OR phone = $2)
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId || null, phone || null]
    )

    return json(res, 200, { verification: result.rows[0] || null })
  }

  const body = await readBody(req)

  const result = await query(
    `INSERT INTO phone_verifications (
       user_id,
       phone,
       code,
       verified,
       expires_at,
       verified_at,
       attempts
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      body.userId,
      normalizePhone(body.phone),
      body.code,
      Boolean(body.verified),
      body.expiresAt || null,
      body.verifiedAt || null,
      Number.isFinite(Number(body.attempts)) ? Number(body.attempts) : 0,
    ]
  )

  return json(res, 200, { verification: result.rows[0] })
}

const handleHealth = (req, res) => {
  if (req.method !== 'GET') {
    return errorResponse(res, 405, 'Method not allowed')
  }

  return json(res, 200, {
    ok: true,
    databaseConfigured: isDatabaseConfigured(),
  })
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value))
    res.statusCode = 204
    res.end()
    return
  }

  try {
    const { segments, url } = getRequestContext(req)

    if (segments.length === 0 || segments[0] === 'health') {
      return handleHealth(req, res)
    }

    if (segments[0] === 'auth' && segments[1] === 'google') {
      return handleAuthGoogle(req, res)
    }

    if (segments[0] === 'users') {
      return handleUsers(req, res, segments, url)
    }

    if (segments[0] === 'wallet') {
      return handleWallet(req, res, segments, url)
    }

    if (segments[0] === 'transactions') {
      return handleTransactions(req, res, segments, url)
    }

    if (segments[0] === 'transfers') {
      return handleTransfers(req, res)
    }

    if (segments[0] === 'contacts') {
      return handleContacts(req, res, segments, url)
    }

    if (segments[0] === 'achievements') {
      return handleAchievements(req, res, segments, url)
    }

    if (segments[0] === 'admin') {
      return handleAdmin(req, res, segments)
    }

    if (segments[0] === 'phone-verifications') {
      return handlePhoneVerifications(req, res)
    }

    return errorResponse(res, 404, 'Route not found')
  } catch (error) {
    console.error('API error:', error)
    return errorResponse(res, 500, error.message || 'Internal server error')
  }
}