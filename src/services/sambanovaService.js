const SAMBANOVA_API_KEY = import.meta.env.VITE_SAMBANOVA_API_KEY?.trim() || import.meta.env.VITE_GEMINI_API_KEY?.trim();
const SAMBANOVA_BASE_URL = 'https://api.sambanova.ai/v1';
const SAMBANOVA_MODEL = 'DeepSeek-V3.1';

const SYSTEM_PROMPT = 'You are a helpful assistant that returns concise, accurate results.';

let clientReady = false;

export const initializeGemini = (apiKey = SAMBANOVA_API_KEY) => {
  clientReady = Boolean(apiKey);
  if (!clientReady) {
    console.warn('SambaNova API key not found. Set VITE_SAMBANOVA_API_KEY in your .env file.');
  }
  return clientReady;
};

export const initializeSambaNova = initializeGemini;

export const isGeminiAvailable = () => Boolean(SAMBANOVA_API_KEY);
export const isSambaNovaAvailable = isGeminiAvailable;

const ensureClient = () => {
  if (!clientReady) {
    initializeGemini();
  }

  if (!SAMBANOVA_API_KEY) {
    throw new Error('SambaNova API not available');
  }
};

const stripCodeFence = (text = '') => {
  let cleanText = String(text).trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.slice(7);
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.slice(3);
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.slice(0, -3);
  }
  return cleanText.trim();
};

const callSambaNova = async (messages, { temperature = 0.1, top_p = 0.1, max_tokens = 4096 } = {}) => {
  ensureClient();

  const response = await fetch(`${SAMBANOVA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SAMBANOVA_API_KEY}`,
    },
    body: JSON.stringify({
      model: SAMBANOVA_MODEL,
      messages,
      temperature,
      top_p,
      max_tokens,
      stream: false,
    }),
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage = body?.error?.message || body?.message || response.statusText || 'SambaNova request failed';
    throw new Error(errorMessage);
  }

  return body?.choices?.[0]?.message?.content?.trim() || '';
};

const parseJsonResponse = (text) => JSON.parse(stripCodeFence(text));

const getStrictLanguageInstruction = (language) => {
  const instructions = {
    en: 'Write EVERYTHING in pure English only. Do not mix Hindi or Hinglish words.',
    hi: 'सब कुछ शुद्ध हिंदी में लिखें।',
    mr: 'सर्व काही शुद्ध मराठीत लिहा.',
    ta: 'எல்லாவற்றையும் தமிழில் எழுதுங்கள்.',
    te: 'అన్నీ తెలుగులో రాయండి.',
    kn: 'ಎಲ್ಲವನ್ನೂ ಕನ್ನಡದಲ್ಲಿ ಬರೆಯಿರಿ.',
    bn: 'সব কিছু বাংলায় লিখুন.',
  };

  return instructions[language] || instructions.en;
};

const languageNames = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  bn: 'Bengali',
};

export const translateWithGemini = async (text, targetLanguage = 'en') => {
  if (!text) return text;

  try {
    const translated = await callSambaNova([
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Translate the following text to ${languageNames[targetLanguage] || 'English'}.

Return only the translated text.

Text:
${text}`,
      },
    ], { temperature: 0.1, top_p: 0.1, max_tokens: 1024 });

    return translated || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

export const translateJSONFields = async (jsonArray, fields, targetLanguage = 'en') => {
  if (targetLanguage === 'en') return jsonArray;

  return Promise.all(
    jsonArray.map(async (item) => {
      const translatedItem = { ...item };
      for (const field of fields) {
        if (typeof item[field] === 'string' && item[field]) {
          translatedItem[field] = await translateWithGemini(item[field], targetLanguage);
        }
      }
      return translatedItem;
    })
  );
};

export const generateScamScenarios = async (count = 6, difficulty = 'mixed', language = 'en') => {
  const langInstruction = getStrictLanguageInstruction(language);
  const prompt = `You are a scam awareness educator for elderly users in India.

${langInstruction}

Generate ${count} unique SMS/message scenarios that teach seniors to identify scams.

Requirements:
- ${difficulty === 'mixed' ? 'Include easy, medium, and hard difficulty levels' : `All scenarios should be ${difficulty} difficulty`}
- Include realistic Indian context
- Some should be scams and some legitimate
- Respond only as valid JSON array

Format:
[
  {
    "id": 1,
    "type": "lottery|kyc|phishing|electricity|job|investment|courier|banking|legitimate",
    "sender": "+91 98765 XXXXX or SENDER-ID",
    "senderName": "Display Name",
    "message": "SMS content",
    "isScam": true,
    "difficulty": "easy|medium|hard",
    "redFlags": ["..."],
    "xpReward": 25
  }
]`;

  try {
    const text = await callSambaNova([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ], { temperature: 0.2, top_p: 0.9, max_tokens: 4096 });

    let scenarios = parseJsonResponse(text);

    if (language === 'en') {
      scenarios = await Promise.all(
        scenarios.map(async (scenario) => {
          const hasHinglish = /namaste|aapka|apna|rupay|paisa|karo|kijiye|badhai|jaldi|abhi|aaj|kal/i.test(`${scenario.message} ${scenario.senderName}`);
          if (hasHinglish) {
            return {
              ...scenario,
              message: await translateWithGemini(scenario.message, 'en'),
            };
          }
          return scenario;
        })
      );
    }

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
      isAIGenerated: true,
    }));
  } catch (error) {
    console.error('Error generating scenarios with SambaNova:', error);
    throw error;
  }
};

export const generateQuizQuestion = async (topic = 'general') => {
  const text = await callSambaNova([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Create a multiple choice quiz question about ${topic} scams for elderly users in India.

Return only valid JSON:
{
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
  "explanation": "...",
  "tip": "..."
}`,
    },
  ], { temperature: 0.2, top_p: 0.9, max_tokens: 2048 });

  return parseJsonResponse(text);
};

export const getScamAwarenessTip = async (context = 'general') => {
  const text = await callSambaNova([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Generate a practical scam awareness tip about "${context}" for elderly users in India.

Return only valid JSON:
{
  "title": "...",
  "tip": "...",
  "example": "...",
  "action": "..."
}`,
    },
  ], { temperature: 0.2, top_p: 0.9, max_tokens: 1024 });

  return parseJsonResponse(text);
};

export const generateBills = async (count = 4) => {
  const text = await callSambaNova([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Generate ${count} realistic utility bills and EMI payments for a senior citizen in India for practice.

Return only valid JSON array.`,
    },
  ], { temperature: 0.3, top_p: 0.9, max_tokens: 4096 });

  return parseJsonResponse(text).map((bill, index) => ({
    ...bill,
    id: bill.id || index + 1,
    isAIGenerated: true,
  }));
};

export const analyzeMessageWithAI = async (message) => {
  try {
    const text = await callSambaNova([
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `You are a scam detection expert helping elderly users in India identify fraudulent messages.

Analyze this message:
"${message}"

Return only valid JSON:
{
  "riskLevel": "HIGH|MEDIUM|LOW",
  "riskScore": 0,
  "isScam": true,
  "explanation": "...",
  "redFlags": ["..."],
  "scamType": "lottery|phishing|kyc|electricity|banking|job|investment|courier|unknown",
  "advice": "..."
}`,
      },
    ], { temperature: 0.1, top_p: 0.1, max_tokens: 2048 });

    const parsed = parseJsonResponse(text);
    return {
      ...parsed,
      method: 'ai',
      model: SAMBANOVA_MODEL,
    };
  } catch (error) {
    console.error('Error analyzing message with SambaNova:', error);
    return null;
  }
};

export const generateDailyChallenges = async (count = 3, completedChallengeIds = [], language = 'en') => {
  const langInstruction = getStrictLanguageInstruction(language);
  const completedList = completedChallengeIds.length > 0 ? `Avoid these IDs: ${completedChallengeIds.join(', ')}` : '';

  const text = await callSambaNova([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `You are creating daily challenges for a digital payment learning app for elderly users in India called SeniorSafe.

${langInstruction}

Generate ${count} unique, achievable daily challenges.
${completedList}

Return only valid JSON array.`,
    },
  ], { temperature: 0.3, top_p: 0.9, max_tokens: 4096 });

  let challenges = parseJsonResponse(text);

  if (language === 'en') {
    challenges = await Promise.all(
      challenges.map(async (challenge) => {
        const hasHinglish = /namaste|dost|rupay|paisa|karo|dekho|banao|kaise|apna|aapke|aaj|kal/i.test(`${challenge.title} ${challenge.description}`);
        if (hasHinglish) {
          return {
            ...challenge,
            title: await translateWithGemini(challenge.title, 'en'),
            description: await translateWithGemini(challenge.description, 'en'),
          };
        }
        return challenge;
      })
    );
  }

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
    generatedAt: new Date().toISOString(),
  }));
};

export const getStreakMotivation = async (streakDays, language = 'en') => {
  const fallbacksByLang = {
    en: ['Keep going! 💪', 'You\'re doing great!', 'Amazing progress!', 'Stay consistent!'],
    hi: ['आगे बढ़ते रहो! 💪', 'बहुत अच्छा!'],
    mr: ['पुढे चला! 💪', 'छान चाललंय!'],
    ta: ['தொடருங்கள்! 💪', 'நன்றாக செய்கிறீர்கள்!'],
    te: ['కొనసాగించు! 💪', 'బాగా చేస్తున్నావు!'],
    kn: ['ಮುಂದುವರಿಸಿ! 💪', 'ಅದ್ಭುತ!'],
    bn: ['চালিয়ে যান! 💪', 'দুর্দান্ত!'],
  };

  const fallbacks = fallbacksByLang[language] || fallbacksByLang.en;

  try {
    const text = await callSambaNova([
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Generate a very short motivational message for someone on a ${streakDays} day learning streak.

${getStrictLanguageInstruction(language)}

Return only the message.`,
      },
    ], { temperature: 0.5, top_p: 0.9, max_tokens: 64 });

    const cleaned = text.trim().replace(/["'!.]/g, '').slice(0, 30);
    return cleaned || fallbacks[streakDays % fallbacks.length];
  } catch (error) {
    console.error('Error getting motivation:', error);
    return fallbacks[streakDays % fallbacks.length];
  }
};

export default {
  initializeGemini,
  initializeSambaNova,
  isGeminiAvailable,
  isSambaNovaAvailable,
  generateScamScenarios,
  generateQuizQuestion,
  getScamAwarenessTip,
  analyzeMessageWithAI,
  generateBills,
  generateDailyChallenges,
  getStreakMotivation,
  translateWithGemini,
  translateJSONFields,
};