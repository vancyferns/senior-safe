/**
 * Scam SMS scenarios for the Scam Lab
 * Includes hardcoded fallback + dynamic AI generation
 */

import { generateScamScenarios as generateWithAI, isGeminiAvailable } from '../services/geminiService';

// Fallback hardcoded scenarios (used when AI is unavailable)
export const SCAM_SCENARIOS = [
    {
        id: 1,
        type: 'lottery',
        sender: '+91 98765 XXXXX',
        senderName: 'Unknown',
        message: '🎉 Congratulations! You have WON ₹50,00,000 in Jio Lucky Draw! Click here to claim: bit.ly/claim-prize. Share OTP to verify.',
        isScam: true,
        difficulty: 'easy',
        redFlags: ['Unsolicited prize', 'Asking for OTP', 'Suspicious link'],
        xpReward: 50
    },
    {
        id: 2,
        type: 'kyc',
        sender: 'SBI-ALERT',
        senderName: 'SBI Bank (Fake)',
        message: 'Dear Customer, Your SBI account will be BLOCKED in 24 hours. Update KYC immediately: https://sbi-kyc-update.xyz/verify',
        isScam: true,
        difficulty: 'medium',
        redFlags: ['Urgency/threat', 'Fake domain', 'Not official SBI'],
        xpReward: 75
    },
    {
        id: 3,
        type: 'electricity',
        sender: '+91 87654 XXXXX',
        senderName: 'Unknown',
        message: 'URGENT: Your electricity connection will be DISCONNECTED today due to unpaid bill of ₹3,247. Pay now: gpay@9876543210',
        isScam: true,
        difficulty: 'medium',
        redFlags: ['Fear tactic', 'Immediate threat', 'Personal UPI ID'],
        xpReward: 75
    },
    {
        id: 4,
        type: 'phishing',
        sender: 'AMAZON-IND',
        senderName: 'Amazon (Fake)',
        message: 'Your Amazon order #A7834 worth ₹12,999 is confirmed. If not you, call 1800-XXX-XXXX immediately to cancel and get refund.',
        isScam: true,
        difficulty: 'hard',
        redFlags: ['Unknown order', 'Creates panic', 'Unofficial number'],
        xpReward: 100
    },
    {
        id: 5,
        type: 'job',
        sender: '+91 76543 XXXXX',
        senderName: 'Unknown',
        message: 'Work from home! Earn ₹5000-₹50000 daily. Simple typing work. Registration fee only ₹999. WhatsApp: 9876543210',
        isScam: true,
        difficulty: 'easy',
        redFlags: ['Too good to be true', 'Registration fee', 'Unrealistic earnings'],
        xpReward: 50
    },
    {
        id: 6,
        type: 'banking',
        sender: 'HDFC-BANK',
        senderName: 'HDFC (Fake)',
        message: 'Alert: ₹49,999 debited from your HDFC A/c XXXX1234. Not you? Call 1800-XXX-XXXX to block card and get refund.',
        isScam: true,
        difficulty: 'hard',
        redFlags: ['Creates panic', 'Fake alert', 'Will ask for card details'],
        xpReward: 100
    },
    {
        id: 7,
        type: 'legitimate',
        sender: 'SBIUPI',
        senderName: 'SBI Official',
        message: 'Rs 500.00 credited to A/c XX1234 on 15-Jan-26. UPI Ref: 123456789012. Available bal: Rs 9,500.00 -SBI',
        isScam: false,
        difficulty: 'easy',
        redFlags: [],
        xpReward: 25
    },
    {
        id: 8,
        type: 'legitimate',
        sender: 'JioFbr',
        senderName: 'Jio Official',
        message: 'Your Jio recharge of Rs. 349 is successful. Validity: 28 days. Data: 2GB/day. For help, dial 198.',
        isScam: false,
        difficulty: 'easy',
        redFlags: [],
        xpReward: 25
    },
    {
        id: 9,
        type: 'investment',
        sender: '+91 65432 XXXXX',
        senderName: 'Unknown',
        message: 'Make ₹1 Lakh per month! Join our WhatsApp group for FREE stock tips. 100% guaranteed returns. Limited seats!',
        isScam: true,
        difficulty: 'medium',
        redFlags: ['Guaranteed returns', 'WhatsApp group', 'Too good to be true'],
        xpReward: 75
    },
    {
        id: 10,
        type: 'courier',
        sender: 'DHL-IND',
        senderName: 'DHL (Fake)',
        message: 'Your parcel is held at customs. Pay ₹2,500 duty charges to release. Track: http://dhl-parcel-tracking.site/pay',
        isScam: true,
        difficulty: 'medium',
        redFlags: ['Unexpected parcel', 'Payment demand', 'Fake website'],
        xpReward: 75
    }
];

/**
 * Get a random subset of hardcoded scenarios
 */
export const getRandomScenarios = (count = 5) => {
    const shuffled = [...SCAM_SCENARIOS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

/**
 * Get scenarios by difficulty
 */
export const getScenariosByDifficulty = (difficulty) => {
    return SCAM_SCENARIOS.filter(s => s.difficulty === difficulty);
};

/**
 * Fetch dynamic scenarios - tries AI first, falls back to hardcoded
 * @param {number} count - Number of scenarios to fetch
 * @param {string} difficulty - Difficulty level or 'mixed'
 * @param {string} language - Language code for content generation
 * @returns {Promise<{scenarios: Array, isAIGenerated: boolean}>}
 */
export const fetchDynamicScenarios = async (count = 6, difficulty = 'mixed', language = 'en') => {
    // Check if Gemini is available
    if (!isGeminiAvailable()) {
        console.log('Gemini not available, using hardcoded scenarios');
        return {
            scenarios: getRandomScenarios(count),
            isAIGenerated: false
        };
    }

    try {
        // Pass language to AI generator
        const aiScenarios = await generateWithAI(count, difficulty, language);
        return {
            scenarios: aiScenarios,
            isAIGenerated: true
        };
    } catch (error) {
        console.error('Failed to generate AI scenarios, using fallback:', error);
        return {
            scenarios: getRandomScenarios(count),
            isAIGenerated: false
        };
    }
};
