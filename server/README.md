# SeniorSafe Backend API

A standalone Express.js backend server for SeniorSafe, powered by Neon PostgreSQL.

## Quick Start

### Local Development

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and GOOGLE_CLIENT_ID
npm run dev
```

Server runs on `http://localhost:3001`

Test it: `curl http://localhost:3001/api/health`

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require
GOOGLE_CLIENT_ID=your-google-client-id
PORT=3001
```

## Deployment Options

### Option 1: Railway (Recommended - Free tier available)

```bash
npm install -g railway
railway login
railway init
railway add
railway up
```

### Option 2: Render

1. Push code to GitHub
2. Go to https://render.com
3. Create new Web Service
4. Connect GitHub repo, select `/server` as root directory
5. Set environment variables
6. Deploy

### Option 3: Heroku

```bash
heroku create your-backend-name
git push heroku main
heroku config:set DATABASE_URL=your-neon-url
heroku config:set GOOGLE_CLIENT_ID=your-google-id
```

### Option 4: Vercel (Separate Backend Project)

1. Create new Vercel project
2. Import this repo
3. Set Root Directory to `server`
4. Add environment variables
5. Deploy

## API Routes

All routes return JSON. Base URL: `http://localhost:3001/api`

### Health Check
- `GET /api/health` - Returns `{ok: true, databaseConfigured: true}`

### Auth
- `POST /api/auth/google` - Verify Google credential and create/sync user

### Users
- `GET /api/users/search?q=...` - Search users by name/email
- `GET /api/users/by-phone?phone=...` - Find user by phone
- `GET /api/users/by-email?email=...` - Find user by email

### Wallet
- `GET /api/wallet?userId=...` - Get wallet balance
- `PATCH /api/wallet/balance` - Update balance
- `PATCH /api/wallet/pin` - Set UPI PIN

### Transactions
- `GET /api/transactions?userId=...` - List user transactions
- `POST /api/transactions` - Create transaction
- `POST /api/transfers` - P2P transfer (atomic)

### Contacts
- `GET /api/contacts?userId=...` - List contacts
- `POST /api/contacts` - Add contact

### Achievements
- `GET /api/achievements/stats?userId=...` - Get achievement stats
- `PUT /api/achievements/stats` - Update achievement stats

### Admin
- `GET /api/admin/stats` - Platform totals

## Frontend Configuration

Set `VITE_API_BASE_URL` to your deployed backend URL:

```env
# For local dev
VITE_API_BASE_URL=http://localhost:3001

# For production (e.g., Railway)
VITE_API_BASE_URL=https://your-backend-xyz.railway.app
```

## Troubleshooting

### "DATABASE_URL is not configured"
- Check that `.env` has the Neon connection string
- Verify the string starts with `postgresql://`

### "Connection refused"
- Ensure Neon project is active (not paused)
- Verify IP isn't blocked by Neon firewall

### Deployment fails with "Cannot find module"
- Run `npm install` in the server directory
- Update `package.json` with missing dependencies

## Architecture

```
server/
├── server.js              ← Main Express app
├── lib/
│   ├── db.js             ← Neon connection pooling
│   └── google.js         ← Google OAuth verification
├── package.json
└── .env.example
```

All routes are in `server.js`. Database logic is in `/lib`.

## Support

For issues or questions, see the main README.md in the parent directory.
