# SeniorSafe Neon Migration Plan

## Goal

Replace the current Supabase-backed persistence with a free Postgres provider such as Neon, while keeping the React/Vite frontend and the existing offline `localStorage` fallback.

## Recommended architecture

- Frontend: Vercel-hosted React/Vite app.
- Database: Neon Postgres.
- API: Vercel Serverless Functions, Cloudflare Workers, or a small Node API.
- Auth: Google ID token from the current frontend, verified server-side before any write.

This keeps the app globally accessible through the deployed link and avoids exposing the database directly to the browser.

## Current Supabase dependency map

The app currently uses Supabase only for app data, not for storage buckets or edge functions.

- [src/context/AuthContext.jsx](src/context/AuthContext.jsx): user creation/sync.
- [src/context/WalletContext.jsx](src/context/WalletContext.jsx): wallet, transactions, contacts, PIN, transfer flow.
- [src/context/AchievementContext.jsx](src/context/AchievementContext.jsx): achievement stats sync.
- [src/pages/Profile.jsx](src/pages/Profile.jsx): phone update and verification status.
- [src/pages/SendMoney.jsx](src/pages/SendMoney.jsx): user search.

## Database table mapping

### `users`

Current fields:

- `id` UUID primary key
- `google_id`
- `email`
- `phone`
- `name`
- `given_name`
- `family_name`
- `picture`
- `created_at`
- `updated_at`
- `phone_verified` from the migration file

Neon usage:

- Keep the same table and columns.
- Add an index on `google_id`, `email`, and `phone`.
- Keep `google_id` unique.

### `wallets`

Current fields:

- `id` UUID primary key
- `user_id`
- `balance`
- `upi_pin`
- `created_at`
- `updated_at`

Neon usage:

- Keep as-is.
- Make `user_id` unique to preserve one wallet per user.
- Update balance and PIN only through API routes.

### `transactions`

Current fields:

- `id` UUID primary key
- `user_id`
- `amount`
- `type`
- `description`
- `to_name`
- `recipient_user_id`
- `sender_user_id`
- `created_at`

Neon usage:

- Keep as-is.
- Use it as the ledger for all credits and debits.
- Add indexes for `user_id`, `created_at`, `recipient_user_id`, and `sender_user_id`.

### `contacts`

Current fields:

- `id` UUID primary key
- `user_id`
- `name`
- `phone`
- `email`
- `picture`
- `linked_user_id`
- `created_at`

Neon usage:

- Keep as-is.
- Use `linked_user_id` to connect contacts to registered users.
- Add a uniqueness rule for `(user_id, linked_user_id)` when linked.

### `achievement_stats`

Current fields:

- `id` UUID primary key
- `user_id`
- `total_transactions`
- `scams_identified`
- `qr_scans`
- `vouchers_sent`
- `bills_paid`
- `loan_calculations`
- `total_xp`
- `unlocked_achievements`
- `created_at`
- `updated_at`

Neon usage:

- Keep as-is.
- Upsert by `user_id`.

### `phone_verifications`

Current fields from migration:

- `id`
- `user_id`
- `phone`
- `code`
- `verified`
- `created_at`
- `expires_at`
- `verified_at`
- `attempts`

Neon usage:

- Store one-time verification workflow state.
- Mark expired records server-side.

### `user_stats` view

Current role:

- Aggregate reporting for total users, total balance, and transaction counts.

Neon usage:

- Recreate the view or replace it with an API analytics endpoint.

## API route mapping

These routes are the cleanest replacement for the current Supabase helper functions.

### Auth and profile

- `POST /api/auth/google`
  - Input: Google ID token or decoded credential payload.
  - Action: verify token, create or update user row, create wallet if missing.
  - Replaces: `getOrCreateUser`.
- `GET /api/users/me`
  - Input: server-verified user identity.
  - Action: return the current profile.
  - Replaces: `getUserById`.
- `PATCH /api/users/me/phone`
  - Input: phone number and verified flag.
  - Action: update `phone` and `phone_verified`.
  - Replaces: `updateUserPhone`.

### Wallet

- `GET /api/wallet`
  - Action: return wallet balance and PIN status.
  - Replaces: `getWallet`.
- `PATCH /api/wallet/balance`
  - Input: new balance or delta.
  - Action: update balance in a transaction.
  - Replaces: `updateWalletBalance`.
- `PATCH /api/wallet/pin`
  - Input: new PIN.
  - Action: store or update transaction PIN.
  - Replaces: `updateWalletPin`.

### Transactions

- `GET /api/transactions`
  - Action: list user transactions.
  - Replaces: `getTransactions`.
- `POST /api/transactions`
  - Input: amount, type, description, recipient info.
  - Action: create transaction row and update wallet.
  - Replaces: `addTransactionToDb`.
- `POST /api/transfers`
  - Input: recipient ID, amount, recipient name.
  - Action: atomic sender debit, recipient credit, and ledger entries.
  - Replaces: `transferToUser`.

### Contacts and search

- `GET /api/contacts`
  - Action: list saved contacts with linked user info.
  - Replaces: `getContacts`.
- `POST /api/contacts`
  - Input: name, phone, email, linked user ID.
  - Action: create contact if not already linked.
  - Replaces: `addContactToDb`.
- `GET /api/users/search?q=...`
  - Action: search users by name or email.
  - Replaces: `searchUsers`.
- `GET /api/users/by-phone?phone=...`
  - Action: find user by phone.
  - Replaces: `findUserByPhone`.
- `GET /api/users/by-email?email=...`
  - Action: find user by email.
  - Replaces: `findUserByEmail`.

### Achievements

- `GET /api/achievements/stats`
  - Action: load or create achievement stats.
  - Replaces: `getOrCreateAchievementStats`.
- `PUT /api/achievements/stats`
  - Action: upsert achievement progress.
  - Replaces: `updateAchievementStats`.

### Verification and reporting

- `POST /api/phone-verifications`
  - Action: create and track OTP verification state.
  - Maps to: `phone_verifications` table.
- `GET /api/admin/stats`
  - Action: return aggregate totals for admin/dashboard use.
  - Replaces: `getPlatformStats` / `user_stats` view.

## Frontend mapping

The browser should stop calling Supabase directly and instead call the API layer.

Suggested client changes:

- Replace `src/lib/supabase.js` with a provider-neutral data client.
- Keep the function names if you want to reduce UI churn, but make them call `fetch` against `VITE_API_BASE_URL`.
- Keep the `localStorage` fallback exactly as-is for offline mode.

## Data flow by feature

### Login

1. User signs in with Google.
2. Frontend receives Google credential.
3. Frontend sends credential to `POST /api/auth/google`.
4. API verifies the token, creates or updates the user, and creates a wallet if needed.
5. API returns the canonical user record.

### Send money

1. Frontend validates amount and PIN locally.
2. Frontend sends a transfer request to `POST /api/transfers`.
3. API loads both wallets, checks balance, writes two ledger rows, and updates both balances inside a transaction.
4. API returns the new balances.

### Contacts

1. Frontend asks `GET /api/contacts`.
2. API joins contact rows to linked users.
3. Frontend renders the enriched list.

### Achievements

1. Frontend loads `GET /api/achievements/stats`.
2. API creates the record if it does not exist.
3. Frontend pushes updates with `PUT /api/achievements/stats`.

## Deployment plan

1. Create a Neon project.
2. Run the current schema on Neon with minor adjustments for server-side validation.
3. Deploy the API on Vercel or Cloudflare Workers.
4. Set `VITE_API_BASE_URL` in the frontend deployment.
5. Keep the SPA hosted on Vercel so the deployed link remains globally accessible.

## Implementation order

1. Add the API layer.
2. Point the frontend to the API.
3. Move auth/profile first.
4. Move wallets and transactions next.
5. Finish contacts and achievements.
6. Remove direct Supabase dependencies after parity is confirmed.

## Notes for global access

- Remove India-specific phone normalization if you want full international support.
- Generalize currency display if the product is no longer INR-only.
- Keep Gemini and translation services configurable by region.

## Short version

Neon is a strong fit because the current app is already built around relational tables. The main work is moving Supabase helper calls into API routes and validating Google identity server-side before writing anything to the database.