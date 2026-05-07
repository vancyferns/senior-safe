# 🛡️ SeniorSafe - Digital Payment Learning Platform

A gamified, secure learning environment designed specifically for senior citizens in India to master UPI digital payments with confidence.

---

## 🎯 Problem Statement

Senior citizens in India face significant barriers when adopting digital payment systems:

- **Fear of Scams**: Lack of awareness about phishing, fake payment requests, and fraudulent UPI links
- **Complexity**: UPI interfaces can be overwhelming for first-time users
- **Risk of Real Money Loss**: No safe environment to practice without financial consequences
- **Limited Digital Literacy**: Traditional banking customers struggle with smartphone-based payments
- **Lack of Motivation**: No structured learning path or incentives to practice regularly

**SeniorSafe** addresses these challenges by providing a risk-free, engaging platform where seniors can learn, practice, and master digital payments at their own pace.

---

## ✨ Features

### 🏦 Core Payment Simulations
- **Send Money**: Practice sending money to contacts with PIN verification
- **Scan QR Code**: Learn to scan and verify QR codes before payment
- **Receive Money**: Generate QR codes for receiving payments
- **P2P Cash Vouchers**: Create and share payment vouchers
- **Transaction History**: Track all practice transactions with detailed records
- **Contact Management**: Add and manage payment contacts with user verification

### 🛡️ Scam Awareness Lab
- **AI-Powered Scam Detection**: Real-time analysis of messages using SambaNova AI
- **Interactive Scenarios**: Practice identifying phishing messages, fake calls, and fraudulent links
- **Scam Guide**: Comprehensive knowledge base of common scams
- **Live Feedback**: Instant explanations of why something is a scam
- **Progress Tracking**: Monitor scam identification accuracy

### 🎮 Gamification System
- **XP & Levels**: Earn experience points and level up (Beginner → Master)
- **Achievement Badges**: Unlock 10+ achievements for milestones
- **Daily Streaks**: Build consistency with streak tracking and rewards
- **Scratch Card Rewards**: Win XP or demo money every 7-day milestone
- **AI Motivational Messages**: Daily encouragement powered by SambaNova AI
- **Progress Visualization**: Circular streak worm showing daily progress

### 💳 Financial Tools
- **EMI Calculator**: Calculate loan monthly payments with detailed breakdowns
- **Bill Payments**: Practice paying electricity, phone, and other bills
- **Loan Center**: Learn about different loan types and terms
- **Balance Management**: Virtual wallet with realistic balance tracking

### 👤 User Experience
- **Local Authentication**: Email/Phone-based signup and signin
- **Profile Management**: Update phone number with verification status
- **Phone Verification**: Secure phone number verification
- **Verified Badge**: Phone numbers show verified/unverified status in Profile
- **UPI PIN Setup**: Practice PIN creation and verification
- **Responsive Design**: Mobile-first design optimized for seniors
- **Large UI Elements**: Easy-to-tap buttons and readable text
- **Visual Feedback**: Clear success/error states with animations

### � Database Integration
- **Neon PostgreSQL**: Cloud-hosted PostgreSQL database
- **Express Backend**: Node.js REST API server
- **Local Storage**: Offline-first architecture
- **Real-Time Sync**: Automatic data synchronization
- **Verified Status Storage**: Phone verification status saved to database

### 🤖 AI Integration
- **SambaNova AI (DeepSeek-V3.1)**: Free AI-powered features throughout the app
  - Scam message analysis
  - Dynamic scenario generation
  - Daily motivational messages
  - Personalized learning tips
  - Quiz question generation
- **Fallback Support**: Static scenarios used when AI is unavailable

### 💾 Data Persistence
- **Neon PostgreSQL**: Cloud database for user data
- **Local Storage**: Offline-first architecture
- **Real-Time Sync**: Automatic data synchronization
- **Cross-Device Access**: Access your progress anywhere
- **Secure Backend API**: Express server handles all data operations

### 🌐 Multi-Language Support
- **7 Indian Languages**: English, Hindi (हिंदी), Marathi (मराठी), Tamil (தமிழ்), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Bengali (বাংলা)
- **Language Selection**: Easy-to-use language picker in Profile settings with Save button
- **FREE Translation API**: Uses MyMemory Translation API (no billing required!)
- **AI Content Translation**: All AI-generated content is automatically translated to selected language
- **Strict Language Enforcement**: Ensures pure language output without mixing (no Hinglish)
- **Auto Cache Management**: Clears cached content when language is changed for fresh translations
- **Translated UI Elements**: Navigation, buttons, and labels adapt to selected language

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 19, Vite 7.3, Tailwind CSS v4 |
| **Backend** | Express.js (Node.js) |
| **Database** | Neon PostgreSQL |
| **AI Provider** | SambaNova (DeepSeek-V3.1 model) |
| **Translation** | MyMemory API (FREE) |
| **Icons** | Lucide React |
| **Animations** | React Confetti |
| **Authentication** | Local Email/Phone with JWT |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Neon PostgreSQL account (free tier available)
- SambaNova API Key (free tier available)

### Installation

```bash
# Clone the repository
git clone https://github.com/vancyferns/senior-safe.git
cd senior-safe

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..

# Create .env files
cp .env.example .env.local
```

### Database Setup

1. **Create a Neon project** at [console.neon.tech](https://console.neon.tech)
2. **Run migrations**:
   ```bash
   psql $DATABASE_URL -f neon_migrations/001_initial_schema.sql
   psql $DATABASE_URL -f neon_migrations/002_user_preferences.sql
   ```
   Or use the provided script:
   ```bash
   bash docs/setup-neon.sh
   ```

3. **Add to `server/.env`**:
   ```
   DATABASE_URL=postgresql://user:password@region.neon.tech/database?sslmode=require
   PORT=3001
   NODE_ENV=development
   ```

### Environment Configuration

**Frontend `.env.local`:**
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_SAMBANOVA_API_KEY=your_sambanova_api_key
```

**Backend `server/.env`:**
```env
DATABASE_URL=your_neon_connection_string
PORT=3001
NODE_ENV=development
```

### Get API Keys

**SambaNova AI** (Free tier available):
1. Visit [sambanova.ai](https://sambanova.ai)
2. Sign up for free account
3. Generate API key in dashboard
4. Add to `.env.local` as `VITE_SAMBANOVA_API_KEY`

### Run Development Servers

**Terminal 1 - Frontend:**
```bash
npm run dev
# Runs on http://localhost:5173
```

**Terminal 2 - Backend:**
```bash
cd server && npm run dev
# Runs on http://localhost:3001
```

### Build for Production

```bash
# Frontend
npm run build
npm run preview

# Backend (for deployment)
cd server
npm install
npm start
```

---

## � Authentication Flow

### Sign Up
1. User enters name, email, and/or phone
2. Backend validates and creates user in Neon database
3. User is logged in and proceeds to dashboard

### Sign In
1. User enters email or phone
2. Backend verifies credentials against Neon database
3. User session created and stored locally
4. Redirected to dashboard

### Database Schema
Users table includes:
- `id`, `email`, `phone`, `name`
- `given_name`, `family_name`, `picture`
- `phone_verified`, `preferred_language`
- `xp`, `level`, `streak_count`

---

## 🤖 AI Features

### How It Works
The app uses **SambaNova's free tier** with DeepSeek-V3.1 model:

1. **Scam Detection**: Analyzes user messages in real-time
2. **Scenario Generation**: Creates dynamic learning scenarios
3. **Quiz Creation**: Generates personalized quiz questions
4. **Motivation**: Provides daily encouragement messages
5. **Tips**: Generates financial literacy tips

### Fallback System
If SambaNova API is unavailable or rate-limited, the app gracefully falls back to pre-defined scenarios and messages.

---

## 📁 Project Structure

```
senior-safe/
├── docs/                          # Documentation & guides
│   ├── NEON_SETUP_GUIDE.md       # Complete Neon setup
│   ├── NEON_CONNECTION_SETUP.md  # Connection troubleshooting
│   ├── architecture.md           # System architecture
│   └── ...other guides
├── src/
│   ├── components/               # React components
│   ├── pages/                    # Page components
│   ├── context/                  # Auth & state management
│   ├── services/                 # AI and external services
│   │   ├── sambanovaService.js  # SambaNova AI client
│   │   ├── geminiService.js     # Backward compatibility wrapper
│   │   └── scamAnalyzer.js      # Scam detection logic
│   └── lib/
│       └── supabase.js          # Database client (now uses Neon via API)
├── server/
│   ├── server.js                # Express backend
│   ├── lib/
│   │   └── db.js                # Neon database connection
│   └── package.json
├── neon_migrations/              # Database migrations
│   ├── 001_initial_schema.sql
│   └── 002_user_preferences.sql
├── public/                       # Static assets
└── package.json
```

---

## 🗄️ Database

### Schema Tables
- `users`: User profiles, XP, levels, language preferences
- `wallets`: Virtual balance per user
- `transactions`: All practice transactions
- `contacts`: Saved payment contacts
- `achievement_stats`: User achievements and progress
- `phone_verifications`: Phone verification records

### Connection
Frontend → Express Backend → Neon PostgreSQL

All queries are made through the backend Express server for security. The frontend communicates via REST API endpoints.

---

## 📚 Documentation

All detailed guides are in the [`docs/`](docs/) folder:

- **[NEON_SETUP_GUIDE.md](docs/NEON_SETUP_GUIDE.md)** - Complete Neon setup and deployment
- **[NEON_QUICK_START.md](docs/NEON_QUICK_START.md)** - Quick reference for Neon
- **[architecture.md](docs/architecture.md)** - System architecture overview
- **[requirements.md](docs/requirements.md)** - Project requirements
- And many more troubleshooting and reference guides

---

## 🔗 Deployment

### Render (Current Production)
The backend is deployed on Render, frontend on Vercel:

1. Backend: `https://senior-safe-backend.onrender.com`
2. Frontend: Update `.env.local` with deployment URLs
3. All database connections use Neon PostgreSQL

### Environment Variables for Production
Update these in your deployment platform:
```
VITE_API_BASE_URL=https://senior-safe-backend.onrender.com
VITE_SAMBANOVA_API_KEY=your_api_key
```

---

## 📱 Features Walkthrough

### For Seniors
1. **Sign up or in** with your email or phone number
2. **Complete onboarding** - Setup profile and preferences
3. **Explore Dashboard** - See all available features
4. **Try Scam Lab** - Learn to identify scams
5. **Send demo money** - Practice transactions safely
6. **Build your streak** - Visit daily for rewards
7. **Unlock achievements** - Complete challenges for XP

### For Families
- Monitor progress through achievement tracking
- Safe environment - no real money involved
- Build confidence before using real UPI apps
- Verified phone number shows trust indicator

---

## 🎯 Impact

- **Risk-Free Learning**: Practice unlimited times with demo money
- **Scam Prevention**: Identify and avoid digital frauds
- **Confidence Building**: Gradual progression from beginner to expert
- **Engagement**: Gamification keeps users motivated
- **Accessibility**: Designed specifically for senior citizens

---

## 🔧 Environment Variables

### Frontend (.env.local)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Backend API base URL |
| `VITE_SAMBANOVA_API_KEY` | Yes | SambaNova AI API key |

### Backend (server/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (default: development) |

---

## 🐛 Troubleshooting

### Common Issues

**1. Backend won't start**
```bash
cd server
npm install
npm start
```

**2. Database connection error**
```bash
# Verify DATABASE_URL is set in server/.env
echo $DATABASE_URL
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**3. Frontend can't reach backend**
- Verify `VITE_API_BASE_URL` in `.env.local` matches your backend URL
- Check CORS settings in `server/server.js`
- Ensure backend is running on the correct port

**4. AI features not working**
- Verify `VITE_SAMBANOVA_API_KEY` is set correctly
- Check SambaNova dashboard for rate limits
- App has built-in fallback scenarios

See [docs/](docs/) folder for more troubleshooting guides.

---

## 👥 Credits

### Developers

**Vancy Fernandes**
- Full Stack Developer
- GitHub: [@vancyferns](https://github.com/vancyferns)

**Manesh Sharma**
- Full Stack Developer  
- GitHub: [@manesh-sharma](https://github.com/manesh-sharma)

---

## 📄 License

This project is built for educational purposes to help senior citizens adopt digital payments safely.

---

## 🙏 Acknowledgments

- **Senior Citizens**: For inspiring this solution
- **SambaNova AI**: For free tier access to DeepSeek model
- **Neon**: For reliable PostgreSQL database hosting
- **MyMemory API**: For FREE translation services
- **Open Source Community**: For amazing tools and libraries

---

## 📞 Support

For issues, questions, or feature requests, please open an issue on [GitHub Issues](https://github.com/vancyferns/senior-safe/issues).

---

**Built with ❤️ for senior citizens of India**
