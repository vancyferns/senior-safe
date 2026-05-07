# Complete Neon Database Setup Guide

This guide walks you through connecting your Neon database to SeniorSafe application.

## Step 1: Get Your Neon Connection String

### In Neon Console:
1. Go to https://console.neon.tech
2. Select your project or create a new one
3. Click **Connection Details** (top right)
4. Copy the connection string (looks like):
   ```
   postgresql://neondb_owner:password@ep-xxx.neon.tech/neondb?sslmode=require
   ```

### Store Connection String Securely:
- **Backend (.env)**: Store in `server/.env` 
- **Frontend**: NEVER put in frontend! Always use backend API

---

## Step 2: Configure Backend Environment

### Create `server/.env`:
```bash
# Database
DATABASE_URL=postgresql://neondb_owner:your_password@ep-xxx.neon.tech/neondb?sslmode=require

# Server
PORT=3001
NODE_ENV=development
```

### Test Connection:
```bash
cd server
npm run test-db
```

Expected output:
```
✅ Database connected successfully
Database: neondb
Ready to run migrations!
```

---

## Step 3: Run Database Migrations

### Initialize Neon Schema (ONE TIME ONLY):
```bash
# From root directory
psql $DATABASE_URL -f neon_migrations/001_initial_schema.sql
psql $DATABASE_URL -f neon_migrations/002_user_preferences.sql
```

Or run it manually in Neon Console:
1. Go to Neon console → SQL Editor
2. Copy content from `neon_migrations/001_initial_schema.sql`
3. Paste and execute

### Verify Tables Created:
```bash
psql $DATABASE_URL -c "\dt"
```

Should show:
```
         List of relations
Schema |        Name         | Type  | Owner
-------+---------------------+-------+----------
public | users               | table | neondb_owner
public | wallets             | table | neondb_owner
public | transactions        | table | neondb_owner
public | contacts            | table | neondb_owner
public | achievement_stats   | table | neondb_owner
```

---

## Step 4: Start Backend Server

### Development:
```bash
cd server
npm install
npm run dev
```

Expected output:
```
✅ Database configured
🚀 Server running on http://localhost:3001
🔌 Connected to Neon database
```

### Test Backend Health:
```bash
curl http://localhost:3001/api/health
```

Response:
```json
{"ok":true,"databaseConfigured":true}
```

---

## Step 5: Configure Frontend to Use Backend

### Update `.env.local`:
```env
# Point to local backend during development
VITE_API_BASE_URL=http://localhost:3001

# Or for production (after deploying backend):
# VITE_API_BASE_URL=https://your-deployed-backend.com
```

### Start Frontend:
```bash
npm run dev
```

Frontend will now use backend at `http://localhost:3001`

---

## Step 6: Test Full Authentication Flow

### Sign Up Test:
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210"
  }'
```

Expected response:
```json
{
  "user": {
    "id": "uuid-xxx",
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210"
  },
  "wallet": {
    "id": "wallet-uuid",
    "balance": 10000
  },
  "stats": {
    "totalTransactions": 0
  }
}
```

### Sign In Test:
```bash
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

---

## Step 7: Test via Frontend UI

1. Open http://localhost:5173
2. Click "Sign Up"
3. Enter:
   - **Name**: Your name
   - **Email**: test@example.com (or any email)
   - **Phone**: 9876543210 (optional)
4. Click **Create Account**
5. You should be redirected to dashboard ✅

### Verify in Neon:
```bash
psql $DATABASE_URL -c "SELECT id, name, email, phone FROM users LIMIT 5;"
```

---

## Step 8: Deploy to Production

### Backend Deployment (Render/Railway/Vercel):

1. **Create account** at https://render.com (or similar)
2. **Deploy server folder**:
   - Connect GitHub repo
   - Select branch `main`
   - Runtime: `Node`
   - Build: `npm install && npm run build`
   - Start: `npm run start`
3. **Add environment variables**:
   - `DATABASE_URL`: Your Neon connection string
   - `NODE_ENV`: `production`
4. Deploy and get URL like `https://your-backend.onrender.com`

### Frontend Deployment (Vercel):

1. Go to https://vercel.com
2. Import your GitHub repo
3. **Environment variables**:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com`
4. Deploy

---

## Complete Connection Architecture

```
┌─────────────────┐
│   Frontend      │ (http://localhost:5173)
│   React/Vite    │
└────────┬────────┘
         │ fetch requests
         │ VITE_API_BASE_URL
         ↓
┌─────────────────┐
│   Backend API   │ (http://localhost:3001)
│   Express.js    │
└────────┬────────┘
         │ SQL queries
         │ DATABASE_URL
         ↓
┌─────────────────┐
│  Neon Postgres  │
│  postgresql://  │
│  neon.tech      │
└─────────────────┘
```

---

## Troubleshooting

### "DATABASE_URL not configured"
- ✅ Create `server/.env` with `DATABASE_URL`
- ✅ Restart server: `npm run dev`

### "Connection refused"
- ✅ Check Neon console for live databases
- ✅ Verify password in connection string
- ✅ Check firewall allows connections

### "Relations don't exist"
- ✅ Run migrations: `psql $DATABASE_URL -f neon_migrations/001_initial_schema.sql`

### Frontend can't reach backend
- ✅ Set `VITE_API_BASE_URL=http://localhost:3001`
- ✅ Backend server must be running on port 3001
- ✅ Check browser console for errors

### "CORS error"
- ✅ Backend CORS already configured
- ✅ Verify frontend is making requests to backend URL

---

## Quick Start Checklist

- [ ] Get Neon connection string
- [ ] Create `server/.env` with `DATABASE_URL`  
- [ ] Run: `psql $DATABASE_URL -f neon_migrations/001_initial_schema.sql`
- [ ] Start backend: `cd server && npm run dev`
- [ ] Verify: `curl http://localhost:3001/api/health`
- [ ] Set `VITE_API_BASE_URL=http://localhost:3001` in `.env.local`
- [ ] Start frontend: `npm run dev`
- [ ] Test sign up at http://localhost:5173/auth

That's it! 🎉
