# Execution Plan - SeniorSafe

This document details **HOW** each feature will be implemented, specifically mapping User Actions -> Routes -> System Logic.

## 1. Global State Strategy (`WalletContext`)
The entire app revolves around a `WalletContext` that behaves like a mini-backend.
- **State Object:**
  ```javascript
  {
    balance: 10000,
    transactions: [], // { id, type, amount, date, status }
    missions: [],     // { id, title, completed }
    settings: { highContrast: false }
  }
  ```
- **Persistence:** `useEffect` hook listens to state changes and writes to `localStorage.getItem('seniorSafeData')`.

---

## 2. Feature Implementation Details

### Feature A: The Dashboard (Home)
- **Route:** `/`
- **Components:** `Dashboard.jsx`, `BalanceCard`, `QuickActionGrid`, `MissionWidget`
- **Logic:**
    - On mount, read `balance` from Context.
    - `QuickActionGrid`: Contains 4 buttons derived from the `lucide-react` library.
        - "Scan QR" -> link to `/scan`
        - "Send Money" -> link to `/send`
        - "Bills" -> link to `/bills`
        - "History" -> link to `/history`

### Feature B: The Send Money Flow (Multi-step)
This feature mimics a GPay/PhonePe flow using nested routes or step-based state.

**1. Step 1: Contact Selection**
- **Route:** `/send`
- **Logic:**
    - Render a hardcoded list of `CONTACTS` (Simulated).
    - User clicks a contact -> Navigate to `/send/amount/:contactId`.

**2. Step 2: Amount Entry & The "Safety Guard"**
- **Route:** `/send/amount/:contactId`
- **Logic:**
    - User enters numbers via a large custom `NumPad` (for accessibility).
    - **Critical Check (Mistake Forgiveness):**
        - `onClick(Pay)`:
            - `if (amount > 5000)` -> **STOP**. Open `WarningModal`.
            - `else` -> Navigate to `/send/pin`.

**3. Step 3: PIN Authorization**
- **Route:** `/send/pin`
- **Logic:**
    - User enters dummy PIN (e.g., "1234").
    - **Processing:**
        - Call `deductBalance(amount)` from Context.
        - Add entry to `transactions`.
        - Navigate to `/success`.

**4. Step 4: Success**
- **Route:** `/success`
- **Logic:**
    - Play Audio ("Payment Successful").
    - Run `react-confetti`.
    - Show button "Home" -> link to `/`.

### Feature C: The Scam Lab
- **Route:** `/scam-lab`
- **Components:** `ScamInbox`, `MessageItem`
- **Logic:**
    - Render list of `SCAM_SCENARIOS`.
    - **User Interaction:**
        - **Click Link (Fail):**
            - Component: `SafeFailOverlay`.
            - Logic: Fullscreen red overlay. Text: "You clicked a phishing link."
        - **Click 'Report' (Win):**
            - Logic: Add +50 Confidence Points. Show "You spotted a scam!" toast.

### Feature D: Voice Guidance
- **Implementation:** `hooks/useSpeech.js`
- **Logic:**
    - Expose function `speak(text)`.
    - Uses `window.speechSynthesis`.
    - **Usage:**
        - On `/send/amount` load -> `speak("Enter the amount you want to send")`.
        - On `/send/pin` load -> `speak("Enter your secret PIN")`.

---

## 3. Route Structure (React Router)

```jsx
<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/scan" element={<QRScanner />} />
  <Route path="/send" element={<ContactList />} />
  <Route path="/send/amount/:id" element={<AmountInput />} />
  <Route path="/send/pin" element={<PinPad />} />
  <Route path="/success" element={<Success />} />
  <Route path="/scam-lab" element={<ScamLab />} />
  <Route path="/history" element={<Transactions />} />
</Routes>
```
