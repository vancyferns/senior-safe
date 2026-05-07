# 🔐 SeniorSafe Authentication Flow Diagram

## Current Flow (After Fixes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER (http://localhost:5173)                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ 1. User clicks "Sign in with Google"
                                      │
                                      ▼
                    ┌──────────────────────────────────┐
                    │  Google OAuth Widget             │
                    │  (@react-oauth/google)          │
                    │                                  │
                    │  - Renders login button          │
                    │  - Handles OAuth flow            │
                    └──────────────────────────────────┘
                                      │
                                      │ 2. Google popup opens
                                      │    (COOP header allows this)
                                      │
                                      ▼
                    ┌──────────────────────────────────┐
                    │  Google Login Popup              │
                    │  (popup.google.com)              │
                    │                                  │
                    │  - User enters credentials       │
                    │  - Google verifies               │
                    │  - Returns JWT credential       │
                    └──────────────────────────────────┘
                                      │
                                      │ 3. Return credential via postMessage
                                      │    (COOP: same-origin-allow-popups enabled)
                                      │
                                      ▼
                    ┌──────────────────────────────────┐
                    │  AuthContext.handleGoogleSuccess │
                    │                                  │
                    │  - Receives credential JWT       │
                    │  - Decodes JWT locally           │
                    │  - Saves to localStorage         │
                    │  - Calls backend sync            │
                    └──────────────────────────────────┘
                                      │
                                      │ 4. POST /api/auth/google
                                      │    with credential
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER (http://localhost:3001)                   │
│                                                                              │
│  POST /api/auth/google                                                     │
│  ├─ Receive: { credential: JWT, user: fallbackUser }                       │
│  │                                                                          │
│  ├─ Step 1: Verify GOOGLE_CLIENT_ID is configured ✅ FIXED                │
│  │           └─ If missing: return 500 "Server not configured"             │
│  │                                                                          │
│  ├─ Step 2: Verify credential with OAuth2Client                           │
│  │           ├─ Call Google's verify endpoint                             │
│  │           ├─ Returns verified payload { sub, email, name, ... }        │
│  │           └─ If invalid: return 401 "Verification failed"              │
│  │                                                                          │
│  ├─ Step 3: Map Google payload to user object                             │
│  │           ├─ googleId: payload.sub                                      │
│  │           ├─ email: payload.email                                       │
│  │           ├─ name: payload.name                                         │
│  │           └─ picture: payload.picture                                   │
│  │                                                                          │
│  ├─ Step 4: Upsert user to database                                        │
│  │           ├─ Check if user exists by googleId or email                 │
│  │           ├─ If exists: update user                                     │
│  │           └─ If new: insert user                                        │
│  │                                                                          │
│  ├─ Step 5: Ensure wallet exists                                           │
│  │           ├─ Check if wallet for user_id exists                        │
│  │           └─ If none: create with balance 10000                        │
│  │                                                                          │
│  ├─ Step 6: Ensure achievement stats exist                                 │
│  │           ├─ Check if achievement_stats for user_id exists             │
│  │           └─ If none: create with 0 stats                              │
│  │                                                                          │
│  └─ Return: {                                                              │
│      verified: true,                                                       │
│      user: { id, email, name, picture, ... },                             │
│      wallet: { id, balance, upiPin, ... },                                │
│      stats: { totalXP, achievements, ... }                                │
│    }                                                                        │
│                                                                              │
│  ✅ CORS Headers Added:                                                    │
│  ├─ Cross-Origin-Opener-Policy: same-origin-allow-popups                  │
│  ├─ Cross-Origin-Embedder-Policy: require-corp                            │
│  └─ X-Frame-Options: SAMEORIGIN                                           │
│                                                                              │
│  ✅ Debug Logging Added:                                                   │
│  ├─ Request timestamp                                                      │
│  ├─ Whether GOOGLE_CLIENT_ID is configured                               │
│  ├─ Credential status                                                      │
│  ├─ Verification success/failure                                           │
│  └─ User sync status with email                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ 5. Response: { user, wallet, stats }
                                      │
                                      ▼
                    ┌──────────────────────────────────┐
                    │  Frontend Auth Context            │
                    │                                  │
                    │  - setUser(data.user)            │
                    │  - setDbUser(full response)      │
                    │  - Save to localStorage          │
                    │  - Redirect to /dashboard        │
                    └──────────────────────────────────┘
                                      │
                                      │ 6. Session active
                                      │
                                      ▼
                    ┌──────────────────────────────────┐
                    │  Dashboard Page                  │
                    │                                  │
                    │  - Display user profile          │
                    │  - Show wallet balance           │
                    │  - Load achievements             │
                    └──────────────────────────────────┘
```

---

## Error Handling Flow

```
┌──────────────────────┐
│  User clicks login   │
└──────────┬───────────┘
           │
           ▼
   ┌───────────────┐
   │ Is COOP error?│──YES──► Add CORS/COOP headers ✅ FIXED
   └────────┬──────┘         └──────► Retry login
            │
           NO
            │
            ▼
   ┌────────────────────┐
   │ Is 401 error?      │
   └────────┬───────────┘
            │
      ┌─────┼─────────────┐
      │                   │
     YES                 NO
      │                   │
      ▼                   ▼
  Check:            Check:
  - GOOGLE_CLIENT_ID  - DATABASE_URL
  - Credential valid  - Network error
  - Server running    - Other
  
  FIX: Create .env
```

---

## Configuration Files Structure

```
/workspaces/senior-safe/
├── .env                          ← Frontend config (REQUIRED)
│   ├── VITE_GOOGLE_CLIENT_ID    ← From Google Cloud Console
│   └── VITE_API_BASE_URL        ← Backend URL
│
└── server/
    ├── .env                      ← Backend config (REQUIRED)
    │   ├── GOOGLE_CLIENT_ID     ← Same as frontend
    │   ├── DATABASE_URL         ← PostgreSQL connection
    │   └── NODE_ENV             ← development/production
    │
    ├── server.js                ← ✅ CORS/COOP headers added here
    │
    └── lib/
        ├── google.js            ← Google credential verification
        └── db.js                ← Database helper
```

---

## What's Fixed ✅

| Issue | Root Cause | Solution | Status |
|-------|-----------|----------|--------|
| COOP error | Missing headers | Added COOP headers to server | ✅ |
| 401 on auth | No GOOGLE_CLIENT_ID | Added validation + error message | ✅ |
| Lost debug info | No logging | Added structured debug logging | ✅ |
| Unclear setup | No templates | Created env templates + guides | ✅ |
| Hard to diagnose | No diagnostic tool | Created debug-auth.sh | ✅ |

---

## Example Environment Setup

### Frontend: `.env`
```env
VITE_GOOGLE_CLIENT_ID=849274648721-b9c8defg1234567890abcdefghij.apps.googleusercontent.com
VITE_API_BASE_URL=http://localhost:3001
```

### Backend: `server/.env`
```env
GOOGLE_CLIENT_ID=849274648721-b9c8defg1234567890abcdefghij.apps.googleusercontent.com
DATABASE_URL=postgresql://postgres:password@localhost:5432/senior_safe
```

---

## Testing the Auth Flow

```bash
# 1. Start backend
cd server
npm install
npm start
# Should see: "Server running on port 3001"
# Should see debugging logs when auth requests come in

# 2. Start frontend (new terminal)
cd ..
npm install
npm run dev
# Should see: "VITE v5.x.x ready in xxx ms"

# 3. Test in browser
# Open http://localhost:5173
# Click "Sign in with Google"
# Should see:
#   - Popup window opens (no browser block message)
#   - Google login form appears
#   - After login, popup closes
#   - Redirected to /dashboard
#   - User profile shows email

# 4. Check logs
# Backend: Should see "✅ Google Auth Request..." and "✅ User synced successfully..."
# Frontend: Should see no 401/403 errors in console
```

---

## Security Headers Explained

### Cross-Origin-Opener-Policy: same-origin-allow-popups
- **Why**: OAuth flows need parent window (app) to communicate with popup window (Google login)
- **Value**: Allow popup communication but block other cross-origin access
- **Risk**: Low - widely used by Google, Facebook, Microsoft

### Cross-Origin-Embedder-Policy: require-corp
- **Why**: Prevents embedding resources without explicit CORS
- **Value**: Require Cross-Origin-Resource-Policy header for external resources
- **Risk**: Low - protects against data exfiltration

### X-Frame-Options: SAMEORIGIN
- **Why**: Prevents clickjacking attacks
- **Value**: Allow framing only from same origin
- **Risk**: None - standard security practice

---

## Quick Troubleshooting Map

```
Start ──► Backend running? ──NO──► npm start in /server
           │
          YES
           │
           ▼
        Frontend running? ──NO──► npm run dev in root
           │
          YES
           │
           ▼
        .env configured? ──NO──► Create .env files
           │
          YES
           │
           ▼
        Click login button
           │
           ▼
        Popup opens? ──NO──► COOP error (✅ Fixed)
           │
          YES
           │
           ▼
        Login with Google
           │
           ▼
        Redirected? ──NO──► Check browser console
           │                └──► 401? Check GOOGLE_CLIENT_ID
           │                └──► 500? Check DATABASE_URL
          YES
           │
           ▼
        ✅ SUCCESS!
```

---

**Last Updated:** May 6, 2026  
**All Fixes Applied:** ✅ Yes
