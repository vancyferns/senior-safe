-- =============================================
-- ACHIEVEMENT STATS TABLE
-- Stores user progress for Scam Lab and achievements
-- =============================================

-- Create the achievement_stats table
CREATE TABLE IF NOT EXISTS achievement_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Stats counters
    total_transactions INTEGER DEFAULT 0,
    scams_identified INTEGER DEFAULT 0,
    qr_scans INTEGER DEFAULT 0,
    vouchers_sent INTEGER DEFAULT 0,
    bills_paid INTEGER DEFAULT 0,
    loan_calculations INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    
    -- Unlocked achievements (array of achievement IDs)
    unlocked_achievements TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user
    CONSTRAINT unique_user_stats UNIQUE (user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_achievement_stats_user_id ON achievement_stats(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE achievement_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own stats
CREATE POLICY "Users can read own stats" ON achievement_stats
    FOR SELECT
    USING (auth.uid()::text = user_id::text OR true);  -- Allow all reads for now (adjust based on your auth)

-- Policy: Users can insert their own stats
CREATE POLICY "Users can insert own stats" ON achievement_stats
    FOR INSERT
    WITH CHECK (true);  -- Allow inserts

-- Policy: Users can update their own stats
CREATE POLICY "Users can update own stats" ON achievement_stats
    FOR UPDATE
    USING (true);  -- Allow updates

-- Function to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_achievement_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on update
DROP TRIGGER IF EXISTS trigger_achievement_stats_updated_at ON achievement_stats;
CREATE TRIGGER trigger_achievement_stats_updated_at
    BEFORE UPDATE ON achievement_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_achievement_stats_updated_at();

-- Grant permissions (if using anon/authenticated roles)
GRANT SELECT, INSERT, UPDATE ON achievement_stats TO anon;
GRANT SELECT, INSERT, UPDATE ON achievement_stats TO authenticated;
