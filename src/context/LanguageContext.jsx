import React, { createContext, useContext, useState, useEffect } from 'react';
import translations, { LANGUAGES } from '../data/translations';

const LanguageContext = createContext();

// Version for cache invalidation (increment when language logic changes)
const LANGUAGE_CACHE_VERSION = 2;

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    // Initialize from localStorage or default to English
    const [currentLanguage, setCurrentLanguage] = useState(() => {
        const saved = localStorage.getItem('seniorSafe_language');
        return saved || 'en';
    });

    // Auto-clear old cache if version mismatch (one-time cache invalidation)
    useEffect(() => {
        const savedVersion = localStorage.getItem('seniorSafe_lang_cache_version');
        if (savedVersion !== String(LANGUAGE_CACHE_VERSION)) {
            console.log('Language cache version mismatch, clearing old AI cache...');
            clearAICache();
            localStorage.setItem('seniorSafe_lang_cache_version', String(LANGUAGE_CACHE_VERSION));
        }
    }, []);

    // Save to localStorage whenever language changes
    useEffect(() => {
        localStorage.setItem('seniorSafe_language', currentLanguage);
    }, [currentLanguage]);

    // Clear all AI-generated cached content
    const clearAICache = () => {
        const keysToRemove = [
            'seniorSafe_challenges_v2',
            'seniorSafe_completed_challenges',
            'seniorSafe_scam_scenarios',
            'seniorSafe_bills',
            'seniorSafe_motivation'
        ];
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        console.log('AI cache cleared');
    };

    // Get translation for a key, with fallback to English
    const t = (key) => {
        const currentTranslations = translations[currentLanguage] || translations.en;
        const englishTranslations = translations.en;

        // Return translation in current language, or fall back to English
        return currentTranslations[key] || englishTranslations[key] || key;
    };

    // Change language
    const changeLanguage = (langCode) => {
        if (LANGUAGES.find(l => l.code === langCode)) {
            setCurrentLanguage(langCode);
        }
    };

    // Get current language info
    const getCurrentLanguageInfo = () => {
        return LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];
    };

    return (
        <LanguageContext.Provider value={{
            currentLanguage,
            changeLanguage,
            clearAICache,
            t,
            languages: LANGUAGES,
            getCurrentLanguageInfo,
        }}>
            {children}
        </LanguageContext.Provider>
    );
};

export default LanguageProvider;
