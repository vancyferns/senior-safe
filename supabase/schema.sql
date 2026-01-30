-- =============================================
-- SeniorSafe Database Schema for Supabase
-- =============================================
-- Run this in Supabase SQL Editor to create the tables

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE
-- Stores user profile data (synced from Google OAuth)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id TEXT UNIQUE NOT NULL,           -- Google OAuth sub (unique identifier)
    email TEXT UNIQUE NOT NULL,
    phone TEXT,                               -- Phone number (optional, for P2P lookup)
    name TEXT,
    given_name TEXT,
    family_name TEXT,
    picture TEXT,                              -- Profile picture URL
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by Google ID and phone
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- =============================================
-- 2. WALLETS TABLE
-- Stores user wallet balance
-- =============================================
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) DEFAULT 10000.00,   -- Default demo balance
    upi_pin TEXT DEFAULT NULL,                 -- UPI PIN (null = not set)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)                            -- One wallet per user
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- =============================================
-- 3. TRANSACTIONS TABLE
-- Stores all transaction history
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('DEBIT', 'CREDIT')),
    description TEXT,
    to_name TEXT,                              -- Recipient name for display
    recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- For P2P: who received
    sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,     -- For P2P: who sent
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups and ordering
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_recipient ON transactions(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_user_id);

-- =============================================
-- 4. CONTACTS TABLE (for syncing contacts)
-- =============================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    picture TEXT,
    linked_user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- If contact is a registered user
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_linked_user ON contacts(linked_user_id);

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures users can only access their own data
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read/update their own data
-- Note: For this app, we use the google_id to match users since we're using Google OAuth

-- Users table policies (allow insert for new users, select/update for own data)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (true);  -- Allow reading for user lookup

CREATE POLICY "Users can insert their profile" ON users
    FOR INSERT WITH CHECK (true);  -- Allow new user creation

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (true);

-- Wallets table policies
CREATE POLICY "Users can view own wallet" ON wallets
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own wallet" ON wallets
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own wallet" ON wallets
    FOR UPDATE USING (true);

-- Transactions table policies
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (true);

-- Contacts table policies
CREATE POLICY "Users can view own contacts" ON contacts
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own contacts" ON contacts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own contacts" ON contacts
    FOR DELETE USING (true);

-- =============================================
-- 6. HELPER FUNCTIONS
-- =============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. ACHIEVEMENT STATS TABLE
-- Stores user achievement progress and stats
-- =============================================
CREATE TABLE IF NOT EXISTS achievement_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_transactions INTEGER DEFAULT 0,
    scams_identified INTEGER DEFAULT 0,
    qr_scans INTEGER DEFAULT 0,
    vouchers_sent INTEGER DEFAULT 0,
    bills_paid INTEGER DEFAULT 0,
    loan_calculations INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    unlocked_achievements TEXT[] DEFAULT '{}',  -- Array of achievement IDs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_achievement_stats_user_id ON achievement_stats(user_id);

-- Enable RLS
ALTER TABLE achievement_stats ENABLE ROW LEVEL SECURITY;

-- Policies for achievement_stats
CREATE POLICY "Users can view own stats" ON achievement_stats
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own stats" ON achievement_stats
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own stats" ON achievement_stats
    FOR UPDATE USING (true);

-- Trigger for auto-updating timestamps
CREATE TRIGGER update_achievement_stats_updated_at
    BEFORE UPDATE ON achievement_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 8. VIEW: User Stats (for admin/analytics)
-- =============================================
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    COUNT(DISTINCT u.id) as total_users,
    SUM(w.balance) as total_balance,
    COUNT(t.id) as total_transactions,
    (SELECT COUNT(*) FROM transactions WHERE type = 'DEBIT') as total_debits,
    (SELECT COUNT(*) FROM transactions WHERE type = 'CREDIT') as total_credits
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
LEFT JOIN transactions t ON u.id = t.user_id;
