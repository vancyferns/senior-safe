/**
 * Firebase Configuration
 * Used for Phone Authentication with OTP
 */

import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase only if config is available
let app = null;
let auth = null;

export const initializeFirebase = () => {
    if (!firebaseConfig.apiKey) {
        console.warn('Firebase not configured. Phone OTP verification will be disabled.');
        return false;
    }

    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        // Set language to user's browser language
        auth.languageCode = navigator.language || 'en';
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
};

export const isFirebaseConfigured = () => {
    return !!firebaseConfig.apiKey;
};

export const getFirebaseAuth = () => auth;

/**
 * Setup invisible reCAPTCHA for phone auth
 * @param {string} buttonId - ID of the button element to attach reCAPTCHA
 * @returns {RecaptchaVerifier} The reCAPTCHA verifier instance
 */
export const setupRecaptcha = (buttonId) => {
    if (!auth) {
        initializeFirebase();
    }

    if (!auth) {
        throw new Error('Firebase not initialized');
    }

    // Clear any existing reCAPTCHA
    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
        size: 'invisible',
        callback: () => {
            // reCAPTCHA solved
            console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
            // Response expired, reset
            console.log('reCAPTCHA expired');
        }
    });

    return window.recaptchaVerifier;
};

/**
 * Send OTP to phone number
 * @param {string} phoneNumber - Phone number with country code (e.g., +919876543210)
 * @returns {Promise<ConfirmationResult>} Confirmation result for verifying OTP
 */
export const sendOTP = async (phoneNumber) => {
    if (!auth) {
        initializeFirebase();
    }

    if (!auth) {
        throw new Error('Firebase not initialized');
    }

    // Format phone number if needed
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
        // Assume Indian number if no country code
        formattedPhone = '+91' + formattedPhone.replace(/^0/, '');
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{10,14}$/;
    if (!phoneRegex.test(formattedPhone.replace(/\s/g, ''))) {
        throw new Error('Invalid phone number format');
    }

    try {
        const appVerifier = window.recaptchaVerifier;
        if (!appVerifier) {
            throw new Error('reCAPTCHA not initialized. Call setupRecaptcha first.');
        }

        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);

        // Store confirmation result for later verification
        window.confirmationResult = confirmationResult;

        return confirmationResult;
    } catch (error) {
        console.error('OTP send error:', error);

        // Reset reCAPTCHA on error
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
        }

        throw error;
    }
};

/**
 * Verify OTP entered by user
 * @param {string} otp - The 6-digit OTP
 * @returns {Promise<UserCredential>} The user credential on success
 */
export const verifyOTP = async (otp) => {
    if (!window.confirmationResult) {
        throw new Error('No OTP request pending. Please request OTP first.');
    }

    try {
        const result = await window.confirmationResult.confirm(otp);

        // Clear confirmation result after successful verification
        window.confirmationResult = null;

        return result;
    } catch (error) {
        console.error('OTP verification error:', error);
        throw error;
    }
};

/**
 * Clean up reCAPTCHA and confirmation result
 */
export const cleanupPhoneAuth = () => {
    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
    }
    window.confirmationResult = null;
};

export default {
    initializeFirebase,
    isFirebaseConfigured,
    getFirebaseAuth,
    setupRecaptcha,
    sendOTP,
    verifyOTP,
    cleanupPhoneAuth
};
