import { useCallback } from 'react';

/**
 * Custom hook for Text-to-Speech using Web Speech API
 * Provides speak function and browser compatibility check
 */
export const useSpeech = () => {
    const isSupported = 'speechSynthesis' in window;

    const speak = useCallback((text, options = {}) => {
        if (!isSupported) {
            console.warn('Web Speech API not supported in this browser');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure options
        utterance.rate = options.rate || 0.9; // Slightly slower for seniors
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;
        utterance.lang = options.lang || 'en-IN'; // Indian English

        // Use a friendly voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
            v.lang.includes('en') && v.name.toLowerCase().includes('female')
        ) || voices.find(v => v.lang.includes('en')) || voices[0];
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
    }, [isSupported]);

    const stop = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.cancel();
        }
    }, [isSupported]);

    return { speak, stop, isSupported };
};

export default useSpeech;
