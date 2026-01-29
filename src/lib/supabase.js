import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  )
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

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
 * Create default contacts for new user
 */
export const createDefaultContacts = async (userId) => {
  const defaultContacts = [
    { user_id: userId, name: "Raju Milkman", phone: "9876543210" },
    { user_id: userId, name: "Priya Granddaughter", phone: "9123456780" }
  ]

  const { data, error } = await supabase
    .from('contacts')
    .insert(defaultContacts)
    .select()

  return { contacts: data, error }
}

/**
 * Get all contacts for a user
 */
export const getContacts = async (userId) => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  // Transform to match local format
  const contacts = data?.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone
  })) || []

  return { contacts, error }
}

/**
 * Add a new contact
 */
export const addContactToDb = async (userId, name, phone) => {
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      user_id: userId,
      name,
      phone
    })
    .select()
    .single()

  return { contact: data, error }
}

// =============================================
// USER SEARCH
// =============================================

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
    .select('id, google_id, name, email, picture')
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
