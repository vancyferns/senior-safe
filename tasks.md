# Tasks

- [x] Create detailed `requirements.md` based on SeniorSafe concept <!-- id: 0 -->
- [x] Initialize project structure (Vite + React + Tailwind) <!-- id: 1 -->
- [x] Create `implementation_plan.md` <!-- id: 2 -->

## Phase 1: The Skeleton (Infrastructure & UI Base)
- [x] **Infrastructure**: Scaffold React + Vite + Tailwind + Install Dependencies (`lucide-react`, `react-router-dom`, `react-qr-reader`, `vite-plugin-pwa`) <!-- id: 3 -->
- [x] **Design System**: Configure Tailwind for "Clean Light Theme" (White backgrounds, Slate text, Blue accents) <!-- id: 4 -->
- [x] **State**: Create `WalletContext` with `localStorage` persistence (Balance, Transaction Log, User Settings) <!-- id: 5 -->
- [x] **Components**: Build `Layout` (Sticky Header, Big Nav Bar) and `Card` (High visibility borders) <!-- id: 6 -->
- [x] **Page**: Build `Dashboard` (Home) with Quick Action Grid (Scan, Pay, Bills) & Daily Mission Widget <!-- id: 7 -->
- [x] **Feature**: Implement `P2P_Voucher` system (Sender generates QR, Receiver scans to add money) <!-- id: 23 -->

## Phase 2: The Simulator (Core Logic)
- [x] **Feature**: Implement `QRScanner` wrapper (Handle camera permissions + "Simulate Scan" button for desktop) <!-- id: 8 -->
- [x] **Component**: Build `PinPad` with large numeric keys and audio feedback <!-- id: 9 -->
- [x] **Flow**: Create `SendMoney` page (Simulated Contacts List -> Amount Input -> Check Balance) <!-- id: 10 -->
- [x] **Logic**: Implement "Mistake Forgiveness" Guard (If amount > ₹5000 -> Show "Are you sure?" Modal) <!-- id: 11 -->
- [x] **Logic**: finalize `PaymentProcessing` (Deduct specific amount, Add to History, Trigger Success Screen) <!-- id: 12 -->
- [x] **Page**: Build `TransactionHistory` with clear Red/Green indicators and large dates <!-- id: 17 -->

## Phase 3: The Scam Lab & Advanced Features
- [x] **Feature**: Build `ScamLab` Inbox (Mock SMS interface) <!-- id: 13 -->
- [x] **AI Integration**: Implement `ScamDetector` using Gemini API (Input -> Analyze -> Report) <!-- id: 22 -->
- [x] **Logic**: `PhishingScenario` Interaction (Click Link -> Safe-Fail Screen; Click Report -> Reward) <!-- id: 14 -->
- [x] **Feature**: Build `LoanCenter` (Apply for Loan, visualize Interest) <!-- id: 19 -->
- [x] **Feature**: Implement `EMIPayment` flow (Simulate bill due -> Pay -> Success) <!-- id: 20 -->
- [x] **Gamification**: Implement `AchievementSystem` (Check conditions -> Award XP/Money) <!-- id: 21 -->
- [x] **Content**: Create `ScamGuideModal` (Educational overlays explaining specific frauds) <!-- id: 18 -->
- [x] **Accessibilty**: Integrate `useSpeech` hook (Text-to-Speech) for key instruction buttons <!-- id: 15 -->
- [x] **Gamification**: Add `Confetti` rewards on Mission Completion & "Confidence Level" progress bar <!-- id: 16 -->

