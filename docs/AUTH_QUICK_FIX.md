# 🔐 SeniorSafe Authentication Quick Fix Guide

## Your Errors Explained

```
❌ Cross-Origin-Opener-Policy policy would block the window.postMessage call
❌ senior-safe-backend.onrender.com/api/auth/google... 401 Unauthorized  
❌ Error syncing user with backend: Error: Request failed
```

### Root Causes
1. **Missing environment configuration** - No `.env` file with `GOOGLE_CLIENT_ID`
2. **Incorrect CORS headers** - Backend not sending proper COOP headers
3. **Backend not running** - Or running without database connection

---

## ⚡ 3-Minute Fix

### 1. Get Google Credentials
Go to https://console.cloud.google.com/:
- Create OAuth 2.0 Client ID (Web Application)
- Add `http://localhost:5173` and `http://localhost:3001` to authorized origins
- Copy your Client ID (looks like: `123456789-abcdefg.apps.googleusercontent.com`)

### 2. Create Server Environment File
Create `/workspaces/senior-safe/server/.env`:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
DATABASE_URL=postgresql://user:password@localhost:5432/senior_safe
```

### 3. Create Frontend Environment File  
Create `/workspaces/senior-safe/.env`:
```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_API_BASE_URL=http://localhost:3001
```

### 4. Restart Services
```bash
# Terminal 1 - Backend
cd /workspaces/senior-safe/server
npm install
npm start

# Terminal 2 - Frontend  
cd /workspaces/senior-safe
npm install
npm run dev
```

### 5. Test
- Visit `http://localhost:5173`
- Click "Sign in with Google"
- Should see popup window (not blocked)
- After login, should see dashboard

---

## 🧪 Verify Your Setup

Run this diagnostic script:
```bash
bash /workspaces/senior-safe/debug-auth.sh
```

It will check:
- ✓ Environment files exist
- ✓ GOOGLE_CLIENT_ID is set
- ✓ DATABASE_URL is configured
- ✓ Backend is running
- ✓ Frontend is running

---

## 🔍 Common Problems & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` on `/api/auth/google` | GOOGLE_CLIENT_ID not set | Set in `/server/.env` |
| `COOP policy would block window.postMessage` | Missing CORS headers | Backend already updated |
| `Failed to load resource: 401` | Database not configured | Set DATABASE_URL in `/server/.env` |
| `API base URL not configured` | VITE_API_BASE_URL not set | Set in `/.env` |
| `Cannot find module 'google-auth-library'` | Dependencies not installed | Run `npm install` in `/server` |
| `Google popup blocked` | Wrong origin in Google Console | Add `http://localhost:5173` to authorized origins |

---

## 📄 Files Modified

✅ **Fixed in this update:**
- `server/server.js` - Added CORS & COOP headers + debug logging
- `server/.env.local` - Template for server configuration
- `.env.development` - Template for frontend configuration

✅ **Created in this update:**
- `AUTHENTICATION_ERRORS_DEBUG.md` - Detailed explanation
- `debug-auth.sh` - Diagnostic script

---

## 🆘 Still Having Issues?

Check the detailed guide: [AUTHENTICATION_ERRORS_DEBUG.md](AUTHENTICATION_ERRORS_DEBUG.md)

Or run the diagnostic script:
```bash
bash debug-auth.sh
```

Then check:
1. Backend logs: `cd server && npm start` (look for "✅ Auth request")
2. Browser console: Press F12, go to Console tab
3. Network tab: Check `/api/auth/google` request status

---

## 📚 References

- Google Cloud Console: https://console.cloud.google.com/
- Neon Database (free): https://console.neon.tech/
- Supabase (free): https://supabase.com/
- Vite Environment Variables: https://vitejs.dev/guide/env-and-modes

---

## ✨ What Each File Does

**Frontend** (`VITE_` prefix in `.env`):
- `VITE_GOOGLE_CLIENT_ID` - Used by Google Sign-In widget on login page
- `VITE_API_BASE_URL` - Where frontend sends auth requests

**Backend** (no prefix in `server/.env`):
- `GOOGLE_CLIENT_ID` - Used to verify Google credentials (server-side verification)
- `DATABASE_URL` - Where to store user data after login
- `CORS headers` - Allow frontend to reach backend

---

**Last Updated:** May 6, 2026  
**Status:** ✅ All fixes applied
