# Implementation Plan - SeniorSafe

**Goal:** Build a "Flight Simulator" for Digital Payments using a frontend-only approach (React + Vite) to ensure zero cost and high accessibility.

## User Review Required
> [!IMPORTANT]
> **No Backend Strategy:** We will use `localStorage` to save user progress (Balance, Missions). This means data will NOT sync across devices. This is intentional for the "Hackathon/MVP" constraints.
> **Voice Support:** We will use the browser's native `Web Speech API`. Note that this works creating in Chrome/Edge/Safari but might behave slightly differently across browsers.

## Proposed Changes

### Core Infrastructure
#### [NEW] [package.json](file:///package.json)
- React, ReactDOM, Vite
- `lucide-react` (Icons)
- `react-confetti` (Rewards)
- `react-qr-reader` (Scanning simulation)
- `vite-plugin-pwa` (Offline Capabilities)
- `prop-types` (Type checking)

#### [NEW] [tailwind.config.js](file:///tailwind.config.js)
- Define custom colors:
    - `brand-blue`: For primary buttons.
    - `brand-green`: For success/money received.
    - `bg-surface`: `#F8FAFC` (Very light gray).
- **Theme:** Force Light Mode (disable dark mode).
- **Theme:** Force Light Mode (disable dark mode).
- extend `fontSize` for accessibility options.

#### [NEW] [vite.config.js](file:///vite.config.js)
- Register `VitePWA` plugin.
- Config: `registerType: 'autoUpdate'`, `manifest`: define name, theme_color, and icons.
- **Why:** Ensures the app caches assets and works when "Offline Mode" is active.

### State Management (The "Brain")
#### [NEW] [WalletContext.jsx](file:///src/context/WalletContext.jsx)
- `balance`: Number (Default 10000)
- `transactions`: Array of objects
- `missions`: Array of objects (Progress tracking)
- `settings`: Object (HighContrast, LarageText, Language)
- **Logic:** `useEffect` to save/load from `localStorage`.

### Components structure

#### UI Components (Accessible Primitives)
- `Button.jsx`: High contrast, large touch targets (min 48px).
- `Card.jsx`: Container with distinct borders.
- `SpeechBubble.jsx`: For the "AI Guide".

#### Feature: Simulator
- `Dashboard.jsx`: Main hub (Updates to show XP and Level).
- `QRScanner.jsx`: Fakes a camera feed or uses real camera to scan dummy QRs.
- `PinPad.jsx`: Large numeric keypad simulation.
- `SuccessScreen.jsx`: Confetti + Audio feedback + **XP Awarded Animation**.
- `ContactsManager.jsx`: List view + "Add New Contact" form (Name, Phone). 
- `QRCodeGenerator.jsx`: To display the "Cash Voucher" for P2P transfers.

#### Feature: Advanced Finance (Loans & EMI)
- `LoanCenter.jsx`: Simple form to apply for loans (Principal, Interest, Tenure).
- `EMIAlert.jsx`: A notification/widget showing "Due Today".

#### Feature: Scam Lab
- `FakeSMS.jsx`: Renders a list of tailored scam messages.
- `ScamDetector.jsx`: AI-powered text analysis tool. User pastes text -> API call -> Result Card.
- `ScamGuideModal.jsx`: Explains why a user failed/succeeded.

### Logic & State Updates
- **Gamification Service:** Simple logic to track `achievements` (e.g., `if (friends.length >= 3) awardXP(500)`).
- **Loan Logic:** `calculateEMI(principal, rate, time)` function to show cost.
- **Contacts Logic:** `addContact(name, phone)` -> Validate -> Push to `contacts` array in Context -> Persist to `localStorage`.
- **P2P Logic (Voucher):**
    - `generateVoucher(amount)`: Returns JSON string `{"type":"SENIORSAFE_CASH","amt":50,"id":UUID}`.
    - `redeemVoucher(json)`: Validates type -> Adds amount -> Logs "Received from Nearby".
- **AI Service:** `analyzeMessage(text)` function calling Gemini API.
    - Fallback: If API fails/no key, use simple keyword matching (e.g., "lottery", "urgent" -> "Suspicious").

## Verification Plan

### Automated Tests
- None planned for MVP (Vibe Coding constraint).

### Manual Verification
1. **Onboarding:** Open app, check if 10,000 balance exists.
2. **Transaction:** Go to "Send", enter 500, enter PIN -> Deduct 500? -> Show success?
3. **AI Check:** Paste "Win 1 Crore now!" -> Verify AI says "High Risk".
4. **Mistake:** Go to "Send", enter 50000 -> Warning Modal appears?
5. **Scam Lab:** Click fake link -> Safe-fail screen appears?
6. **Reload:** Refresh page -> Balance remains same? (Persistence check)
