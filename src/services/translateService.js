/**
 * Free Translation Service using MyMemory API
 * NO API KEY REQUIRED - Completely free
 * Supports: English, Hindi, Marathi, Tamil, Telugu, Kannada, Bengali
 * 
 * Limits: 5000 characters/day (enough for most use cases)
 */

const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';

// Language code mapping for MyMemory
const LANG_CODES = {
    en: 'en',
    hi: 'hi',
    mr: 'mr',
    ta: 'ta',
    te: 'te',
    kn: 'kn',
    bn: 'bn'
};

/**
 * Translate text using MyMemory (FREE, no API key)
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (en, hi, mr, ta, te, kn, bn)
 * @param {string} sourceLang - Source language code (defaults to auto-detect 'hi' for Hinglish)
 * @returns {Promise<string>} Translated text
 */
export const translateText = async (text, targetLang = 'en', sourceLang = 'hi') => {
    if (!text || text.trim() === '') {
        return text;
    }

    // Don't translate if source and target are the same
    const source = LANG_CODES[sourceLang] || 'hi';
    const target = LANG_CODES[targetLang] || 'en';

    if (source === target) {
        return text;
    }

    try {
        const langPair = `${source}|${target}`;
        const url = `${MYMEMORY_API_URL}?q=${encodeURIComponent(text)}&langpair=${langPair}`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error('Translation API error:', response.status);
            return text;
        }

        const data = await response.json();

        if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
        }

        return text;
    } catch (error) {
        console.error('Translation error:', error);
        return text;
    }
};

/**
 * Translate multiple texts (one at a time to avoid rate limits)
 * @param {string[]} texts - Array of texts
 * @param {string} targetLang - Target language
 * @param {string} sourceLang - Source language
 * @returns {Promise<string[]>} Translated texts
 */
export const translateBatch = async (texts, targetLang = 'en', sourceLang = 'hi') => {
    if (!texts || texts.length === 0) {
        return texts;
    }

    const results = [];
    for (const text of texts) {
        const translated = await translateText(text, targetLang, sourceLang);
        results.push(translated);
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return results;
};

/**
 * Translate array of objects' specific fields
 * @param {Object[]} items - Array of objects
 * @param {string[]} fields - Fields to translate
 * @param {string} targetLang - Target language
 * @param {string} sourceLang - Source language
 * @returns {Promise<Object[]>} Objects with translated fields
 */
export const translateArray = async (items, fields, targetLang = 'en', sourceLang = 'hi') => {
    if (!items || items.length === 0) {
        return items;
    }

    const results = [];

    for (const item of items) {
        const translatedItem = { ...item };

        for (const field of fields) {
            if (item[field] && typeof item[field] === 'string') {
                translatedItem[field] = await translateText(item[field], targetLang, sourceLang);
                // Small delay
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        results.push(translatedItem);
    }

    return results;
};

/**
 * Check if text contains Hinglish (Hindi words in English script)
 * @param {string} text - Text to check
 * @returns {boolean} True if Hinglish detected
 */
export const containsHinglish = (text) => {
    if (!text) return false;

    const hinglishPatterns = [
        /namaste/i, /dost/i, /paisa/i, /rupay/i,
        /karo/i, /kijiye/i, /dekho/i, /banao/i,
        /apna/i, /aapke/i, /aapka/i, /humara/i,
        /aaj/i, /kal/i, /abhi/i, /jaldi/i,
        /badhai/i, /mubarak/i, /dhanyawad/i,
        /pyaar/i, /khushi/i, /safalta/i,
        /surakshit/i, /savdhan/i, /samjho/i,
        /seekho/i, /jaano/i, /pehchano/i
    ];

    return hinglishPatterns.some(pattern => pattern.test(text));
};

/**
 * Ensure text is in pure target language
 * If Hinglish detected and target is English, translate to English
 * @param {string} text - Text to check/translate
 * @param {string} targetLang - Target language
 * @returns {Promise<string>} Clean text in target language
 */
export const ensureLanguage = async (text, targetLang = 'en') => {
    if (!text) return text;

    // If target is English and text has Hinglish, translate it
    if (targetLang === 'en' && containsHinglish(text)) {
        return await translateText(text, 'en', 'hi');
    }

    return text;
};

export default {
    translateText,
    translateBatch,
    translateArray,
    containsHinglish,
    ensureLanguage
};
