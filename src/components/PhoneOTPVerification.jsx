import React, { useState, useEffect, useRef } from 'react';
import { Phone, Send, CheckCircle, XCircle, Loader2, RefreshCw, Shield } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';
import { setupRecaptcha, sendOTP, verifyOTP, cleanupPhoneAuth, isFirebaseConfigured } from '../lib/firebase';

/**
 * Phone OTP Verification Component
 * Uses Firebase Phone Auth for real OTP verification
 */
const PhoneOTPVerification = ({
    isOpen,
    onClose,
    phoneNumber,
    onVerified,
    onPhoneChange
}) => {
    const [step, setStep] = useState('input'); // 'input' | 'otp' | 'verified' | 'error'
    const [phone, setPhone] = useState(phoneNumber || '');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [isFirebaseReady, setIsFirebaseReady] = useState(false);

    const otpRefs = useRef([]);
    const sendButtonRef = useRef(null);

    // Check Firebase configuration
    useEffect(() => {
        setIsFirebaseReady(isFirebaseConfigured());
    }, []);

    // Setup reCAPTCHA when modal opens
    useEffect(() => {
        if (isOpen && isFirebaseReady && step === 'input') {
            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                try {
                    // Ensure reCAPTCHA is initialized even if the ref wasn't attached
                    // (Button now forwards refs; this is defensive)
                    setupRecaptcha('send-otp-button');
                } catch (error) {
                    console.error('reCAPTCHA setup error:', error);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isFirebaseReady, step]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupPhoneAuth();
        };
    }, []);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('input');
            setPhone(formatPhoneNumber(phoneNumber || ''));
            setOtp(['', '', '', '', '', '']);
            setError('');
            setCountdown(0);
        }
    }, [isOpen, phoneNumber]);

    const formatPhoneNumber = (value) => {
        // Remove non-digits
        const digits = value.replace(/\D/g, '');
        // Limit to 10 digits (Indian number without country code)
        return digits.slice(0, 10);
    };

    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPhone(formatted);
        setError('');
    };

    const handleSendOTP = async () => {
        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Format phone with country code
            const fullPhone = '+91' + phone;
            await sendOTP(fullPhone);
            setStep('otp');
            setCountdown(60); // 60 seconds cooldown
        } catch (error) {
            console.error('Send OTP error:', error);
            if (error.code === 'auth/too-many-requests') {
                setError('Too many attempts. Please try again later.');
            } else if (error.code === 'auth/invalid-phone-number') {
                setError('Invalid phone number format.');
            } else if (error.code === 'auth/billing-not-enabled') {
                setError('Firebase billing is not enabled for Phone Auth. Add billing or add test phone numbers in the Firebase Console (Authentication → Sign-in method → Phone).');
                // keep Firebase enabled flag so developer knows it's configured, but prevent further attempts
            } else if (error.message && error.message.includes('billing is not enabled')) {
                setError('Firebase billing is not enabled for Phone Auth. Add billing or add test phone numbers in the Firebase Console (Authentication → Sign-in method → Phone).');
            } else {
                setError(error.message || 'Failed to send OTP. Please try again.');
            }
            // Re-setup reCAPTCHA after error
            setTimeout(() => {
                try {
                    setupRecaptcha('send-otp-button');
                } catch (e) {
                    console.error('reCAPTCHA re-setup error:', e);
                }
            }, 1000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOTP = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter the 6-digit OTP');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await verifyOTP(otpString);
            setStep('verified');

            // Call parent callback with verified phone
            if (onVerified) {
                onVerified(phone);
            }
            if (onPhoneChange) {
                onPhoneChange(phone);
            }

            // Close modal after showing success
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Verify OTP error:', error);
            if (error.code === 'auth/invalid-verification-code') {
                setError('Invalid OTP. Please check and try again.');
            } else if (error.code === 'auth/code-expired') {
                setError('OTP expired. Please request a new one.');
            } else {
                setError(error.message || 'Verification failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (countdown > 0) return;

        setOtp(['', '', '', '', '', '']);
        setError('');

        // Re-setup reCAPTCHA and send OTP
        try {
            setupRecaptcha('resend-otp-button');
            await handleSendOTP();
        } catch (error) {
            console.error('Resend error:', error);
        }
    };

    // If Firebase not configured, show mock OTP flow
    if (!isFirebaseReady) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Verify Phone Number">
                <div className="text-center p-4">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="text-amber-600" size={32} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">
                        Firebase Not Configured
                    </h3>
                    <p className="text-slate-600 text-sm mb-4">
                        Phone OTP verification requires Firebase configuration.
                        Please add Firebase credentials to your .env file.
                    </p>
                    <Button onClick={onClose}>Close</Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Verify Phone Number">
            <div className="p-4">
                {step === 'input' && (
                    <div className="space-y-4">
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Phone className="text-blue-600" size={28} />
                            </div>
                            <p className="text-slate-600 text-sm">
                                We'll send a verification code to your mobile number
                            </p>
                        </div>

                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                                +91
                            </span>
                            <Input
                                type="tel"
                                value={phone}
                                onChange={handlePhoneChange}
                                placeholder="Enter 10-digit mobile number"
                                className="pl-12"
                                maxLength={10}
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                                <XCircle size={14} />
                                {error}
                            </p>
                        )}

                        <Button
                            id="send-otp-button"
                            ref={sendButtonRef}
                            onClick={handleSendOTP}
                            disabled={phone.length !== 10 || isLoading}
                            fullWidth
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 size={18} className="animate-spin" />
                                    Sending OTP...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Send size={18} />
                                    Send OTP
                                </span>
                            )}
                        </Button>
                    </div>
                )}

                {step === 'otp' && (
                    <div className="space-y-4">
                        <div className="text-center mb-4">
                            <p className="text-slate-600 text-sm">
                                Enter the 6-digit code sent to
                            </p>
                            <p className="font-bold text-slate-900">+91 {phone}</p>
                        </div>

                        <div className="flex justify-center gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (otpRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                                    maxLength={1}
                                />
                            ))}
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm text-center flex items-center justify-center gap-1">
                                <XCircle size={14} />
                                {error}
                            </p>
                        )}

                        <Button
                            onClick={handleVerifyOTP}
                            disabled={otp.join('').length !== 6 || isLoading}
                            fullWidth
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 size={18} className="animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <CheckCircle size={18} />
                                    Verify OTP
                                </span>
                            )}
                        </Button>

                        <div className="text-center">
                            <button
                                id="resend-otp-button"
                                onClick={handleResendOTP}
                                disabled={countdown > 0}
                                className={`text-sm ${countdown > 0
                                        ? 'text-slate-400 cursor-not-allowed'
                                        : 'text-blue-600 hover:text-blue-700'
                                    }`}
                            >
                                {countdown > 0 ? (
                                    <span>Resend OTP in {countdown}s</span>
                                ) : (
                                    <span className="flex items-center gap-1 justify-center">
                                        <RefreshCw size={14} />
                                        Resend OTP
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'verified' && (
                    <div className="text-center py-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <CheckCircle className="text-green-600" size={40} />
                        </div>
                        <h3 className="font-bold text-xl text-green-700 mb-2">
                            Phone Verified!
                        </h3>
                        <p className="text-slate-600">
                            +91 {phone} has been verified successfully
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default PhoneOTPVerification;
