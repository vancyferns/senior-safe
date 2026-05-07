# SeniorSafe Backend Migration Report

## What the app uses today

SeniorSafe is a React/Vite single-page app. Supabase is only used for persistence and lookup; the app already has `localStorage` fallbacks, so the frontend can still run without Supabase configured.

The Supabase client lives in [src/lib/supabase.js](src/lib/supabase.js) and is consumed by:

- [src/context/AuthContext.jsx](src/context/AuthContext.jsx) for creating or syncing the logged-in user.
- [src/context/WalletContext.jsx](src/context/WalletContext.jsx) for wallet balance, transactions, contacts, and P2P transfers.
- [src/context/AchievementContext.jsx](src/context/AchievementContext.jsx) for achievement progress syncing.
- [src/pages/Profile.jsx](src/pages/Profile.jsx) for phone updates and verification state.
- [src/pages/SendMoney.jsx](src/pages/SendMoney.jsx) and [src/pages/Dashboard.jsx](src/pages/Dashboard.jsx) for user search and phone lookup.

## Current schema

The schema is defined in [supabase/schema.sql](supabase/schema.sql) plus [supabase_migrations/create_phone_verifications.sql](supabase_migrations/create_phone_verifications.sql).

### Tables

- `users`
  - Google profile identity, email, phone, name fields, avatar, timestamps.
  - Primary key is UUID.
  - `google_id` is the external identity key.
- `wallets`
  - One wallet per user.
  - `balance`, `upi_pin`, timestamps.
- `transactions`
  - Ledger rows for credits and debits.
  - Links sender and recipient user IDs for P2P transfers.
- `contacts`
  - Saved contacts per user.
  - Optional link to a registered user by `linked_user_id`.
- `achievement_stats`
  - Per-user gamification stats and unlocked achievement list.
- `phone_verifications` in the migration file
  - Temporary OTP/verification tracking for phone verification.

### View

- `user_stats`
  - Aggregate admin/analytics view for total users, balance, and transaction counts.

### Important schema detail

The SQL file enables row level security, but the policies currently use `USING (true)` / `WITH CHECK (true)`. That makes the schema behave like a demo backend rather than a production-secure backend.

## What this means for migration

The app is not tightly coupled to Supabase features like Storage or Edge Functions. The main dependency is the database API shape. That makes two migration paths realistic:

### Option A: Keep the relational model

Use a free Postgres provider such as Neon, then add a small backend layer on Vercel or Cloudflare Workers.

Why this fits:

- Preserves the current SQL schema almost directly.
- Keeps transactions, contacts, and achievement stats relational.
- Easier to preserve current behavior with less data-model rewrite.

Tradeoff:

- You should not expose the database directly from the browser.
- Supabase-style client calls need to move behind API routes or server actions.

### Option B: Move to Firebase

Use Firebase Auth + Firestore + Hosting.

Why this fits:

- Free tier is widely available and globally reachable.
- Good fit if you want a managed BaaS with client SDKs.
- No separate SQL server to operate.

Tradeoff:

- This requires a larger rewrite because the current schema is relational and Firestore is document-based.
- Joins like `contacts -> linked_user` and ledger-style queries need to be reworked.

## Recommended direction

For this codebase, the lowest-risk migration is:

1. Keep React/Vite frontend on Vercel.
2. Replace direct Supabase access with an API layer.
3. Use Neon Postgres for the database.
4. Keep Google login in the frontend if you want, but validate tokens on the server before writing user data.

That path preserves the current schema and makes the app globally reachable without depending on Supabase.

## What to change in code

- Replace the direct Supabase client in [src/lib/supabase.js](src/lib/supabase.js) with a thin repository layer that calls your API.
- Move `getOrCreateUser`, wallet updates, transaction creation, contact lookup, and achievement syncing to server endpoints.
- Remove the permissive client-side write pattern.
- Add a provider-neutral config layer such as `VITE_API_BASE_URL`.
- Keep `localStorage` as the offline fallback.

## Global deployment

The frontend is already a deployable SPA. [vercel.json](vercel.json) rewrites all routes to `index.html`, so a Vercel deployment link will work worldwide for the UI.

To make the data backend globally usable:

- Host the frontend on Vercel or another CDN-backed static host.
- Put the database in a cloud region with good global connectivity.
- Use HTTPS API endpoints for all persistence.
- Store secrets only in deployment environment variables.

## India-specific parts to revisit for worldwide users

The app currently has a few India-specific assumptions that should be generalized if you want a truly worldwide audience:

- `+91` phone formatting and normalization in [src/lib/supabase.js](src/lib/supabase.js) and [src/pages/Profile.jsx](src/pages/Profile.jsx).
- India-specific scam scenarios and prompts in [src/services/geminiService.js](src/services/geminiService.js) and [src/data/scamScenarios.js](src/data/scamScenarios.js).
- `en-IN` speech locale in [src/hooks/useSpeech.js](src/hooks/useSpeech.js).
- India-focused copy in the landing and developer pages.

## Short answer

If you want the smallest migration, choose a free Postgres provider like Neon and add an API layer. If you want the simplest managed global BaaS, move to Firebase, but expect a bigger rewrite.