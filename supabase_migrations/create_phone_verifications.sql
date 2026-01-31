-- Migration: create phone_verifications table and add phone_verified column to users

-- Create phone_verifications table
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  phone text NOT NULL,
  code text NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  verified_at timestamptz,
  attempts integer DEFAULT 0
);

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_phone_verifications_user_phone ON public.phone_verifications (user_id, phone, created_at DESC);

-- Add phone_verified column to users table
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;

-- Note: Run this migration in Supabase SQL editor or via psql with appropriate permissions.
