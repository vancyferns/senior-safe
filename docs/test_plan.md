# Test Case Plan - SeniorSafe

**Objective:** Verify that the "SeniorSafe" application functions as a risk-free simulator for elderly users, focusing on usability, error forgiveness, and educational value.

## 1. Core Infrastructure & Onboarding (Phase 1)

| Test ID | Feature | Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- |
| **TC-001** | **Initial Load** | 1. Open the application URL.<br>2. Check local storage. | 1. Dashboard loads with high-contrast UI.<br>2. Balance shows ₹10,000.<br>3. `localStorage` initialized. | [ ] |
| **TC-002** | **Navigation** | 1. Click "Scan QR".<br>2. Click Back.<br>3. Click "Pay". | 1. Navigates to Scanner view.<br>2. Returns to Dashboard.<br>3. Navigates to Payment view. | [ ] |
| **TC-003** | **Accessibility** | 1. Toggle "Large Text" (if impl).<br>2. Check contrast. | 1. Font size increases.<br>2. Text is clearly readable (AAA standard). | [ ] |

## 2. The Simulator (Phase 2)

| Test ID | Feature | Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- |
| **TC-004** | **QR Scanning** | 1. Click "Scan QR".<br>2. Allow Camera permissions.<br>3. Point at dummy QR. | 1. Camera opens.<br>2. Decodes QR data successfully.<br>3. Redirects to Payment Screen with details pre-filled. | [ ] |
| **TC-005** | **Send Money (Happy Path)** | 1. Select Contact "Raju Milkman".<br>2. Enter Amount ₹200.<br>3. Enter PIN -> Submit. | 1. Success Animation plays.<br>2. Confetti appears.<br>3. Balance reduces to ₹9,800. | [ ] |
| **TC-006** | **Mistake Forgiveness** | 1. Go to "Send Money".<br>2. Enter Amount **₹50,000**.<br>3. Click Pay. | 1. **NO** error occurs.<br>2. "Gentle Warning" Modal appears: *"Did you mean ₹500?"*. | [ ] |
| **TC-007** | **Persistence** | 1. Complete a transaction.<br>2. Refresh the browser. | 1. Balance remains decided (₹9,800).<br>2. Transaction History persists. | [ ] |

## 3. Scam Lab & Polish (Phase 3)

| Test ID | Feature | Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- |
| **TC-008** | **Phishing Simulation** | 1. Open "Scam Lab" inbox.<br>2. Click "Electricity Bill" link. | 1. **Safe-Fail Screen** appears immediately.<br>2. Explains *why* it was a scam. | [ ] |
| **TC-009** | **Reporting Scam** | 1. Open "Scam Lab".<br>2. Click "Report Spam" on a fake msg. | 1. Success feedback (Audio/Visual).<br>2. "Confidence Score" increases. | [ ] |
| **TC-010** | **Voice Guidance** | 1. Enable Voice Guidance.<br>2. Hover/Click action buttons. | 1. App reads out loud: *"Enter Amount"*, *"Scan Code"*. | [ ] |
