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
 * Get strict language instruction for AI prompts
 * These instructions are designed to be very explicit to prevent language mixing
 */
const getStrictLanguageInstruction = (language) => {
    const instructions = {
        en: `
⚠️ STRICT LANGUAGE REQUIREMENT - ENGLISH ONLY ⚠️
- Write EVERYTHING in PURE ENGLISH.
- DO NOT use ANY Hindi words (like "Namaste", "Dost", "Rupees" as "Rupaye", etc.)
- DO NOT use Hinglish (Hindi words written in English letters)
- DO NOT mix languages in any way
- Use ONLY English vocabulary, grammar, and expressions
- Example: Say "friend" NOT "dost", say "Hello" NOT "Namaste", say "money" NOT "paisa"
`,
        hi: `
⚠️ भाषा आवश्यकता - केवल हिंदी ⚠️
- सब कुछ शुद्ध हिंदी में लिखें (देवनागरी लिपि में)
- अंग्रेजी शब्दों का उपयोग न करें
- हिंदी व्याकरण और शब्दावली का उपयोग करें
`,
        mr: `
⚠️ भाषा आवश्यकता - केवळ मराठी ⚠️
- सर्व काही शुद्ध मराठीत लिहा (देवनागरी लिपीत)
`,
        ta: `
⚠️ மொழி தேவை - தமிழ் மட்டும் ⚠️
- எல்லாவற்றையும் தமிழில் எழுதுங்கள்
`,
        te: `
⚠️ భాషా అవసరం - తెలుగు మాత్రమే ⚠️
- అన్నీ తెలుగులో రాయండి
`,
        kn: `
⚠️ ಭಾಷೆ ಅವಶ್ಯಕತೆ - ಕನ್ನಡ ಮಾತ್ರ ⚠️
- ಎಲ್ಲವನ್ನೂ ಕನ್ನಡದಲ್ಲಿ ಬರೆಯಿರಿ
`,
        bn: `
⚠️ ভাষার প্রয়োজনীয়তা - শুধু বাংলা ⚠️
- সব কিছু বাংলায় লিখুন
`
    };

    return instructions[language] || instructions.en;
};

/**
 * Translate text to a specific language using Gemini
 * This is used as a post-processing step to ensure language consistency
 */
export const translateWithGemini = async (text, targetLanguage = 'en') => {
    if (!model) {
        const initialized = initializeGemini();
        if (!initialized) {
            return text; // Return original if can't translate
        }
    }

    const languageNames = {
        en: 'English',
        hi: 'Hindi (Devanagari script)',
        mr: 'Marathi (Devanagari script)',
        ta: 'Tamil',
        te: 'Telugu',
        kn: 'Kannada',
        bn: 'Bengali'
    };

    const targetLangName = languageNames[targetLanguage] || 'English';

    try {
        const prompt = `Translate the following text to ${targetLangName}. 
${targetLanguage === 'en' ? 'Use PURE ENGLISH only. Do NOT use any Hindi, Hinglish, or mixed language words. Replace any Hindi words with their English equivalents.' : ''}

Text to translate:
${text}

Return ONLY the translated text, nothing else.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('Translation error:', error);
        return text; // Return original if translation fails
    }
};

/**
 * Force translate JSON content fields to a target language
 */
export const translateJSONFields = async (jsonArray, fields, targetLanguage = 'en') => {
    if (!model || targetLanguage === 'en') {
        // For English, we rely on the strict prompt instead
        return jsonArray;
    }

    const translatedArray = await Promise.all(
        jsonArray.map(async (item) => {
            const translatedItem = { ...item };
            for (const field of fields) {
                if (item[field] && typeof item[field] === 'string') {
                    translatedItem[field] = await translateWithGemini(item[field], targetLanguage);
                }
            }
            return translatedItem;
        })
    );

    return translatedArray;
};

/**
 * Generate dynamic scam scenarios using Gemini AI
 * @param {number} count - Number of scenarios to generate
 * @param {string} difficulty - 'easy', 'medium', 'hard', or 'mixed'
 * @param {string} language - Language code ('en', 'hi', etc.)
 * @returns {Promise<Array>} Array of scam scenarios
 */
export const generateScamScenarios = async (count = 6, difficulty = 'mixed', language = 'en') => {
    if (!model) {
        const initialized = initializeGemini();
        if (!initialized) {
            throw new Error('Gemini API not available');
        }
    }

    // Get strict language instruction
    const langInstruction = getStrictLanguageInstruction(language);

    const prompt = `You are a scam awareness educator creating realistic training scenarios for elderly users in India.

${langInstruction}

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
        let scenarios = JSON.parse(cleanText);

        // POST-TRANSLATION: For English, ensure all text is in pure English
        if (language === 'en') {
            scenarios = await Promise.all(
                scenarios.map(async (scenario) => {
                    // Check for Hinglish patterns
                    const hasHinglish = /namaste|aapka|apna|rupay|paisa|karo|kijiye|badhai|jaldi|abhi|aaj|kal/i.test(
                        `${scenario.message} ${scenario.senderName}`
                    );

                    if (hasHinglish) {
                        const translatedMessage = await translateWithGemini(scenario.message, 'en');
                        return {
                            ...scenario,
                            message: translatedMessage
                        };
                    }
                    return scenario;
                })
            );
        }

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
 * @param {string} language - Language code ('en', 'hi', etc.)
 * @returns {Promise<Array>} Array of challenge objects
 */
export const generateDailyChallenges = async (count = 3, completedChallengeIds = [], language = 'en') => {
    if (!model) {
        const initialized = initializeGemini();
        if (!initialized) {
            throw new Error('Gemini API not available');
        }
    }

    // Get strict language instruction
    const langInstruction = getStrictLanguageInstruction(language);

    const completedList = completedChallengeIds.length > 0
        ? `\n\nDO NOT generate challenges similar to these previously completed ones: ${completedChallengeIds.join(', ')}`
        : '';

    const prompt = `You are a gamification expert creating daily challenges for a digital payment learning app for elderly users in India called "SeniorSafe".

${langInstruction}

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

        let challenges = JSON.parse(cleanText.trim());

        // POST-TRANSLATION: For English, ensure all text is translated to pure English
        if (language === 'en') {
            challenges = await Promise.all(
                challenges.map(async (challenge) => {
                    // Quick check if content looks like it has Hindi/Hinglish
                    const hasHinglish = /namaste|dost|rupay|paisa|karo|dekho|banao|kaise|apna|aapke|aaj|kal/i.test(
                        `${challenge.title} ${challenge.description}`
                    );

                    if (hasHinglish) {
                        const translatedTitle = await translateWithGemini(challenge.title, 'en');
                        const translatedDesc = await translateWithGemini(challenge.description, 'en');
                        return {
                            ...challenge,
                            title: translatedTitle,
                            description: translatedDesc
                        };
                    }
                    return challenge;
                })
            );
        }

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

/**
 * Get a short motivational message for streak
 * @param {number} streakDays - Current streak count
 * @param {string} language - Language code for the message
 * @returns {Promise<string>} Short motivational message
 */
export const getStreakMotivation = async (streakDays, language = 'en') => {
    // Fallback messages by language
    const fallbacksByLang = {
        en: ["Keep going! 💪", "You're doing great!", "Amazing progress!", "Stay consistent!", "Fantastic work!", "Keep it up! 🔥", "You're on fire!", "Great dedication!"],
        hi: ["आगे बढ़ते रहो! 💪", "बहुत अच्छा!", "शानदार प्रगति!", "लगातार रहो!", "जबरदस्त! 🔥", "बढ़िया काम!", "मस्त! 👏", "जारी रखो!"],
        mr: ["पुढे चला! 💪", "छान चाललंय!", "उत्तम प्रगती!", "सुरू ठेवा! 🔥", "भारी! 👏"],
        ta: ["தொடருங்கள்! 💪", "நன்றாக செய்கிறீர்கள்!", "அருமை! 🔥"],
        te: ["కొనసాగించు! 💪", "బాగా చేస్తున్నావు!", "అద్భుతం! 🔥"],
        kn: ["ಮುಂದುವರಿಸಿ! 💪", "ಅದ್ಭುತ! 🔥"],
        bn: ["চালিয়ে যান! 💪", "দুর্দান্ত! 🔥"]
    };

    const fallbacks = fallbacksByLang[language] || fallbacksByLang.en;

    if (!model) {
        const initialized = initializeGemini();
        if (!initialized) {
            return fallbacks[streakDays % fallbacks.length];
        }
    }

    // Strict language instructions for motivation
    const langPrompts = {
        en: 'Write in PURE ENGLISH ONLY. Do NOT use any Hindi, Hinglish, or mixed language words.',
        hi: 'हिंदी में लिखें (देवनागरी लिपि में)',
        mr: 'मराठीत लिहा',
        ta: 'தமிழில் எழுதுங்கள்',
        te: 'తెలుగులో రాయండి',
        kn: 'ಕನ್ನಡದಲ್ಲಿ ಬರೆಯಿರಿ',
        bn: 'বাংলায় লিখুন'
    };
    const langInstruction = langPrompts[language] || langPrompts.en;

    try {
        const prompt = `Generate a very short (3-5 words max) motivational message for someone on a ${streakDays} day learning streak. 

${langInstruction}

Be encouraging and warm. Just the message, no quotes or punctuation at end. Examples for English: "Keep going strong", "Amazing dedication", "Fantastic progress".`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim().replace(/['"!.]/g, '').slice(0, 30);

        return text || fallbacks[streakDays % fallbacks.length];
    } catch (error) {
        console.error('Error getting motivation:', error);
        return fallbacks[streakDays % fallbacks.length];
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
    generateDailyChallenges,
    getStreakMotivation
};
