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

## ✨ Implemented Features

### 🏦 Core Payment Simulations
- **Send Money**: Practice sending money to contacts with PIN verification
- **Scan QR Code**: Learn to scan and verify QR codes before payment
- **Receive Money**: Generate QR codes for receiving payments
- **P2P Cash Vouchers**: Create and share payment vouchers
- **Transaction History**: Track all practice transactions with detailed records
- **Contact Management**: Add and manage payment contacts with user verification

### 🛡️ Scam Awareness Lab
- **AI-Powered Scam Detection**: Real-time analysis of messages using Gemini AI
- **Interactive Scenarios**: Practice identifying phishing messages, fake calls, and fraudulent links
- **Scam Guide**: Comprehensive knowledge base of common scams
- **Live Feedback**: Instant explanations of why something is a scam
- **Progress Tracking**: Monitor scam identification accuracy

### 🎮 Gamification System
- **XP & Levels**: Earn experience points and level up (Beginner → Master)
- **Achievement Badges**: Unlock 10+ achievements for milestones
- **Daily Streaks**: Build consistency with streak tracking and rewards
- **Scratch Card Rewards**: Win XP or demo money every 7-day milestone
- **AI Motivational Messages**: Daily encouragement powered by Gemini AI
- **Progress Visualization**: Circular streak worm showing daily progress

### 💳 Financial Tools
- **EMI Calculator**: Calculate loan monthly payments with detailed breakdowns
- **Bill Payments**: Practice paying electricity, phone, and other bills
- **Loan Center**: Learn about different loan types and terms
- **Balance Management**: Virtual wallet with realistic balance tracking

### 👤 User Experience
- **Google Sign-In**: Easy authentication with Google OAuth
- **Profile Management**: Update phone number with verification status
- **Phone Verification**: FREE phone verification with Phone.Email integration
- **Verified Badge**: Phone numbers show verified/unverified status in Profile
- **UPI PIN Setup**: Practice PIN creation and verification
- **Responsive Design**: Mobile-first design optimized for seniors
- **Large UI Elements**: Easy-to-tap buttons and readable text
- **Visual Feedback**: Clear success/error states with animations

### 📱 Phone Verification System
- **Phone.Email Integration**: FREE phone verification service (no SMS API needed!)
- **Verified Status Storage**: Phone verification status saved to database
- **Visual Verification Badge**: Green "Verified" badge for verified phone numbers
- **Demo Mode**: Works without configuration using mock verification
- **Popup-based OTP**: Phone.Email handles OTP sending and verification

### 🤖 AI Integration
- **Gemini 2.5 Flash**: AI-powered features throughout the app
  - Scam message analysis
  - Dynamic scenario generation
  - Daily motivational messages
  - Personalized learning tips
  - Quiz question generation
- **Fallback Support**: Static scenarios used when AI quota exceeded

### 💾 Data Persistence
- **Supabase Backend**: Cloud database for user data
- **Local Storage**: Offline-first architecture
- **Real-Time Sync**: Automatic data synchronization
- **Cross-Device Access**: Access your progress anywhere
- **Phone Verified Status**: Database tracks phone verification

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
| **Backend** | Neon Postgres + Vercel Serverless Functions (NEW) |
| **Legacy Backend** | Supabase (PostgreSQL) - still supported |
| **Database Driver** | @neondatabase/serverless (for Neon) |
| **Auth** | Google OAuth 2.0 + google-auth-library |
| **AI** | Google Gemini AI (gemini-2.5-flash) |
| **Translation** | MyMemory API (FREE) |
| **Phone Verification** | Phone.Email (FREE, no SMS API) |
| **Icons** | Lucide React |
| **Animations** | React Confetti |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Google OAuth Client ID
- Gemini API Key (optional - has fallback)
- Phone.Email Client ID (optional - has demo mode)

**Backend Option (choose one):**
- **Neon + API** (recommended): Neon database + Vercel Functions
- **Supabase** (legacy): Direct Supabase connection
- **Demo Mode**: localStorage only (no backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/vancyferns/SeniorSafe.git
cd SeniorSafe

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### Option A: Neon + API Backend (Recommended)

1. **Create a Neon project** at [console.neon.tech](https://console.neon.tech)
2. **Run the migration**:
   ```bash
   psql $DATABASE_URL -f neon_migrations/001_initial_schema.sql
   ```
   Or paste the SQL from `neon_migrations/001_initial_schema.sql` into Neon's SQL Editor
3. **Add to `.env`**:
   ```
   VITE_API_BASE_URL=http://localhost:3000
   DATABASE_URL=postgresql://user:password@region.neon.tech/database?sslmode=require
   GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_PHONE_EMAIL_CLIENT_ID=your_phone_email_client_id
   ```

See [neon_migrations/README.md](neon_migrations/README.md) for complete Neon setup instructions.

**📌 Already have frontend and backend deployed?** Use our [**NEON_SETUP_GUIDE.md**](NEON_SETUP_GUIDE.md) for step-by-step deployment instructions with environment variable configuration for Vercel.

### Option B: Supabase Backend (Legacy)

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Run the schema**: Execute `supabase/schema.sql` in Supabase SQL Editor
3. **Add to `.env`**:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_PHONE_EMAIL_CLIENT_ID=your_phone_email_client_id
   ```

### Option C: Demo Mode (localStorage only)

Skip all backend setup. The app will work completely offline using localStorage:

```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GEMINI_API_KEY=your_gemini_api_key (optional - has fallback)
VITE_PHONE_EMAIL_CLIENT_ID=your_phone_email_client_id (optional - has demo)
```

### Run Development Server

```bash
# Start development server
npm run dev
```

### Build for Production

```bash
# Build the frontend
npm run build
npm run preview

# Deploy to Vercel (if using Neon + API)
vercel deploy
```

---

## 📞 Phone.Email Integration (FREE Phone Verification)

The project uses **Phone.Email** for phone number verification - a 100% FREE service that works like "Sign in with Google" for phone numbers!

### Why Phone.Email?
- ✅ **100% FREE** - No credit card required, ever
- ✅ **1000 SMS/month** - Free for first 6 months
- ✅ **No SMS API needed** - Phone.Email handles OTP sending
- ✅ **No telecom registration** - No DLT/10DLC required
- ✅ **200+ countries supported** - International phone verification
- ✅ **Simple integration** - Works like Google OAuth

### How to Set Up

1. Go to [admin.phone.email](https://admin.phone.email)
2. Create a free account
3. Register your website domain (e.g., `localhost` for dev)
4. Copy your **Client ID** from the Profile section
5. Add to `.env`: 
   ```
   VITE_PHONE_EMAIL_CLIENT_ID=your_client_id
   ```

### Development Mode
- If `VITE_PHONE_EMAIL_CLIENT_ID` is not set, the app uses **demo mode**
- Demo mode simulates phone verification without real SMS
- Perfect for development and testing

### How It Works
1. User clicks "Add Phone Number" in Profile
2. Phone.Email button appears in modal
3. User clicks → Phone.Email popup opens
4. User enters phone number and receives OTP
5. User verifies OTP in popup
6. Phone number saved with `phone_verified = true` in database
7. Profile shows green "Verified" badge

### Documentation
- [Phone.Email Docs](https://www.phone.email/docs-sign-in-with-phone)
- [Admin Dashboard](https://admin.phone.email)

---

## 🗄️ Database & Backend Architecture

### Frontend → Backend Communication

The frontend persistence layer (`src/lib/supabase.js`) now supports multiple backends:

1. **Neon + API** (NEW): Frontend calls REST API routes → API queries Neon Postgres
2. **Supabase** (Legacy): Frontend calls Supabase client directly
3. **localStorage** (Fallback): Works offline without any backend

The backend is auto-detected based on environment variables:
- `VITE_API_BASE_URL` → Use Neon + API path (recommended)
- `VITE_SUPABASE_URL` → Use Supabase (legacy)
- Neither → Use localStorage (demo mode)

### API Layer (`api/[...path].js`)

Vercel Serverless Functions that handle:
- **Auth**: `POST /api/auth/google` - Google credential verification
- **Users**: `/api/users/*` - User lookup, search, phone updates
- **Wallet**: `/api/wallet/*` - Balance, PIN, transactions
- **Transfers**: `POST /api/transfers` - P2P transfers with atomic transactions
- **Contacts**: `/api/contacts` - Contact management with user linking
- **Achievements**: `/api/achievements/stats` - Progress tracking
- **Admin**: `/api/admin/stats` - Platform analytics

### Database Schema

**Neon Setup** (Recommended):
```bash
psql $DATABASE_URL -f neon_migrations/001_initial_schema.sql
```

**Supabase Setup** (Legacy):
Run `supabase/schema.sql` in Supabase SQL Editor.

Both use the same PostgreSQL schema with these tables:
- `users`, `wallets`, `transactions`, `contacts`, `achievement_stats`, `phone_verifications`
- `user_stats` view for admin reporting

---

## 📱 Features Walkthrough

### For Seniors
1. **Sign in** with your Google account
2. **Complete onboarding** - Add and verify phone number
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

### Frontend (.env file)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth Client ID |
| `VITE_API_BASE_URL` | No | API base URL (for Neon path) |
| `VITE_SUPABASE_URL` | No | Supabase URL (legacy) |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase key (legacy) |
| `VITE_GEMINI_API_KEY` | No | Gemini AI API key |
| `VITE_PHONE_EMAIL_CLIENT_ID` | No | Phone.Email Client ID |

### Backend (.env for deployment)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes* | Neon Postgres connection string |
| `GOOGLE_CLIENT_ID` | Yes* | Google OAuth Client ID for server-side verification |

*Only required if using Neon + API backend.

**Note**: Only `VITE_GOOGLE_CLIENT_ID` is required for frontend. All other services have fallback modes. Database URLs are never exposed to the browser.

---

## 👥 Credits

### Developers

**Vancy Fernandes**
- Full Stack Developer
- GitHub: [@vancyferns](https://github.com/vancyferns)
- LinkedIn: [Vancy Agnes Fernandes](https://www.linkedin.com/in/vancy-agnes-fernandes-3b6215278/)

**Manesh Sharma**
- Full Stack Developer  
- GitHub: [@manesh-sharma](https://github.com/manesh-sharma)
- LinkedIn: [Manesh Sharma](https://www.linkedin.com/in/maneshsharma/)

---

## 📄 License

This project is built for educational purposes to help senior citizens adopt digital payments safely.

---

## 🙏 Acknowledgments

- **Senior Citizens**: For inspiring this solution
- **Google Gemini AI**: For powering intelligent features
- **Supabase**: For reliable backend infrastructure
- **Phone.Email**: For FREE phone verification service
- **MyMemory API**: For FREE translation services
- **Open Source Community**: For amazing tools and libraries

---

## 📞 Contact

Have feedback or suggestions? Connect with us through our profiles in the app's "Meet the Developers" section.

---

**Built with ❤️ for senior citizens of India**
