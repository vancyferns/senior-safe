import { GoogleGenerativeAI } from '@google/generative-ai';

// Scam keywords for fallback detection
const SCAM_KEYWORDS = [
    'lottery', 'won', 'winner', 'prize', 'lakhs', 'crores',
    'urgent', 'immediately', 'expire', 'suspended',
    'otp', 'pin', 'password', 'cvv', 'bank details',
    'click here', 'verify now', 'update kyc',
    'free', 'offer', 'limited time', 'act now',
    'electricity', 'disconnected', 'unpaid bill',
    'aadhaar', 'pan card', 'link expired'
];

const SUSPICIOUS_PATTERNS = [
    /₹\s*\d+\s*(lakh|crore|million)/i,
    /won\s+.*\s+lottery/i,
    /click\s+.*\s+link/i,
    /share\s+.*\s+otp/i,
    /verify\s+.*\s+(account|details)/i,
    /\b(bit\.ly|tinyurl|short\.link)\b/i,
    /http[s]?:\/\/[^\s]+/i, // Any URL
];

/**
 * Analyze message using keyword-based fallback
 */
export const analyzeWithKeywords = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Count keyword matches
    const keywordMatches = SCAM_KEYWORDS.filter(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
    );
    
    // Check pattern matches
    const patternMatches = SUSPICIOUS_PATTERNS.filter(pattern => 
        pattern.test(message)
    );

    const totalScore = keywordMatches.length * 15 + patternMatches.length * 20;
    const riskScore = Math.min(100, totalScore);

    let riskLevel = 'LOW';
    let explanation = 'This message appears to be safe.';

    if (riskScore >= 70) {
        riskLevel = 'HIGH';
        explanation = `This message contains ${keywordMatches.length} suspicious keywords and ${patternMatches.length} risky patterns. It is very likely a SCAM. Never click links or share personal information!`;
    } else if (riskScore >= 40) {
        riskLevel = 'MEDIUM';
        explanation = `This message has some suspicious elements (${keywordMatches.length} keywords). Be cautious and verify with official sources before taking any action.`;
    }

    return {
        riskLevel,
        riskScore,
        explanation,
        matchedKeywords: keywordMatches,
        isScam: riskScore >= 50,
        method: 'keyword'
    };
};

/**
 * Analyze message using Gemini AI (with fallback)
 */
export const analyzeMessage = async (message, apiKey = null) => {
    // If no API key, use fallback
    if (!apiKey) {
        return analyzeWithKeywords(message);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `You are a scam detection expert helping elderly users in India identify fraudulent messages.

Analyze this message for scam indicators:
"${message}"

Respond in this exact JSON format:
{
    "riskLevel": "HIGH" or "MEDIUM" or "LOW",
    "riskScore": number from 0-100,
    "isScam": true or false,
    "explanation": "Brief explanation in simple English for seniors (2-3 sentences)",
    "redFlags": ["list", "of", "specific", "concerns"]
}

Consider: lottery scams, phishing, KYC frauds, fake electricity bills, prize scams, OTP theft attempts, suspicious links.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                ...parsed,
                method: 'ai'
            };
        }
        
        // Fallback if parsing fails
        return analyzeWithKeywords(message);
    } catch (error) {
        console.error('Gemini API error, using fallback:', error);
        return analyzeWithKeywords(message);
    }
};

/**
 * Get educational content for a scam type
 */
export const getScamEducation = (scamType) => {
    const education = {
        'lottery': {
            title: 'Lottery Scam',
            description: 'You cannot win a lottery you never entered! Real lotteries never ask for money upfront.',
            tips: [
                'Never pay money to claim a "prize"',
                'Official lotteries contact winners directly',
                'Delete messages about unknown lotteries'
            ]
        },
        'phishing': {
            title: 'Phishing Attack',
            description: 'Scammers pretend to be banks or companies to steal your information.',
            tips: [
                'Banks never ask for OTP or PIN via SMS',
                'Always check the sender\'s number',
                'Call your bank directly if unsure'
            ]
        },
        'kyc': {
            title: 'Fake KYC Update',
            description: 'Fraudsters claim your KYC is expired to trick you into sharing details.',
            tips: [
                'Banks send KYC reminders through official apps',
                'Never click links in SMS for KYC',
                'Visit bank branch for KYC updates'
            ]
        },
        'electricity': {
            title: 'Fake Bill Scam',
            description: 'Scammers threaten to disconnect your electricity to scare you into paying.',
            tips: [
                'Check your actual bill on official website',
                'Real companies give proper notice, not sudden threats',
                'Call official customer care to verify'
            ]
        },
        'default': {
            title: 'Potential Scam Detected',
            description: 'This message has suspicious elements that are commonly used in scams.',
            tips: [
                'Never share OTP, PIN, or passwords',
                'Don\'t click suspicious links',
                'When in doubt, ask a family member'
            ]
        }
    };

    return education[scamType] || education['default'];
};
