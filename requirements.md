# SeniorSafe - Requirements & Technical Specifications

> **Tagline:** The "Flight Simulator" for Digital Payments.
> **Constraint Checklist & Confidence Score:**
> 1. Free Resources Only? Yes.
> 2. No Credit Card Required? Yes.
> 3. Hackathon Ready? Yes.

## 1. Project Definition & Problem Statement

### What is SeniorSafe?
**SeniorSafe** is a digital literacy tool designed specifically for the elderly. It acts as a **"Flight Simulator" for Digital Payments**—a safe, risk-free environment where seniors can practice using mobile payment interfaces (like UPI apps) without the fear of losing real money or making irreversible mistakes.

### The Problem It Solves
1.  **Fear of Technology (Technophobia):** Seniors are often terrified of pressing the wrong button and losing their pension or savings.
2.  **Rising Financial Fraud:** The elderly are primary targets for phishing, QR code scams, and social engineering. They lack "muscle memory" to spot red flags.
3.  **Lack of Safe Practice:** Real banking apps don't offer a "Undo" button. There is no safe space to fail and learn.

### Comparison: SeniorSafe vs. Real UPI Apps (GPay/PhonePe/Paytm)
| Feature | Real UPI Apps | SeniorSafe (This App) |
| :--- | :--- | :--- |
| **Money** | Real Hard-Earned Money | **Demo Money (Monopoly Money)** |
| **Mistakes** | Irreversible (Money Lost) | **Forgiving (Educational Popup)** |
| **Fraud Risk** | High (Real Danger) | **Zero (Simulated Scams)** |
| **Interface** | Complex, Cluttered | **Simplified, High Contrast, Big Text** |
| **Goal** | Transaction Speed | **Learning & Confidence** |

---

## 2. Methodology & Training Scope

### What Topics Will Seniors Be Trained On?
The curriculum focuses on the "Critical Path" of digital financial literacy:
1.  **Basic Navigation:** Understanding "Home", "Back", and "Menu" icons.
2.  **Checking Balance:** overcoming the fear of "Does checking cut money?".
3.  **Sending Money:** The step-by-step flow: Select Contact -> Enter Amount -> Enter PIN -> Success.
4.  **QR Code Scanning:** How to hold the phone, align the code, and verify the merchant name.
5.  **Cyber Hygiene (The Scam Lab):**
    - Identifying "Crediting" vs "Debiting" messages.
    - Spotting fake "You won a lottery" links.
    - Never sharing OTPs (Simulated scenarios).

### How Will It Be Achieved? (The "Sandbox" Methodology)
We use a **"Learn by Doing"** approach rather than passive video watching.
1.  **Simulation:** The interface mimics standard app patterns (Green for Go, Red for Stop) so skills transfer to real apps.
2.  **Guided Failure:** When a user makes a mistake (e.g., tries to send ₹50,000 to a stranger), the app pauses and explains *why* that is risky, rather than just declining the transaction.
3.  **Positive Reinforcement:** "Confidence Points" and confetti animations reward small wins to build self-esteem.

### Feasibility Analysis (4-Hour Constraint)
**Can this be done in < 4 hours?**
**YES.** By strictly defining the scope to a "Frontend-Only MVP", we can achieve a functional prototype.

**Strategy for Speed:**
- **No Backend:** We skip setting up a server/Database. We use `localStorage` to save data on the device.
- **Pre-built UI:** We use `Tailwind CSS` for rapid styling.
- **Mock Data:** We hardcode "Fake Contacts" and "Scam Scenarios" instead of building an admin panel to manage them.
- **Focus:** We strictly build the "Happy Path" (Successful Flow) and one "Scam Path". We ignore edge cases like "Bad Internet Connection" or "Server Down".

**Tools Used:**
- React + Vite (Fast setup)
- Tailwind CSS (Fast styling)
- Lucide React (Icons)
- Vercel (Instant Deployment)
- **Vite PWA Plugin** (For Offline Logic)

---

## 2. Functional Requirements

### 2.1 The "Sandbox" Wallet (Core Simulator)
The simulator must mimic the look and feel of a real payment app but operate entirely safely.
- **Home Screen Dashboard:**
    - Display "Demo Balance" (Default: ₹10,000).
    - Large, clear buttons: "Scan QR", "Send to Contact", "Check Balance", "Pay Bills".
    - Transaction History (starts empty, populates as user "spends").
- **Simulated Payment Flow:**
    - **Scan QR:** Opens camera (simulated or real leveraging `react-qr-reader`) -> Decodes dummy QR codes -> Prompts for Amount -> Simulated PIN Pad -> Success Screen.
    - **Send to Contact:** List of "Fake Contacts" (e.g., "Raju Milkman", "Priya Granddaughter") -> Enter Amount -> Enter PIN -> Success Animation.
- **Mistake Handling (The "Gentle Hand"):**
    - Logic: If User enters > ₹5,000 in a single transaction.
    - Action: Modal popup with gentle text: *"That looks like a large amount. Did you mean ₹500? Use the backspace to correct it."* (No red error texts).

### 2.2 Peer-to-Peer (P2P) Interaction: "Offline Cash Mode"
To simulate real transfers between two users **without a server**:
- **The "Voucher" System:**
    - **Sender:** Selects "Send to Nearby" -> Enters Amount (e.g., ₹50) -> App deducts ₹50 and generates a **One-Time QR Code**.
    - **Receiver:** Selects "Scan to Receive" -> Scans Sender's QR -> App verifies code -> Adds ₹50 to balance.
- **Why this is great:**
    - It mimics the *physicality* of handing over cash.
    - It allows two seniors sitting next to each other to practice "Scanning" and "Receiving" with real feedback, even in airplane mode.
- **SMS Simulation:** A fake inbox showing simulated "Phishing SMS" (e.g., "Electricity Bill Unpaid").
- **Interaction:**
    - If user clicks the link -> Full screen "Safe-Fail" warning: *"Oops! That was a trick. In real life, this would steal your money. Here is how to spot it..."*
    - If user clicks "Report Spam" -> Reward/Confetti animation.

### 2.3 Gamification & Progression (Expanded)
- **Achievement System:**
    - **Rewards:** Users earn "XP" (Experience Points) and "Bonus Demo Money" for completing tasks.
    - **Real-Life Scenarios (Missions):**
        - "The General Store": Scan a specific QR code (provided in app) to buy "Groceries".
        - "Social Butterfly": Add 3 "Friends" (Fake contacts) by typing phone numbers.
        - "Credit Score Builder": Pay an EMI on time.
- **Progression:**
    - Level 1: Novice (Basic Transfers)
    - Level 2: Shopper (QR Codes)
    - Level 3: Banker (Loans & EMIs)

### 2.4 Advanced Financial Simulations (New)
- **Loan Simulator:**
    - Simple interface to "Apply for Personal Loan".
    - Explains concepts like "Interest Rate" and "Tenure" in simple terms.
    - **Safe-Fail:** If user picks a very high interest rate -> Warning: *"High Interest Alert! This means you pay back double."*
- **EMI Payments:**
    - Simulated monthly bill.
    - User must "Pay EMI" from their balance.
    - Teaches the importance of On-Time Payments.

---

## 3. Non-Functional Requirements (Accessibility & Tech)

### 3.1 UX/UI & Accessibility
- **Theme:** **Clean White Theme**. (No Dark Mode by default).
    - **Backgrounds:** Pure White (`#FFFFFF`) and Light Gray (`#F3F4F6`) for sections.
    - **Accents:** Soft Blue (`#3B82F6`) for primary actions, Emerald Green (`#10B981`) for success.
    - **Avoid:** Dark backgrounds, neon colors, or complex gradients.
- **WCAG Compliance:** High contrast text (Slate-900 on White) for readability.
- **Typography:** Minimum font size of 16px (1rem), Sans-serif (Inter/Roboto).
- **Touch Targets:** Large, clear buttons (min 48px).
- **Language Support:** Built-in toggle for English/Hindi.

### 3.2 Technical Constraints (Free Tier & No-CC)
To strictly adhere to the "No Paid Tools" constraint:
- **Backend/Database:** **None** (initially).
    - *Why:* To avoid complex setups and costs.
    - *Solution:* Use **LocalStorage** to persist "Balance", "Transaction History", and "Mission Progress" on the user's device. This is free, fast, and sufficient for a hackathon demo.
- **Voice/Speech:** **Web Speech API** (Browser Native).
    - *Why:* Google Cloud/AWS Transcribe require credit cards. Browser native API is free and works well for basic commands.
- **Hosting:** **Vercel** or **Netlify** (Free Hobby Tiers) or **GitHub Pages**.
- **Images/Assets:** **Unsplash** (Free stock photos) or generated via local AI (if available) or simple CSS placeholders.

---

## 4. Implementation Roadmap (Hackathon Timeline)

### Phase 1: The "Skeleton" (Hours 1-4)
- Setup React + Vite + Tailwind.
- Create `Layout` component with high-contrast theme.
- Implement `WalletContext` to hold `balance` (state).
- build the "Home Screen" UI.

### Phase 2: The "Simulator" (Hours 5-12)
- Build `SendMoney` flow (Select Contact -> Input -> PIN -> Success).
- Implement `TransactionHistory` reading from Context.
- Add "Mistake Forgiveness" logic (if amount > limit, show warning).

### Phase 3: The "Scam Lab" & Polish (Hours 13-20)
- Build `ScamSimulation` component (Fake SMS UI).
- Add `react-confetti` for rewards.
- **Voice:** Add a "Read Aloud" button using `window.speechSynthesis`.

### 2.5 AI Integration: "Guardian AI"
- **What it is:** An intelligent assistant powered by Generative AI (Google Gemini).
- **Use Case:** "Scam Check".
    - User pastes a suspicious text/WhatsApp message.
    - **AI Analysis:** The AI scans for psychological triggers (Urgency, Greed, Fear).
    - **Output:**
        - **Safety Score:** (e.g., "High Risk!")
        - **Explanation:** "This message is trying to scare you into acting quickly. Banks never ask for OTPs via SMS."
- **Why AI?** Static rule-based systems can't catch every new creative scam. AI understands context.

---

## 5. Technology Stack (Detailed)

| Component | Choice | Justification (Free/No-CC) |
| :--- | :--- | :--- |
| **Framework** | **React.js (Vite)** | Industry standard, fast dev server. |
| **AI Model** | **Google Gemini API** | Free tier available, high speed (Flash model), perfect for text analysis. |
| **Styling** | **Tailwind CSS** | Rapid UI development, easier to create design systems. |
| **Icons** | **Lucide React** | Free, clean, accessible SVG icons. |
| **State Management** | **React Context API** | Built-in, zero setup, perfect for lightweight global state. |
| **Persistence** | **LocalStorage** | Browser-native, no database required. |
| **Routing** | **React Router DOM** | Standard routing. |
| **Voice** | **Web Speech API** | Browser-native text-to-speech & speech-to-text. |
| **QR Scanning** | **react-qr-reader** | Open source library for camera access. |
| **Deployment** | **Vercel** | Free "Hobby" tier requires no credit card for basic static sites. |

---

## 6. Directory Structure (Proposed)

```text
src/
├── assets/          # Images/Icons
├── components/
│   ├── ui/          # Reusable customized accessible buttons/inputs
│   ├── simulation/  # Payment flow components (PinPad, QRScanner)
│   └── scam-lab/    # Phishing simulation components
├── context/
│   └── WalletContext.jsx  # Manages Balance, Transactions, Missions
├── hooks/
│   └── useSpeech.js       # Wrapper around Web Speech API
├── pages/
│   ├── Dashboard.jsx
│   ├── SendMoney.jsx
│   └── ScamLab.jsx
└── utils/
    └── simulationData.js  # Dummy contacts, fake scam messages
```
