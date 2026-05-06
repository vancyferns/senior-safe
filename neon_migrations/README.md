# Neon Database Migrations

This directory contains SQL migrations to set up SeniorSafe with Neon Postgres as the backend.

## Setup Steps

### 1. Create a Neon Project

1. Go to [https://console.neon.tech](https://console.neon.tech)
2. Sign up for a free account (no credit card required)
3. Create a new Neon project
4. Copy the database connection string

### 2. Run the Migration

Choose one of the following methods:

#### Option A: Using `psql` (recommended for local testing)

```bash
export DATABASE_URL="postgresql://user:password@region.neon.tech/database?sslmode=require"
psql $DATABASE_URL -f neon_migrations/001_initial_schema.sql
```

#### Option B: Using Neon's SQL Editor

1. Open your Neon project dashboard
2. Click **SQL Editor** in the sidebar
3. Open `001_initial_schema.sql` in your text editor
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Execute**

#### Option C: Using a Database GUI

- **pgAdmin**: Connect to your Neon database, then run the SQL file
- **DBeaver**: Same process as pgAdmin
- **VS Code** with PostgreSQL extension

### 3. Verify the Schema

After running the migration, verify the tables were created:

```bash
psql $DATABASE_URL -c "\dt"
```

You should see:
- `users`
- `wallets`
- `transactions`
- `contacts`
- `achievement_stats`
- `phone_verifications`

### 4. Configure Environment Variables

Add these to your deployment environment (Vercel, Railway, etc.):

```env
# Database
DATABASE_URL=postgresql://user:password@region.neon.tech/database?sslmode=require

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id

# Frontend API Base URL
VITE_API_BASE_URL=https://your-deployed-api.vercel.app
```

### 5. Deploy the API

The API layer lives at `api/[...path].js` and is designed for Vercel:

```bash
# Deploy to Vercel (if using Vercel for hosting)
vercel deploy

# Or build and test locally:
npm run build
```

## Schema Overview

### Tables

- **users**: Google OAuth profiles and user data
- **wallets**: User balance and UPI PIN
- **transactions**: Ledger of all credits and debits
- **contacts**: Saved contacts with optional links to users
- **achievement_stats**: Gamification progress per user
- **phone_verifications**: Temporary OTP state for phone verification

### Indexes

All tables have appropriate indexes on:
- Foreign keys (`user_id`, `linked_user_id`, etc.)
- Search columns (`email`, `phone`, `google_id`)
- Time-based queries (`created_at`, `expires_at`)

### Triggers

Automatic `updated_at` timestamp updates on:
- `users`
- `wallets`
- `achievement_stats`

### View

- **user_stats**: Aggregate totals for admin/analytics

## Row-Level Security (RLS)

Currently **disabled** for demo/development. For production:

1. Enable RLS on all tables
2. Add policies that verify user identity server-side
3. Use the `x-user-id` header from the API layer to enforce ownership

Example production policy:

```sql
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON wallets
  FOR SELECT USING (
    auth.uid() = user_id  -- Requires Neon JWT extension or custom auth context
  );
```

## Rollback / Reset

To drop all tables and start fresh:

```bash
psql $DATABASE_URL << 'EOF'
DROP TABLE IF EXISTS phone_verifications CASCADE;
DROP TABLE IF EXISTS achievement_stats CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP VIEW IF EXISTS user_stats CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
EOF
```

Then re-run `001_initial_schema.sql`.

## Troubleshooting

### Connection refused

- Check `DATABASE_URL` is correct
- Ensure Neon project is active and not paused
- Verify your IP is allow-listed (if using IP restrictions)

### `UNIQUE constraint violation`

- The migration uses `gen_random_uuid()` which has a negligible collision risk
- If you encounter this during testing, you likely ran the migration twice on a non-empty database
- Run the rollback commands above and try again

### Missing tables after running migration

- Verify the entire SQL file executed without errors
- Check the SQL output for any error messages
- Ensure you have write permissions on the database

## Next Steps

1. Update `.env.example` with the new variable names (already done: `DATABASE_URL`, `GOOGLE_CLIENT_ID`)
2. Connect the frontend to the API by setting `VITE_API_BASE_URL`
3. Test locally with `npm run dev`
4. Deploy to Vercel

## Documentation

- [Neon Docs](https://neon.tech/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [SeniorSafe Migration Plan](../NEON_MIGRATION_PLAN.md)
- [Backend Migration Report](../DATABASE_MIGRATION_REPORT.md)
