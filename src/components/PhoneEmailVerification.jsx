import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import Button from './ui/Button';
import Modal from './ui/Modal';

/**
 * Phone Verification Component using Phone.Email
 * 
 * FREE phone verification - works like "Sign in with Google" for phone numbers
 * No SMS API or OTP handling needed - Phone.Email handles everything!
 * 
 * Integration based on: https://www.phone.email/docs-sign-in-with-phone
 */

const PHONE_EMAIL_CLIENT_ID = import.meta.env.VITE_PHONE_EMAIL_CLIENT_ID;

const PhoneEmailVerification = ({
    isOpen,
    onClose,
    onVerified,
    countryCode = '91'
}) => {
    const [step, setStep] = useState('verify'); // 'verify' | 'loading' | 'verified' | 'error'
    const [verifiedPhone, setVerifiedPhone] = useState(null);
    const [error, setError] = useState('');
    const buttonContainerRef = useRef(null);
    const scriptLoadedRef = useRef(false);

    // Check if properly configured
    const isConfigured = PHONE_EMAIL_CLIENT_ID &&
        PHONE_EMAIL_CLIENT_ID !== 'your-phone-email-client-id';

    // Handle verification success - called by Phone.Email via global listener
    const handlePhoneVerified = useCallback(async (userObj) => {
        try {
            setStep('loading');

            console.log('📱 Phone.Email callback received:', userObj);

            // Fetch user data from the JSON URL provided by Phone.Email
            const response = await fetch(userObj.user_json_url);
            if (!response.ok) throw new Error('Failed to verify phone');

            const userData = await response.json();
            console.log('📱 User data from Phone.Email:', userData);

            const phoneData = {
                countryCode: userData.user_country_code || countryCode,
                phoneNumber: userData.user_phone_number,
                fullPhone: `${userData.user_country_code}${userData.user_phone_number}`,
                firstName: userData.user_first_name || '',
                lastName: userData.user_last_name || ''
            };

            console.log('✅ Phone verified via Phone.Email:', phoneData);

            setVerifiedPhone(phoneData);
            setStep('verified');

            // Call parent callback
            if (onVerified) {
                onVerified(phoneData.phoneNumber, phoneData.countryCode);
            }

            // Auto-close after showing success
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            console.error('Phone.Email verification error:', err);
            setError('Verification failed. Please try again.');
            setStep('error');
        }
    }, [countryCode, onVerified, onClose]);

    // Set up global listener - this is what Phone.Email calls
    useEffect(() => {
        // Define the global callback that Phone.Email will call
        window.phoneEmailListener = (userObj) => {
            handlePhoneVerified(userObj);
        };

        return () => {
            // Cleanup on unmount
            delete window.phoneEmailListener;
        };
    }, [handlePhoneVerified]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('verify');
            setError('');
            setVerifiedPhone(null);
        }
    }, [isOpen]);

    // Load Phone.Email script and button when modal opens
    useEffect(() => {
        if (!isOpen || !isConfigured || step !== 'verify') return;
        if (!buttonContainerRef.current) return;

        // Clear previous content
        buttonContainerRef.current.innerHTML = '';

        // Create the Phone.Email button div (exactly as per their docs)
        const peButton = document.createElement('div');
        peButton.className = 'pe_signin_button';
        peButton.setAttribute('data-client-id', PHONE_EMAIL_CLIENT_ID);

        // Create and add the script
        const script = document.createElement('script');
        script.src = 'https://www.phone.email/sign_in_button_v1.js';
        script.async = true;

        peButton.appendChild(script);
        buttonContainerRef.current.appendChild(peButton);

        console.log('📱 Phone.Email button rendered with Client ID:', PHONE_EMAIL_CLIENT_ID);

    }, [isOpen, isConfigured, step]);

    // Mock verification for demo mode
    const handleMockVerify = () => {
        setStep('loading');
        setTimeout(() => {
            const mockData = {
                countryCode: '91',
                phoneNumber: '9876543210',
                fullPhone: '919876543210'
            };
            setVerifiedPhone(mockData);
            setStep('verified');

            if (onVerified) {
                onVerified(mockData.phoneNumber, mockData.countryCode);
            }

            setTimeout(() => onClose(), 2000);
        }, 1500);
    };

    const handleClose = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Verify Phone Number">
            <div className="p-4">
                {/* Verify Step */}
                {step === 'verify' && (
                    <div className="space-y-4">
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Phone className="text-green-600" size={28} />
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 mb-1">
                                Verify Your Phone Number
                            </h3>
                            <p className="text-slate-600 text-sm">
                                Click the button below to verify your phone via OTP
                            </p>
                        </div>

                        {isConfigured ? (
                            <>
                                {/* Phone.Email Button Container - renders exactly as per their docs */}
                                <div
                                    ref={buttonContainerRef}
                                    className="flex justify-center py-4 min-h-[60px]"
                                />

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                )}

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                                    <p className="text-blue-700 text-xs text-center">
                                        🔒 Secure verification powered by Phone.Email
                                        <br />
                                        <span className="text-blue-500">FREE: 1000 SMS/month</span>
                                    </p>
                                </div>
                            </>
                        ) : (
                            // Demo mode when not configured
                            <div className="space-y-4">
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-amber-800 font-medium text-sm">Demo Mode</p>
                                            <p className="text-amber-700 text-xs mt-1">
                                                Phone.Email is not configured. Using demo verification.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleMockVerify}
                                    fullWidth
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <span className="flex items-center gap-2 justify-center">
                                        <Phone size={18} />
                                        Demo: Verify Phone
                                    </span>
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Loading Step */}
                {step === 'loading' && (
                    <div className="text-center py-8">
                        <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-slate-600">Verifying your phone number...</p>
                    </div>
                )}

                {/* Error Step */}
                {step === 'error' && (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="text-red-600" size={32} />
                        </div>
                        <h3 className="font-bold text-lg text-red-700 mb-2">
                            Verification Failed
                        </h3>
                        <p className="text-slate-600 text-sm mb-4">{error}</p>
                        <Button onClick={() => setStep('verify')} variant="outline">
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Verified Step */}
                {step === 'verified' && verifiedPhone && (
                    <div className="text-center py-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <CheckCircle className="text-green-600" size={40} />
                        </div>
                        <h3 className="font-bold text-xl text-green-700 mb-2">
                            Phone Verified!
                        </h3>
                        <p className="text-slate-600">
                            +{verifiedPhone.countryCode} {verifiedPhone.phoneNumber}
                        </p>
                        <p className="text-slate-500 text-sm mt-2">
                            has been verified successfully
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default PhoneEmailVerification;
