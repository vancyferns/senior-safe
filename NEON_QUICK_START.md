# Neon Quick Start - SQL Editor Method (5 Minutes)

No downloads, no CLI tools needed. Just copy-paste in your browser.

---

## Step 1: Get Your Neon Connection String (1 min)

1. Go to **[https://console.neon.tech](https://console.neon.tech)** → Sign up/Sign in
2. Click **+ New Project**
   - Name: `senior-safe`
   - Compute: `Free tier`
   - Click **Create project**
3. Wait for initialization (~30 sec)
4. On the dashboard, find **Connection string** section
5. **Copy the full string** that looks like:
   ```
   postgresql://neondb_owner:YOUR_PASSWORD@ep-xyz.us-east-1.neon.tech/neondb?sslmode=require
   ```
6. Save it somewhere temporarily (you'll need it in Step 3)

---

## Step 2: Run the Migration in SQL Editor (2 min)

1. Still in Neon console, click **SQL Editor** (left sidebar)
2. You'll see a blank SQL text area
3. Go to this file on your computer:
   ```
   /workspaces/senior-safe/neon_migrations/001_initial_schema.sql
   ```
   Open it and **copy the entire contents**
4. Paste into the Neon SQL Editor
5. Click **Execute** (or press Ctrl+Enter)
6. Wait ~5 seconds... you should see ✅ **Success**
7. Tables created! ✅

---

## Step 3: Add Environment Variables to Vercel (2 min)

### For Backend (API):

1. Go to **[https://vercel.com](https://vercel.com)** → Your backend project
2. Go to **Settings** → **Environment Variables**
3. Add these two:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Paste the connection string from Step 1 |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |

Example:
```
DATABASE_URL: postgresql://neondb_owner:dGVhbWFrbmZaUFZs@ep-tiny-butterfly-a5g8j5em.us-east-1.neon.tech/neondb?sslmode=require
GOOGLE_CLIENT_ID: 123456789.apps.googleusercontent.com
```

4. Click **Save**
5. Go to **Deployments** tab → Click three dots (...) on latest → **Redeploy**
6. Wait ~2-3 min for redeploy to complete

### For Frontend (UI):

1. Go to **[https://vercel.com](https://vercel.com)** → Your frontend project
2. Go to **Settings** → **Environment Variables**
3. Add this:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | Your backend API URL |

Example:
```
VITE_API_BASE_URL: https://your-api.vercel.app
```

4. Click **Save**
5. Go to **Deployments** tab → Click three dots (...) on latest → **Redeploy**
6. Wait ~2-3 min for redeploy to complete

---

## Step 4: Verify It Works (✅ Testing)

### Test the API:

Open in browser:
```
https://your-api.vercel.app/api/health
```

Should return:
```json
{"ok":true,"databaseConfigured":true}
```

### Test the Frontend:

1. Open **https://your-frontend.vercel.app**
2. Click **Sign in with Google**
3. After sign in, check:
   - Profile page loads ✅
   - Wallet shows balance ✅
   - Can add a contact ✅

### Check Database:

In Neon SQL Editor, run:
```sql
SELECT COUNT(*) as total_users FROM users;
```

Should show your new user! ✅

---

## Done! 🎉

Your app is now connected to Neon. All data will persist in the Postgres database.

### Troubleshooting

**"databaseConfigured is false"**
- Check Vercel backend: Settings → Environment Variables
- Verify `DATABASE_URL` is set (copy it exactly from Neon)
- Redeploy backend again

**"Cannot connect to backend"**
- Check Vercel frontend: Settings → Environment Variables
- Verify `VITE_API_BASE_URL` is set (should be your API URL)
- Redeploy frontend and hard refresh (Ctrl+Shift+R)

**No data saving to database**
- Run this in Neon SQL Editor: `SELECT * FROM users;`
- Should show your user after sign in
- If empty, check backend logs in Vercel

---

**That's it! You're all set.** 🚀
