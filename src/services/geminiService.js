import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from environment variable
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize Gemini AI
let genAI = null;
let model = null;

/**
 * Initialize the Gemini AI client
 */
export const initializeGemini = (apiKey = GEMINI_API_KEY) => {
    if (!apiKey) {
        console.warn('Gemini API key not found. Set VITE_GEMINI_API_KEY in your .env file.');
        return false;
    }
    
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-2.5-flash - latest free tier model
        model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        return true;
    } catch (error) {
        console.error('Failed to initialize Gemini:', error);
        return false;
    }
};

/**
 * Check if Gemini is available
 */
export const isGeminiAvailable = () => {
    return !!GEMINI_API_KEY;
};

/**
 * Generate dynamic scam scenarios using Gemini AI
 * @param {number} count - Number of scenarios to generate
 * @param {string} difficulty - 'easy', 'medium', 'hard', or 'mixed'
 * @returns {Promise<Array>} Array of scam scenarios
 */
export const generateScamScenarios = async (count = 6, difficulty = 'mixed') => {
    if (!model) {
        const initialized = initializeGemini();
        if (!initialized) {
            throw new Error('Gemini API not available');
        }
    }

    const prompt = `You are a scam awareness educator creating realistic training scenarios for elderly users in India.

Generate ${count} unique SMS/message scenarios that teach seniors to identify scams. Mix of scam and legitimate messages.

Requirements:
- ${difficulty === 'mixed' ? 'Include easy, medium, and hard difficulty levels' : `All scenarios should be ${difficulty} difficulty`}
- Include realistic Indian context (banks like SBI, HDFC, ICICI; services like Jio, Airtel; platforms like Amazon, Flipkart)
- Some should be SCAMS (70%) and some LEGITIMATE (30%)
- Use realistic sender names and formats
- Include various scam types: lottery, KYC, phishing, electricity bill, job offers, investment, courier, banking alerts

Respond ONLY with a valid JSON array in this exact format (no markdown, no explanation):
[
    {
        "id": 1,
        "type": "lottery|kyc|phishing|electricity|job|investment|courier|banking|legitimate",
        "sender": "+91 98765 XXXXX or SENDER-ID",
        "senderName": "Display Name",
        "message": "The actual SMS content with realistic formatting and emojis if applicable",
        "isScam": true or false,
        "difficulty": "easy|medium|hard",
        "redFlags": ["Array of red flags if scam, empty if legitimate"],
        "xpReward": 25 for easy, 50 for medium, 75 for hard, 100 for very hard
    }
]

Make messages realistic, varied, and educational. Include current scam trends in India like UPI fraud, fake customer care numbers, and social media scams.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean the response - remove markdown code blocks if present
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.slice(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.slice(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.slice(0, -3);
        }
        cleanText = cleanText.trim();
        
        // Parse JSON
        const scenarios = JSON.parse(cleanText);
        
        // Validate and normalize scenarios
        return scenarios.map((scenario, index) => ({
            id: scenario.id || index + 1,
            type: scenario.type || 'unknown',
            sender: scenario.sender || 'Unknown',
            senderName: scenario.senderName || 'Unknown Sender',
            message: scenario.message || '',
            isScam: scenario.isScam ?? true,
            difficulty: scenario.difficulty || 'medium',
            redFlags: Array.isArray(scenario.redFlags) ? scenario.redFlags : [],
            xpReward: scenario.xpReward || 50,
            isAIGenerated: true
        }));
    } catch (error) {
        console.error('Error generating scenarios with Gemini:', error);
        throw error;
    }
};

/**
 * Generate a quiz question about scam awareness
 * @param {string} topic - The scam topic to quiz about
 * @returns {Promise<Object>} Quiz question with options
 */
export const generateQuizQuestion = async (topic = 'general') => {
    if (!model) {
        const initialized = initializeGemini();
        if (!initialized) {
            throw new Error('Gemini API not available');
        }
    }

    const prompt = `Create a multiple choice quiz question about ${topic} scams for elderly users in India.

Respond ONLY with valid JSON (no markdown):
{
    "question": "The quiz question in simple Hindi-English (Hinglish) friendly language",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this is the correct answer",
    "tip": "A practical safety tip related to this question"
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean and parse
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.slice(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.slice(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.slice(0, -3);
        }
        
        return JSON.parse(cleanText.trim());
    } catch (error) {
        console.error('Error generating quiz question:', error);
        throw error;
    }
};

/**
 * Get scam awareness tip based on context
 * @param {string} context - The context for the tip (e.g., 'upi', 'banking', 'general')
 * @returns {Promise<Object>} Tip object
 */
export const getScamAwarenessTip = async (context = 'general') => {
    if (!model) {
        const initialized = initializeGemini();
        if (!initialized) {
            throw new Error('Gemini API not available');
        }
    }

    const prompt = `Generate a practical scam awareness tip about "${context}" for elderly users in India.

Respond ONLY with valid JSON (no markdown):
{
    "title": "Short title (3-5 words)",
    "tip": "The safety tip in simple language (2-3 sentences)",
    "example": "A real-world example of this scam type",
    "action": "What to do if you encounter this"
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean and parse
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.slice(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.slice(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.slice(0, -3);
        }
        
        return JSON.parse(cleanText.trim());
    } catch (error) {
        console.error('Error generating tip:', error);
        throw error;
    }
};

/**
 * Generate realistic bill/EMI data for practice
 * @param {number} count - Number of bills to generate
 * @returns {Promise<Array>} Array of bill objects
 */
export const generateBills = async (count = 4) => {
    if (!model) {
        const initialized = initializeGemini();
        if (!initialized) {
            throw new Error('Gemini API not available');
        }
    }

    const prompt = `Generate ${count} realistic utility bills and EMI payments for a senior citizen in India for practice.

Return ONLY valid JSON array (no markdown):
[
    {
        "id": 1,
        "type": "Electricity Bill|Water Bill|Gas Bill|Mobile Recharge|Broadband|DTH|Loan EMI|Credit Card|Insurance Premium|LPG Cylinder",
        "provider": "Realistic Indian provider name (e.g., BESCOM, Jio, Airtel, HDFC Bank, LIC)",
        "amount": realistic amount in rupees (between 200-5000),
        "dueDate": "YYYY-MM-DD" (within next 15 days),
        "icon": "appropriate emoji",
        "consumerNumber": "realistic consumer/account number format",
        "billNumber": "realistic bill number",
        "billingPeriod": "e.g., Jan 2026",
        "previousReading": number (for electricity/gas),
        "currentReading": number (for electricity/gas),
        "unitsConsumed": number (for electricity/gas),
        "breakdown": [
            {"item": "item name", "amount": number}
        ],
        "isPaid": false
    }
]

Make amounts and details realistic for Indian context. Include variety of bill types.
For electricity/gas include meter readings. For mobile/DTH include plan details.
Bills should have due dates ranging from 1-15 days from now.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.slice(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.slice(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.slice(0, -3);
        }
        
        const bills = JSON.parse(cleanText.trim());
        
        // Normalize and add calculated fields
        return bills.map((bill, index) => ({
            ...bill,
            id: bill.id || index + 1,
            isAIGenerated: true
        }));
    } catch (error) {
        console.error('Error generating bills:', error);
        throw error;
    }
};

// Initialize on import if API key is available
if (GEMINI_API_KEY) {
    initializeGemini();
}

/**
 * Analyze a message for scam indicators using Gemini AI
 * @param {string} message - The message to analyze
 * @returns {Promise<Object|null>} Analysis result or null if failed
 */
export const analyzeMessageWithAI = async (message) => {
    if (!model) {
        const initialized = initializeGemini();
        if (!initialized) {
            return null;
        }
    }

    const prompt = `You are a scam detection expert helping elderly users in India identify fraudulent messages.

Analyze this message for scam indicators:
"${message}"

Respond ONLY with valid JSON (no markdown):
{
    "riskLevel": "HIGH" or "MEDIUM" or "LOW",
    "riskScore": number from 0-100,
    "isScam": true or false,
    "explanation": "Brief explanation in simple English for seniors (2-3 sentences max)",
    "redFlags": ["list", "of", "specific", "concerns"],
    "scamType": "lottery|phishing|kyc|electricity|banking|job|investment|courier|unknown",
    "advice": "What the senior should do (1 sentence)"
}

Consider Indian context: UPI scams, fake bank KYC, lottery frauds, electricity disconnection threats, fake job offers, investment scams.
Be decisive - if it looks like a scam, say so clearly.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean the response
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.slice(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.slice(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.slice(0, -3);
        }
        
        const parsed = JSON.parse(cleanText.trim());
        return {
            ...parsed,
            method: 'ai',
            model: 'gemini-2.5-flash'
        };
    } catch (error) {
        console.error('Error analyzing message with Gemini:', error);
        return null;
    }
};

/**
 * Generate daily challenges for the user
 * @param {number} count - Number of challenges to generate
 * @param {Object} completedChallengeIds - Set of completed challenge IDs to avoid repeats
 * @returns {Promise<Array>} Array of challenge objects
 */
export const generateDailyChallenges = async (count = 3, completedChallengeIds = []) => {
    if (!model) {
        const initialized = initializeGemini();
        if (!initialized) {
            throw new Error('Gemini API not available');
        }
    }

    const completedList = completedChallengeIds.length > 0 
        ? `\n\nDO NOT generate challenges similar to these previously completed ones: ${completedChallengeIds.join(', ')}`
        : '';

    const prompt = `You are a gamification expert creating daily challenges for a digital payment learning app for elderly users in India called "SeniorSafe".

Generate ${count} unique, achievable daily challenges that encourage users to practice digital payment skills safely.

Available actions in the app:
- Send money to a contact (send_money)
- Scan QR code to pay (scan_qr)
- Pay utility bills (pay_bill)
- Identify scam messages in Scam Lab (scam_lab)
- Check transaction history (view_history)
- Use loan EMI calculator (loan_calc)
- Create a payment voucher (create_voucher)

Requirements:
- Each challenge should be completable in 1-2 simple actions
- Use encouraging, friendly language suitable for seniors
- Include realistic Indian context
- Vary the difficulty (easy, medium, hard)
- Make challenges educational and fun
${completedList}

Respond ONLY with a valid JSON array (no markdown, no explanation):
[
    {
        "id": "unique_challenge_id_with_timestamp",
        "title": "Short catchy title (3-5 words)",
        "description": "What the user needs to do in simple language",
        "action": "send_money|scan_qr|pay_bill|scam_lab|view_history|loan_calc|create_voucher",
        "link": "/send|/scan|/bills|/scam-lab|/history|/loan-center|/voucher",
        "targetCount": 1,
        "xpReward": 50-150 based on difficulty,
        "icon": "💰|📱|💡|🛡️|📊|🧾|🎁",
        "difficulty": "easy|medium|hard"
    }
]

Make each challenge unique, practical, and motivating!`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean the response
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.slice(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.slice(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.slice(0, -3);
        }
        
        const challenges = JSON.parse(cleanText.trim());
        
        // Validate and normalize
        return challenges.map((challenge, index) => ({
            id: challenge.id || `challenge_${Date.now()}_${index}`,
            title: challenge.title || 'Daily Challenge',
            description: challenge.description || 'Complete this challenge',
            action: challenge.action || 'send_money',
            link: challenge.link || '/send',
            targetCount: challenge.targetCount || 1,
            xpReward: challenge.xpReward || 50,
            icon: challenge.icon || '🎯',
            difficulty: challenge.difficulty || 'easy',
            progress: 0,
            completed: false,
            isAIGenerated: true,
            generatedAt: new Date().toISOString()
        }));
    } catch (error) {
        console.error('Error generating daily challenges:', error);
        throw error;
    }
};

export default {
    initializeGemini,
    isGeminiAvailable,
    generateScamScenarios,
    generateQuizQuestion,
    getScamAwarenessTip,
    analyzeMessageWithAI,
    generateBills,
    generateDailyChallenges
};
