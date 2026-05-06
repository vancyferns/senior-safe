# Authentication Errors - Debug Guide

## Issues Identified

You're experiencing three related authentication errors:

1. **401 Unauthorized on `/api/auth/google`**
2. **Cross-Origin-Opener-Policy (COOP) Policy Error**
3. **User sync failure** - cascading from auth failures

## Root Causes

### 1. Missing Environment Configuration
- **No `.env` file in `/workspaces/senior-safe/server/`** - Backend can't access `GOOGLE_CLIENT_ID`
- **Missing `VITE_API_BASE_URL`** - Frontend doesn't know where to send auth requests
- **Incomplete Google OAuth setup** - Client IDs not configured

### 2. Backend Issues
The `/api/auth/google` endpoint requires:
```javascript
// server/server.js line 305-337
const { credential, user: fallbackUser = {} } = req.body
await verifyGoogleCredential({ credential, fallbackUser })
// Need: GOOGLE_CLIENT_ID environment variable
```

**What fails:**
- When `GOOGLE_CLIENT_ID` is not set, `OAuth2Client` isn't initialized
- Backend can't verify the Google credential
- Returns 401 with "Google credential verification failed"

### 3. CORS/COOP Policy Error
The browser's Cross-Origin-Opener-Policy header is blocking `window.postMessage()` calls needed for Google Sign-In widget communication.

**Why it occurs:**
- Google OAuth library uses `window.postMessage()` to communicate with popup windows
- Backend's CORS headers don't include COOP headers
- Cross-origin auth flows need explicit COOP headers

## Solution Steps

### Step 1: Get Your Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure as **Web Application**
6. Add authorized origins:
   - `http://localhost:5173` (for local dev)
   - `http://localhost:3001` (for backend)
   - Your production domain (when deployed)
7. Copy the **Client ID** and **Client Secret**

### Step 2: Create Backend Environment File

Create `/workspaces/senior-safe/server/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-from-step-1
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database (example for local PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/senior_safe

# Or use Neon (recommended for production)
# DATABASE_URL=postgresql://neondb_owner:npg_XXX@ep-xxx.region.neon.tech/neondb?sslmode=require
```

### Step 3: Create Frontend Environment File

Create `/workspaces/senior-safe/.env`:

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id-from-step-1

# API Configuration
VITE_API_BASE_URL=http://localhost:3001

# Supabase (optional - only if using Supabase fallback)
# VITE_SUPABASE_URL=your-supabase-url
# VITE_SUPABASE_ANON_KEY=your-supabase-key

# Optional APIs
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_PHONE_EMAIL_CLIENT_ID=your-phone-email-client-id
```

### Step 4: Fix CORS/COOP Headers in Backend

Update `/workspaces/senior-safe/server/server.js` to add proper CORS and COOP headers:

**Find this section** (around line 10):
```javascript
// Middleware
app.use(cors())
app.use(express.json())
```

**Replace with**:
```javascript
// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.VITE_FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
}))

// Add COOP headers for Google OAuth
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  next()
})

app.use(express.json())
```

### Step 5: Verify Backend Configuration

Update `server/lib/google.js` logging to help debug:

The file already has proper credential verification. Ensure it initializes correctly:

```javascript
// Verify this section (lines 4-6):
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim()
const oauthClient = googleClientId ? new OAuth2Client(googleClientId) : null

// Issue: If GOOGLE_CLIENT_ID is not set, oauthClient is null
// and verification will fail
```

Add debug logging by updating the backend to log when credentials are missing:

**In `server/server.js` around line 305**:
```javascript
app.post('/api/auth/google', async (req, res) => {
  if (!isDatabaseConfigured()) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' })
  }

  // Add this debug line
  console.log('Auth request received. GOOGLE_CLIENT_ID configured:', !!process.env.GOOGLE_CLIENT_ID)

  const { credential, user: fallbackUser = {} } = req.body || {}
  
  if (!credential && !fallbackUser.id) {
    return res.status(400).json({ error: 'No credential or fallback user provided' })
  }

  try {
    // ... rest of the code
  } catch (error) {
    console.error('Google auth error:', error.message)
    res.status(401).json({ error: error.message || 'Google credential verification failed' })
  }
})
```

### Step 6: Test the Auth Flow

1. **Start backend**:
   ```bash
   cd server
   npm install
   npm start
   # Should see: "Server running on port 3001"
   # Should see: "Auth request received. GOOGLE_CLIENT_ID configured: true"
   ```

2. **Start frontend** (in new terminal):
   ```bash
   npm i
   npm run dev
   # Should see: "VITE v5.x.x ready in xxx ms"
   # Check console for: "Backend configured: http://localhost:3001"
   ```

3. **Test in browser**:
   - Open `http://localhost:5173`
   - Click "Sign in with Google"
   - Should see popup (not blocked by COOP)
   - Should redirect to dashboard after login

## Troubleshooting Checklist

| Issue | Check | Solution |
|-------|-------|----------|
| 401 on auth endpoint | `process.env.GOOGLE_CLIENT_ID` | Set in `/server/.env` |
| COOP policy error | Browser Security tab in DevTools | Update CORS headers in server |
| "API base URL not configured" | `VITE_API_BASE_URL` | Set in `/.env` |
| 403 "Unauthorized popup" | Google Console OAuth settings | Add `http://localhost:5173` to authorized origins |
| "Request failed" in console | Backend server running? | Ensure `npm start` in `/server` |
| Backend not loading env | `.env` in right directory? | Create `/server/.env` (not `/server/lib/.env`) |

## Verification Commands

```bash
# Check backend can read environment
curl http://localhost:3001/api/admin/stats

# Check CORS headers
curl -i http://localhost:3001/api/auth/google -X OPTIONS

# Grep for GOOGLE_CLIENT_ID usage
grep -r "GOOGLE_CLIENT_ID" server/

# Verify env files exist
ls -la /workspaces/senior-safe/server/.env
ls -la /workspaces/senior-safe/.env
```

## Key Files Modified

1. `/workspaces/senior-safe/server/.env` ← **Create this** (Backend secrets)
2. `/workspaces/senior-safe/.env` ← **Create this** (Frontend env vars)
3. `/workspaces/senior-safe/server/server.js` ← Update CORS headers (line ~10)
4. `/workspaces/senior-safe/server/server.js` ← Add debug logging (line ~305)

## Next Steps

1. Create `.env` files with actual credentials
2. Update CORS headers as shown above
3. Restart both frontend and backend
4. Test the Google Sign-In flow
5. Check browser console for remaining errors

---

**Note**: The auth context automatically falls back to localStorage when backend isn't available, so the app can still function in demo mode without full backend configuration.
