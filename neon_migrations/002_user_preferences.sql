-- =============================================
-- SeniorSafe User Preference Migration
-- Adds persisted profile preferences for cross-device sync
-- =============================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

UPDATE users
SET preferred_language = COALESCE(preferred_language, 'en')
WHERE preferred_language IS NULL;