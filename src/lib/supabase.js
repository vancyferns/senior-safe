import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  )
}

// Debug fetch wrapper: logs full response body for non-OK responses.
// This helps capture PostgREST error bodies (e.g., 406) during development
// and in deployed environments where console logs are available.
const debugFetch = async (input, init) => {
  const res = await fetch(input, init)
  if (!res.ok) {
    try {
      const contentType = res.headers.get('content-type') || ''
      let body
      if (contentType.includes('application/json')) {
        body = await res.json()
      } else {
        body = await res.text()
      }
      console.error('[Supabase Debug] Request failed', {
        url: typeof input === 'string' ? input : input.url,
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body
      })
    } catch (e) {
      console.error('[Supabase Debug] Failed reading response body', e)
    }
  }
  return res
}

// Create client with custom fetch so we can capture failing response bodies
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  fetch: debugFetch,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey || ''
  }
})

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey)
}

// =============================================
// USER MANAGEMENT
// =============================================

/**
 * Get or create a user in the database based on Google OAuth data
 */
export const getOrCreateUser = async (googleUserData) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, skipping user sync')
    return { user: null, error: 'Supabase not configured' }
  }

  try {
    // First, try to find existing user by Google ID
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleUserData.id)
      .single()

    if (existingUser) {
      // Update user info if needed
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name: googleUserData.name,
          email: googleUserData.email,
          picture: googleUserData.picture,
          given_name: googleUserData.givenName,
          family_name: googleUserData.familyName,
        })
        .eq('google_id', googleUserData.id)
        .select()
        .single()

      return { user: updatedUser || existingUser, error: updateError }
    }

    // User doesn't exist, create new user
    if (fetchError && fetchError.code === 'PGRST116') {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          google_id: googleUserData.id,
          email: googleUserData.email,
          name: googleUserData.name,
          given_name: googleUserData.givenName,
          family_name: googleUserData.familyName,
          picture: googleUserData.picture,
        })
        .select()
        .single()

      if (newUser) {
        // Create wallet for new user
        await createWallet(newUser.id)
        // Create default contacts
        await createDefaultContacts(newUser.id)
      }

      return { user: newUser, error: insertError }
    }

    return { user: null, error: fetchError }
  } catch (error) {
    console.error('Error in getOrCreateUser:', error)
    return { user: null, error }
  }
}

// =============================================
// WALLET MANAGEMENT
// =============================================

/**
 * Create a new wallet for a user with default balance
 */
export const createWallet = async (userId) => {
  const { data, error } = await supabase
    .from('wallets')
    .insert({
      user_id: userId,
      balance: 10000.00 // Default demo balance
    })
    .select()
    .single()

  return { wallet: data, error }
}

/**
 * Get wallet for a user
 */
export const getWallet = async (userId) => {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  return { wallet: data, error }
}

/**
 * Update wallet balance
 */
export const updateWalletBalance = async (userId, newBalance) => {
  const { data, error } = await supabase
    .from('wallets')
    .update({ balance: newBalance })
    .eq('user_id', userId)
    .select()
    .single()

  return { wallet: data, error }
}

/**
 * Update wallet PIN
 */
export const updateWalletPin = async (userId, newPin) => {
  const { data, error } = await supabase
    .from('wallets')
    .update({ upi_pin: newPin })
    .eq('user_id', userId)
    .select()
    .single()

  return { wallet: data, error }
}

// =============================================
// TRANSACTION MANAGEMENT
// =============================================

/**
 * Add a new transaction
 */
export const addTransactionToDb = async (userId, amount, type, description, toName, recipientUserId = null, senderUserId = null) => {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      amount,
      type,
      description,
      to_name: toName,
      recipient_user_id: recipientUserId,
      sender_user_id: senderUserId
    })
    .select()
    .single()

  return { transaction: data, error }
}

/**
 * P2P Transfer - Transfer money from one user to another
 * This creates transactions for both users and updates both wallets
 */
export const transferToUser = async (senderId, senderName, recipientId, recipientName, amount) => {
  try {
    // 1. Get sender's wallet
    const { wallet: senderWallet, error: senderWalletError } = await getWallet(senderId)
    if (senderWalletError || !senderWallet) {
      return { success: false, error: 'Could not find sender wallet' }
    }

    // 2. Check sufficient balance
    const senderBalance = parseFloat(senderWallet.balance)
    if (senderBalance < amount) {
      return { success: false, error: 'Insufficient balance' }
    }

    // 3. Get recipient's wallet
    const { wallet: recipientWallet, error: recipientWalletError } = await getWallet(recipientId)
    if (recipientWalletError || !recipientWallet) {
      return { success: false, error: 'Could not find recipient wallet' }
    }

    const recipientBalance = parseFloat(recipientWallet.balance)

    // 4. Update sender's balance (deduct)
    const { error: senderUpdateError } = await updateWalletBalance(senderId, senderBalance - amount)
    if (senderUpdateError) {
      return { success: false, error: 'Failed to update sender balance' }
    }

    // 5. Update recipient's balance (add)
    const { error: recipientUpdateError } = await updateWalletBalance(recipientId, recipientBalance + amount)
    if (recipientUpdateError) {
      // Rollback sender's balance
      await updateWalletBalance(senderId, senderBalance)
      return { success: false, error: 'Failed to update recipient balance' }
    }

    // 6. Create DEBIT transaction for sender
    await addTransactionToDb(
      senderId,
      amount,
      'DEBIT',
      `Sent to ${recipientName}`,
      recipientName,
      recipientId,  // recipient_user_id
      null          // sender_user_id (not needed for sender's record)
    )

    // 7. Create CREDIT transaction for recipient
    await addTransactionToDb(
      recipientId,
      amount,
      'CREDIT',
      `Received from ${senderName}`,
      senderName,
      null,         // recipient_user_id (not needed for recipient's record)
      senderId      // sender_user_id
    )

    return { 
      success: true, 
      senderNewBalance: senderBalance - amount,
      recipientNewBalance: recipientBalance + amount
    }

  } catch (error) {
    console.error('P2P Transfer error:', error)
    return { success: false, error: 'Transfer failed. Please try again.' }
  }
}

/**
 * Get all transactions for a user (ordered by most recent)
 */
export const getTransactions = async (userId, limit = 50) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  // Transform to match local format
  const transactions = data?.map(tx => ({
    id: tx.id,
    amount: parseFloat(tx.amount),
    type: tx.type,
    description: tx.description,
    toName: tx.to_name,
    date: tx.created_at,
    recipientUserId: tx.recipient_user_id,
    senderUserId: tx.sender_user_id
  })) || []

  return { transactions, error }
}

// =============================================
// CONTACTS MANAGEMENT
// =============================================

/**
 * Find a user by email (helper function for contacts)
 */
const findUserByEmailInternal = async (email) => {
  if (!email) return { user: null }
  
  const { data } = await supabase
    .from('users')
    .select('id, name, email, picture')
    .ilike('email', email)
    .single()

  return { user: data || null }
}

/**
 * Create initial empty contacts for new user (no defaults)
 */
export const createDefaultContacts = async (userId) => {
  // No default contacts - only real users will be added when transacting
  return { contacts: [], error: null }
}

/**
 * Get all contacts for a user
 * Fetches linked user data if available
 * Also checks if unlinked contacts match registered users by email
 */
export const getContacts = async (userId) => {
  const { data, error } = await supabase
    .from('contacts')
    .select(`
      *,
      linked_user:linked_user_id (
        id,
        name,
        email,
        picture
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error || !data) {
    return { contacts: [], error }
  }

  // For contacts without linked_user_id, try to find matching users by email
  const contacts = await Promise.all(data.map(async (c) => {
    // If already linked to a user, use that data
    if (c.linked_user) {
      return {
        id: c.id,
        name: c.linked_user.name || c.name,
        phone: c.phone || '',
        email: c.linked_user.email || c.email,
        picture: c.linked_user.picture || c.picture,
        userId: c.linked_user_id,
        isUser: true
      }
    }

    // If not linked but has email, try to find matching user
    if (c.email && !c.linked_user_id) {
      const { user: matchedUser } = await findUserByEmailInternal(c.email)
      if (matchedUser) {
        // Update the contact in database to link it
        await supabase
          .from('contacts')
          .update({ linked_user_id: matchedUser.id })
          .eq('id', c.id)

        return {
          id: c.id,
          name: matchedUser.name || c.name,
          phone: c.phone || '',
          email: matchedUser.email,
          picture: matchedUser.picture,
          userId: matchedUser.id,
          isUser: true
        }
      }
    }

    // Regular contact (not a registered user)
    return {
      id: c.id,
      name: c.name,
      phone: c.phone || '',
      email: c.email,
      picture: c.picture,
      userId: null,
      isUser: false
    }
  }))

  return { contacts, error: null }
}

/**
 * Add a new contact
 * Automatically links to registered user if email matches
 */
export const addContactToDb = async (userId, name, phone, email = null, picture = null, linkedUserId = null) => {
  // If no linkedUserId provided but email exists, try to find matching user
  let finalLinkedUserId = linkedUserId
  let finalPicture = picture
  let finalName = name

  if (!linkedUserId && email) {
    const { user: matchedUser } = await findUserByEmailInternal(email)
    if (matchedUser) {
      finalLinkedUserId = matchedUser.id
      finalPicture = matchedUser.picture || picture
      finalName = matchedUser.name || name
    }
  }

  // Check if contact already exists (by linked user id)
  if (finalLinkedUserId) {
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', userId)
      .eq('linked_user_id', finalLinkedUserId)
      .single()
    
    if (existing) {
      return { contact: existing, error: null, alreadyExists: true }
    }
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      user_id: userId,
      name: finalName,
      phone: phone || null,
      email: email || null,
      picture: finalPicture || null,
      linked_user_id: finalLinkedUserId || null
    })
    .select()
    .single()

  return { contact: data, error, linkedToUser: !!finalLinkedUserId }
}

// =============================================
// USER SEARCH
// =============================================

/**
 * Find a user by phone number
 */
export const findUserByPhone = async (phone) => {
  if (!phone || phone.length < 10) return { user: null, error: null }
  
  // Normalize phone: remove spaces, dashes, and country code prefix
  const normalizedPhone = phone.replace(/[\s-]/g, '').replace(/^\+91/, '')
  
  const { data, error } = await supabase
    .from('users')
    .select('id, google_id, name, email, picture, phone')
    .eq('phone', normalizedPhone)
    .single()

  if (data) {
    return {
      user: {
        id: data.id,
        googleId: data.google_id,
        name: data.name,
        email: data.email,
        picture: data.picture,
        phone: data.phone
      },
      error: null
    }
  }

  return { user: null, error }
}

/**
 * Update user's phone number
 */
export const updateUserPhone = async (userId, phone) => {
  if (!userId) return { user: null, error: 'User ID required' }
  
  // Normalize phone
  const normalizedPhone = phone?.replace(/[\s-]/g, '').replace(/^\+91/, '') || null
  
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ phone: normalizedPhone, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Supabase updateUserPhone error:', error)
      // Check if it's a column doesn't exist error
      if (error.message?.includes('phone') || error.code === '42703') {
        return { user: null, error: 'Database migration needed. Please contact support.' }
      }
      return { user: null, error: error.message || 'Failed to update phone' }
    }

    return { user: data, error: null }
  } catch (err) {
    console.error('updateUserPhone exception:', err)
    return { user: null, error: 'Network error. Please try again.' }
  }
}

/**
 * Find a user by email
 */
export const findUserByEmail = async (email) => {
  if (!email) return { user: null, error: null }
  
  const { data, error } = await supabase
    .from('users')
    .select('id, google_id, name, email, picture')
    .eq('email', email.toLowerCase())
    .single()

  if (data) {
    return {
      user: {
        id: data.id,
        googleId: data.google_id,
        name: data.name,
        email: data.email,
        picture: data.picture
      },
      error: null
    }
  }

  return { user: null, error }
}

/**
 * Search users by name or email
 * Returns users excluding the current user
 */
export const searchUsers = async (query, currentUserId) => {
  if (!query || query.length < 2) {
    return { users: [], error: null }
  }

  // Build the query - search by name or email (case insensitive)
  let queryBuilder = supabase
    .from('users')
    .select('id, google_id, name, email, picture')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10)

  // Exclude current user if provided
  if (currentUserId) {
    queryBuilder = queryBuilder.neq('id', currentUserId)
  }

  const { data, error } = await queryBuilder

  const users = data?.map(u => ({
    id: u.id,
    googleId: u.google_id,
    name: u.name,
    email: u.email,
    picture: u.picture
  })) || []

  return { users, error }
}

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, google_id, name, email, picture, phone')
    .eq('id', userId)
    .single()

  return { user: data, error }
}

// =============================================
// STATS & ANALYTICS
// =============================================

/**
 * Get overall platform stats (for admin dashboard)
 */
export const getPlatformStats = async () => {
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id', { count: 'exact' })

  const { data: wallets, error: walletsError } = await supabase
    .from('wallets')
    .select('balance')

  const totalBalance = wallets?.reduce((sum, w) => sum + parseFloat(w.balance), 0) || 0

  const { count: transactionCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })

  return {
    totalUsers: users?.length || 0,
    totalBalance,
    totalTransactions: transactionCount || 0,
    error: usersError || walletsError
  }
}

// =============================================
// ACHIEVEMENT STATS MANAGEMENT
// =============================================

/**
 * Get or create achievement stats for a user
 */
export const getOrCreateAchievementStats = async (userId) => {
  if (!isSupabaseConfigured()) {
    return { stats: null, error: 'Supabase not configured' }
  }

  try {
    // Try to get existing stats
    const { data: existingStats, error: fetchError } = await supabase
      .from('achievement_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingStats) {
      return { stats: existingStats, error: null }
    }

    // Stats don't exist, create new record
    if (fetchError && fetchError.code === 'PGRST116') {
      const { data: newStats, error: insertError } = await supabase
        .from('achievement_stats')
        .insert({
          user_id: userId,
          total_transactions: 0,
          scams_identified: 0,
          qr_scans: 0,
          vouchers_sent: 0,
          bills_paid: 0,
          loan_calculations: 0,
          total_xp: 0,
          unlocked_achievements: []
        })
        .select()
        .single()

      return { stats: newStats, error: insertError }
    }

    return { stats: null, error: fetchError }
  } catch (error) {
    console.error('Error in getOrCreateAchievementStats:', error)
    return { stats: null, error }
  }
}

/**
 * Update achievement stats for a user
 */
export const updateAchievementStats = async (userId, stats, unlockedAchievements) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data, error } = await supabase
      .from('achievement_stats')
      .upsert({
        user_id: userId,
        total_transactions: stats.totalTransactions || 0,
        scams_identified: stats.scamsIdentified || 0,
        qr_scans: stats.qrScans || 0,
        vouchers_sent: stats.vouchersSent || 0,
        bills_paid: stats.billsPaid || 0,
        loan_calculations: stats.loanCalculations || 0,
        total_xp: stats.totalXP || 0,
        unlocked_achievements: unlockedAchievements || []
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    return { stats: data, error }
  } catch (error) {
    console.error('Error updating achievement stats:', error)
    return { success: false, error }
  }
}

/**
 * Convert Supabase stats format to app format
 */
export const convertStatsFromDb = (dbStats) => {
  if (!dbStats) return null
  
  return {
    totalTransactions: dbStats.total_transactions || 0,
    scamsIdentified: dbStats.scams_identified || 0,
    qrScans: dbStats.qr_scans || 0,
    vouchersSent: dbStats.vouchers_sent || 0,
    billsPaid: dbStats.bills_paid || 0,
    loanCalculations: dbStats.loan_calculations || 0,
    totalXP: dbStats.total_xp || 0
  }
}
