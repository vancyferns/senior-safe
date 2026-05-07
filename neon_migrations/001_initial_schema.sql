-- =============================================
-- SeniorSafe Database Schema for Neon Postgres
-- =============================================
-- Run this migration to set up the database:
--   psql $DATABASE_URL -f neon_migrations/001_initial_schema.sql
--
-- Or use Neon's SQL Editor in the console.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. USERS TABLE
-- Stores user profile data with local authentication
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,                        -- Email (optional for local auth)
    phone TEXT,                               -- Phone number (optional, for P2P lookup)
    preferred_language TEXT DEFAULT 'en',     -- UI language preference
    name TEXT,
    given_name TEXT,
    family_name TEXT,
    picture TEXT,                              -- Profile picture URL
    phone_verified BOOLEAN DEFAULT FALSE,     -- Phone verification status
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- =============================================
-- 2. WALLETS TABLE
-- Stores user wallet balance and PIN
-- =============================================
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) DEFAULT 10000.00,   -- Default demo balance
    upi_pin TEXT DEFAULT NULL,                 -- UPI PIN (null = not set)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- =============================================
-- 3. TRANSACTIONS TABLE
-- Stores all transaction history (ledger)
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('DEBIT', 'CREDIT')),
    description TEXT,
    to_name TEXT,                              -- Recipient/sender name for display
    recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- For P2P: who received
    sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,     -- For P2P: who sent
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups and ordering
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_recipient ON transactions(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- =============================================
-- 4. CONTACTS TABLE
-- Stores user contacts with optional links to registered users
-- =============================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    picture TEXT,
    linked_user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- If contact is a registered user
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_linked_user ON contacts(linked_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;

-- =============================================
-- 5. ACHIEVEMENT_STATS TABLE
-- Stores user achievement progress and gamification stats
-- =============================================
CREATE TABLE IF NOT EXISTS achievement_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_transactions INTEGER DEFAULT 0,
    scams_identified INTEGER DEFAULT 0,
    qr_scans INTEGER DEFAULT 0,
    vouchers_sent INTEGER DEFAULT 0,
    bills_paid INTEGER DEFAULT 0,
    loan_calculations INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    unlocked_achievements TEXT[] DEFAULT '{}',  -- Array of achievement IDs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievement_stats_user_id ON achievement_stats(user_id);

-- =============================================
-- 6. PHONE_VERIFICATIONS TABLE
-- Stores temporary OTP/verification state for phone verification workflow
-- =============================================
CREATE TABLE IF NOT EXISTS phone_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    attempts INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_user_phone ON phone_verifications(user_id, phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires_at ON phone_verifications(expires_at) WHERE expires_at IS NOT NULL;

-- =============================================
-- 7. USER_STATS VIEW
-- Aggregate view for admin/analytics reporting
-- =============================================
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COALESCE(SUM(w.balance), 0) as total_balance,
    COUNT(t.id) as total_transactions,
    (SELECT COUNT(*) FROM transactions WHERE type = 'DEBIT') as total_debits,
    (SELECT COUNT(*) FROM transactions WHERE type = 'CREDIT') as total_credits
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
LEFT JOIN transactions t ON u.id = t.user_id;

-- =============================================
-- 8. HELPER FUNCTION: Update timestamps
-- Automatically updates the updated_at column when a row is modified
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 9. TRIGGERS: Apply timestamp updates
-- =============================================
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_achievement_stats_updated_at ON achievement_stats;
CREATE TRIGGER update_achievement_stats_updated_at
    BEFORE UPDATE ON achievement_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- Note: For this app, RLS is disabled by default (permissive for demo).
-- For production, enable RLS and add proper authentication policies.
-- =============================================

-- Disable RLS for demo (all queries are server-side validated)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE phone_verifications DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 11. VERIFY SCHEMA
-- These queries confirm the schema is set up correctly
-- =============================================

-- Show table information
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Show all indexes
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;

-- Show views
-- SELECT viewname FROM pg_views WHERE schemaname = 'public' ORDER BY viewname;

-- =============================================
-- NEXT STEPS
-- =============================================
-- 1. Set DATABASE_URL in your deployment environment
-- 2. Deploy the API layer (api/[...path].js) to Vercel
-- 3. Set VITE_API_BASE_URL to your deployed API URL
-- 4. Test the frontend with VITE_API_BASE_URL configured
-- 5. For production, enable RLS policies and strengthen auth
