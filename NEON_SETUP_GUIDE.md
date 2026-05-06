# Neon Setup Guide - Complete Step-by-Step Process

This guide assumes your frontend and backend are **already deployed**. We'll set up Neon and wire everything together.

---

## 📋 Prerequisites Check

Before starting, verify you have:

- ✅ Frontend deployed (e.g., `your-frontend.vercel.app`)
- ✅ Backend API deployed (e.g., `your-api.vercel.app`)
- ✅ Google OAuth Client ID
- ✅ Neon account (sign up at https://console.neon.tech)

---

## Step 1: Create a Neon Project

### 1.1 Sign Up / Log In

1. Go to **[https://console.neon.tech](https://console.neon.tech)**
2. Click **Sign up** (if new) or **Sign in** (if existing)
3. Create account using email or GitHub
4. No credit card required for free tier ✅

### 1.2 Create a New Project

1. Click **+ New Project** button
2. Choose a name (e.g., "senior-safe")
3. Select compute size: **Free tier** (recommended)
4. Click **Create project**
5. Wait for project to initialize (~30 seconds)

### 1.3 Get Your Connection String

After project creation, you'll see the dashboard:

1. Click the **Connection string** tab
2. You'll see: `postgresql://user:password@host/database?sslmode=require`
3. **Copy the full connection string** - you'll need it for the migration
4. Store it safely (you'll use it in Step 2)

**Example**:
```
postgresql://neondb_owner:dGVhbWFrbmZaUFZs@ep-tiny-butterfly-a5g8j5em.us-east-1.neon.tech/neondb?sslmode=require
```

---

## Step 2: Run the Database Migration

You have **3 options** to run the migration. Choose the easiest for you:

### Option A: Using Neon's SQL Editor (Easiest - No Tools Required)

1. In Neon console, click **SQL Editor** (left sidebar)
2. A blank SQL editor opens
3. Go to GitHub: `/workspaces/senior-safe/neon_migrations/001_initial_schema.sql`
4. **Copy the entire file contents**
5. Paste into the Neon SQL Editor
6. Click **Execute** (or press Ctrl+Enter)
7. Wait for completion (~5-10 seconds)
8. ✅ All tables created!

### Option B: Using psql Command Line (If You Have PostgreSQL Installed)

```bash
# Set your connection string as environment variable
export DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Run the migration
psql $DATABASE_URL -f neon_migrations/001_initial_schema.sql

# Verify tables were created
psql $DATABASE_URL -c "\dt"
```

You should see:
```
List of relations
 Schema |         Name         |       Type       | Owner
--------+----------------------+------------------+-------
 public | achievement_stats    | table            | ...
 public | contacts             | table            | ...
 public | phone_verifications  | table            | ...
 public | transactions         | table            | ...
 public | users                | table            | ...
 public | wallets              | table            | ...
```

### Option C: Using DBeaver GUI (Visual, User-Friendly)

1. Download [DBeaver](https://dbeaver.io/) (free)
2. Click **New Database Connection** → **PostgreSQL**
3. Fill in details from your Neon connection string:
   - **Server Host**: Copy from connection string (e.g., `ep-tiny-butterfly-a5g8j5em.us-east-1.neon.tech`)
   - **Port**: `5432`
   - **Database**: `neondb` (or whatever is in your string)
   - **Username**: `neondb_owner`
   - **Password**: Copy from connection string
   - **SSL required**: Check this box
4. Click **Test Connection** → **OK**
5. Right-click database → **Execute SQL Script**
6. Select `neon_migrations/001_initial_schema.sql`
7. Execute and wait for completion

---

## Step 3: Configure Your Deployed Backend

Your backend API needs the Neon connection string to query the database.

### 3.1 Add to Vercel (or your hosting platform)

#### If using Vercel:

1. Go to **[https://vercel.com](https://vercel.com)**
2. Select your deployed backend project
3. Go to **Settings** → **Environment Variables**
4. Add two new variables:

| Variable Name | Value |
|---------------|-------|
| `DATABASE_URL` | Paste your Neon connection string from Step 1.3 |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |

Example:
```
DATABASE_URL=postgresql://neondb_owner:dGVhbWFrbmZaUFZs@ep-tiny-butterfly-a5g8j5em.us-east-1.neon.tech/neondb?sslmode=require
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
```

5. Click **Save**
6. **Important**: Redeploy your backend for changes to take effect:
   - Go to **Deployments** tab
   - Click the three dots (...) on the latest deployment
   - Click **Redeploy**
   - Wait for deployment to complete (~2-3 minutes)

#### If using other hosting (Railway, Heroku, etc):

1. Go to your hosting dashboard
2. Find the backend project settings
3. Add environment variables `DATABASE_URL` and `GOOGLE_CLIENT_ID`
4. Redeploy/restart the application

---

## Step 4: Configure Your Deployed Frontend

Your frontend needs to know where the API is deployed.

### 4.1 Add to Vercel (or your hosting platform)

#### If using Vercel:

1. Go to **[https://vercel.com](https://vercel.com)**
2. Select your deployed frontend project
3. Go to **Settings** → **Environment Variables**
4. Add this variable:

| Variable Name | Value |
|---------------|-------|
| `VITE_API_BASE_URL` | Your deployed backend API URL |

Example:
```
VITE_API_BASE_URL=https://your-api.vercel.app
```

5. Click **Save**
6. **Important**: Redeploy your frontend:
   - Go to **Deployments** tab
   - Click the three dots (...) on the latest deployment
   - Click **Redeploy**
   - Wait for deployment to complete (~2-3 minutes)

#### If using other hosting:

1. Go to your frontend hosting dashboard
2. Add `VITE_API_BASE_URL` environment variable
3. Redeploy/rebuild the application

---

## Step 5: Verify Everything Works

### 5.1 Test the Database Connection

In Neon console, run this query:

```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(DISTINCT user_id) as users_with_wallets
FROM users 
FULL OUTER JOIN wallets ON users.id = wallets.user_id;
```

Should return: `0 users, 0 wallets` (empty database is expected for new projects)

### 5.2 Test the API

Open your browser and go to:

```
https://your-api.vercel.app/api/health
```

You should see:
```json
{
  "ok": true,
  "databaseConfigured": true
}
```

If `databaseConfigured` is `false`, the API can't find `DATABASE_URL`. Re-check Step 3.

### 5.3 Test the Frontend

1. Open **https://your-frontend.vercel.app**
2. Click **Sign in with Google**
3. After signing in, check if you can:
   - ✅ See your profile (go to Profile page)
   - ✅ See your wallet balance (should show 10,000)
   - ✅ Add a contact
   - ✅ Send money to another user

### 5.4 Check Neon Database After Testing

Run this query in Neon SQL Editor to see data:

```sql
-- Check users created
SELECT id, email, name, created_at FROM users;

-- Check wallets created
SELECT user_id, balance FROM wallets;

-- Check transactions
SELECT * FROM transactions;
```

---

## Step 6: Monitor & Debug

### 6.1 Check Backend Logs

If something isn't working:

#### In Vercel:

1. Go to your backend project
2. Click **Deployments** → Latest deployment
3. Click **Runtime logs** tab
4. Look for error messages

### 6.2 Test API Routes Directly

Use curl or Postman to test individual routes:

```bash
# Test user creation
curl -X POST https://your-api.vercel.app/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "credential": "your-google-token-here",
    "user": {
      "googleId": "123456",
      "email": "user@example.com",
      "name": "Test User",
      "givenName": "Test",
      "familyName": "User",
      "picture": "https://example.com/pic.jpg"
    }
  }'

# Should return user data with verified=false (unless you have Google Client ID for verification)
```

### 6.3 Check Frontend Environment Variable

In browser console (F12), run:

```javascript
console.log(import.meta.env.VITE_API_BASE_URL)
```

Should print your API URL. If `undefined`, the environment variable wasn't set correctly in Step 4.

---

## Step 7: Production Checklist

Before going live, verify:

- ✅ Neon database created and migrated
- ✅ Backend deployed with `DATABASE_URL` and `GOOGLE_CLIENT_ID` set
- ✅ Frontend deployed with `VITE_API_BASE_URL` set
- ✅ `/api/health` returns `ok: true, databaseConfigured: true`
- ✅ Can sign in with Google
- ✅ Can create wallet and add contacts
- ✅ Data persists in Neon database
- ✅ Neon project is active (not paused)

---

## Troubleshooting

### "Database URL not configured" in /api/health

**Problem**: `databaseConfigured` returns `false`

**Solution**:
1. Check Vercel backend settings → Environment Variables
2. Verify `DATABASE_URL` is set correctly (copy-paste from Neon)
3. Redeploy backend after adding the variable
4. Wait 2-3 minutes for new deployment to be live

### "Connection refused" or "cannot connect to database"

**Problem**: Connection fails immediately

**Solution**:
1. Verify Neon project is **active** (not paused)
2. Verify connection string is correct in `DATABASE_URL`
3. Verify SSL is enabled: connection string should have `?sslmode=require`
4. Check if your IP is allow-listed (Neon free tier has no IP restrictions)

### Frontend shows "User search requires backend API to be configured"

**Problem**: Frontend can't find the API

**Solution**:
1. Check Vercel frontend settings → Environment Variables
2. Verify `VITE_API_BASE_URL` is set (e.g., `https://your-api.vercel.app`)
3. Redeploy frontend after adding the variable
4. Clear browser cache (Ctrl+Shift+Del)
5. Hard refresh page (Ctrl+Shift+R)

### "UNIQUE constraint violation" on user creation

**Problem**: Can't create duplicate users

**Solution**: This is expected behavior - you can't create two users with the same email. Use a different email for testing.

### No data persists after signing in

**Problem**: Data appears in app but doesn't save to database

**Solution**:
1. Check if `-X-User-ID` header is being sent from frontend
2. Check backend logs for errors
3. Verify `DATABASE_URL` has correct credentials
4. Run a test query in Neon SQL Editor: `SELECT * FROM users;`

---

## Next Steps

After Neon is working:

1. **Enable Row-Level Security (RLS)** for production:
   - See `neon_migrations/001_initial_schema.sql` for RLS policy examples
   - Disable demo mode: uncomment RLS sections

2. **Set up automated backups**:
   - Neon keeps 7 days of backups by default
   - Enable automatic or manual backup snapshots in Neon console

3. **Monitor performance**:
   - Use Neon console → Monitoring tab
   - Check query performance and database size

4. **Scale as needed**:
   - Upgrade from free tier to paid plan as your user base grows
   - Add read replicas for high-traffic scenarios

---

## Quick Reference

### Environment Variables Checklist

| Service | Variable | Where to Set | Example |
|---------|----------|--------------|---------|
| Backend | `DATABASE_URL` | Vercel Backend → Env Vars | `postgresql://...` |
| Backend | `GOOGLE_CLIENT_ID` | Vercel Backend → Env Vars | `123456789.apps.googleusercontent.com` |
| Frontend | `VITE_API_BASE_URL` | Vercel Frontend → Env Vars | `https://your-api.vercel.app` |
| Frontend | `VITE_GOOGLE_CLIENT_ID` | `.env` file (local only) | `123456789.apps.googleusercontent.com` |

### Database Connection String Format

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

From Neon example:
```
postgresql://neondb_owner:dGVhbWFrbmZaUFZs@ep-tiny-butterfly-a5g8j5em.us-east-1.neon.tech/neondb?sslmode=require
                 ↑ user                ↑ password         ↑ host                                ↑ database
```

### API Health Check

```bash
curl https://your-api.vercel.app/api/health
# Expected response:
# {"ok":true,"databaseConfigured":true}
```

---

## Support Resources

- **Neon Documentation**: https://neon.tech/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **SeniorSafe Migration Plan**: ../NEON_MIGRATION_PLAN.md
- **API Routes Reference**: ../api/[...path].js

---

**You're all set! Your SeniorSafe app is now powered by Neon Postgres. 🚀**
