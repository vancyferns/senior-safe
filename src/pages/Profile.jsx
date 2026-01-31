import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Lock, Shield, Eye, EyeOff, Check, AlertCircle, Phone, Edit2, Loader2, AlertTriangle, Globe, ChevronRight, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { useLanguage } from '../context/LanguageContext';
import PinPad from '../components/simulation/PinPad';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PhoneEmailVerification from '../components/PhoneEmailVerification';
import { updateUserPhone, isSupabaseConfigured } from '../lib/supabase';

const Profile = () => {
    const { user, dbUser, refreshUser } = useAuth();
    const { isPinSet, setUpiPin, verifyPin, changePin } = useWallet();
    const { currentLanguage, changeLanguage, languages, getCurrentLanguageInfo } = useLanguage();
    const navigate = useNavigate();

    // Phone number states
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSavingPhone, setIsSavingPhone] = useState(false);
    const [phoneError, setPhoneError] = useState('');
    const [phoneSuccess, setPhoneSuccess] = useState('');

    // OTP Verification states
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);

    // Language states
    const [pendingLanguage, setPendingLanguage] = useState(currentLanguage);
    const [isSavingLanguage, setIsSavingLanguage] = useState(false);
    const [languageSaved, setLanguageSaved] = useState(false);

    // Sync pending language with current on mount
    useEffect(() => {
        setPendingLanguage(currentLanguage);
    }, [currentLanguage]);

    // Handle save language - clears all cached content and applies new language
    const handleSaveLanguage = async () => {
        if (pendingLanguage === currentLanguage) return;

        setIsSavingLanguage(true);
        setLanguageSaved(false);

        try {
            // Clear ALL cached AI-generated content to force regeneration
            const keysToRemove = [
                'seniorSafe_challenges_v2',           // Daily challenges
                'seniorSafe_completed_challenges',    // Completed challenge history
                'seniorSafe_scam_scenarios',          // Cached scam scenarios
                'seniorSafe_bills',                   // Cached bills
                'seniorSafe_motivation'               // Cached motivation messages
            ];

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            // Apply the new language
            changeLanguage(pendingLanguage);

            // Show success
            setLanguageSaved(true);

            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setLanguageSaved(false);
            }, 3000);

        } catch (error) {
            console.error('Error saving language:', error);
        } finally {
            setIsSavingLanguage(false);
        }
    };

    // Load current phone on mount
    useEffect(() => {
        if (dbUser?.phone) {
            setPhoneNumber(dbUser.phone);
        }
    }, [dbUser]);

    // Handle OTP verification success from Phone.Email
    const handlePhoneVerified = async (verifiedPhoneNumber, countryCode) => {
        console.log('📱 Phone.Email verification success:', { verifiedPhoneNumber, countryCode });

        setIsPhoneVerified(true);
        // Don't close modal yet - let the success animation show in PhoneEmailVerification

        // Update phoneNumber state with verified number
        setPhoneNumber(verifiedPhoneNumber);

        // Now save the verified phone number to database
        setIsSavingPhone(true);
        setPhoneError('');
        setPhoneSuccess('');

        try {
            console.log('💾 Saving verified phone to database...', { userId: dbUser?.id, phone: verifiedPhoneNumber });

            const { user, error } = await updateUserPhone(dbUser.id, verifiedPhoneNumber, true);

            if (error) {
                console.error('❌ Database update error:', error);
                setPhoneError('Failed to update phone number. Please try again.');
            } else {
                console.log('✅ Phone saved to database:', user);
                setPhoneSuccess('Phone number verified and saved successfully!');

                // Refresh user data to get updated phone_verified status
                if (refreshUser) {
                    console.log('🔄 Refreshing user data...');
                    await refreshUser();
                }

                // Close modals after a short delay
                setTimeout(() => {
                    setShowPhoneModal(false);
                    setShowOTPModal(false);
                    setPhoneSuccess('');
                    setIsPhoneVerified(false);
                }, 500);
            }
        } catch (err) {
            console.error('❌ Error saving phone:', err);
            setPhoneError('An error occurred. Please try again.');
        }
        setIsSavingPhone(false);
    };

    const handleSavePhone = async () => {
        if (!dbUser?.id || !isSupabaseConfigured()) {
            setPhoneError('Please sign in to update your phone number');
            return;
        }

        // Phone is now mandatory
        if (!phoneNumber || phoneNumber.length !== 10) {
            setPhoneError('Please enter a valid 10-digit phone number');
            return;
        }

        setPhoneError('');
        setPhoneSuccess('');

        // Open Phone.Email verification modal
        // Phone.Email handles everything - no need to check configuration
        setShowPhoneModal(false);
        setShowOTPModal(true);
    };

    // PIN Management States
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinMode, setPinMode] = useState('set'); // 'set', 'change', 'verify'
    const [pinStep, setPinStep] = useState(1); // 1: enter current/new, 2: confirm
    const [tempPin, setTempPin] = useState('');
    const [currentPin, setCurrentPin] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Open PIN setup/change modal
    const handlePinAction = () => {
        setError('');
        setSuccess('');
        setTempPin('');
        setCurrentPin('');

        if (isPinSet) {
            setPinMode('change');
            setPinStep(1); // First verify current PIN
        } else {
            setPinMode('set');
            setPinStep(1); // Set new PIN
        }
        setShowPinModal(true);
    };

    // Handle PIN input
    const handlePinComplete = async (pin) => {
        setError('');

        if (pinMode === 'set') {
            if (pinStep === 1) {
                // First entry - store and ask for confirmation
                setTempPin(pin);
                setPinStep(2);
            } else {
                // Confirmation step
                if (pin === tempPin) {
                    await setUpiPin(pin);
                    setSuccess('PIN set successfully! 🎉');
                    setTimeout(() => {
                        setShowPinModal(false);
                        setSuccess('');
                    }, 1500);
                } else {
                    setError('PINs do not match. Please try again.');
                    setPinStep(1);
                    setTempPin('');
                }
            }
        } else if (pinMode === 'change') {
            if (pinStep === 1) {
                // Verify current PIN
                if (verifyPin(pin)) {
                    setCurrentPin(pin);
                    setPinStep(2); // Enter new PIN
                } else {
                    setError('Incorrect current PIN. Please try again.');
                }
            } else if (pinStep === 2) {
                // Enter new PIN
                setTempPin(pin);
                setPinStep(3); // Confirm new PIN
            } else {
                // Confirm new PIN
                if (pin === tempPin) {
                    const result = await changePin(currentPin, pin);
                    if (result.success) {
                        setSuccess('PIN changed successfully! 🎉');
                        setTimeout(() => {
                            setShowPinModal(false);
                            setSuccess('');
                        }, 1500);
                    } else {
                        setError(result.error);
                    }
                } else {
                    setError('PINs do not match. Please try again.');
                    setPinStep(2);
                    setTempPin('');
                }
            }
        }
    };

    const getPinModalTitle = () => {
        if (pinMode === 'set') {
            return pinStep === 1 ? 'Set Your UPI PIN' : 'Confirm Your PIN';
        } else {
            if (pinStep === 1) return 'Enter Current PIN';
            if (pinStep === 2) return 'Enter New PIN';
            return 'Confirm New PIN';
        }
    };

    const getPinModalSubtitle = () => {
        if (pinMode === 'set') {
            return pinStep === 1
                ? 'Choose a 4-digit PIN for transactions'
                : 'Enter the same PIN again to confirm';
        } else {
            if (pinStep === 1) return 'Verify your identity first';
            if (pinStep === 2) return 'Choose your new 4-digit PIN';
            return 'Enter the new PIN again to confirm';
        }
    };

    const closePinModal = () => {
        setShowPinModal(false);
        setError('');
        setSuccess('');
        setTempPin('');
        setCurrentPin('');
        setPinStep(1);
    };

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
                <div className="flex items-center gap-3 max-w-md mx-auto">
                    <Link to="/" className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="font-bold text-lg text-slate-800">
                            Profile & Settings
                        </h1>
                        <p className="text-xs text-slate-500">
                            Manage your account
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-md mx-auto p-4 space-y-4">
                {/* Warning: incomplete profile */}
                {!dbUser?.phone && (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-amber-100 rounded-full p-2">
                                <AlertTriangle className="text-amber-600" size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-amber-800">Phone Number Required</h3>
                                <p className="text-sm text-amber-700 mt-1">
                                    Please add your phone number to complete registration. This allows friends and family to find and pay you.
                                </p>
                                <Button
                                    onClick={() => setShowPhoneModal(true)}
                                    className="mt-3 bg-amber-600 hover:bg-amber-700"
                                    size="sm"
                                >
                                    <Phone size={16} className="mr-2" />
                                    Add Phone Number
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-slate-100 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-800 flex items-center justify-center">
                            {user?.picture ? (
                                <img
                                    src={user.picture}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User size={40} className="text-white" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-slate-900">{user?.name || 'User'}</h2>
                            <p className="text-slate-600">{user?.email || 'Not signed in'}</p>
                            {dbUser?.phone && (
                                <p className={`text-sm flex items-center gap-1 mt-1 ${dbUser.phone_verified ? 'text-green-600' : 'text-amber-600'}`}>
                                    {dbUser.phone_verified ? (
                                        <>
                                            <Check size={14} />
                                            <span>+91 {dbUser.phone}</span>
                                            <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full ml-1">Verified</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle size={14} />
                                            <span>+91 {dbUser.phone}</span>
                                            <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full ml-1">Not Verified</span>
                                        </>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-slate-100 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-200">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Shield size={20} className="text-blue-800" />
                            Security Settings
                        </h3>
                    </div>

                    {/* UPI PIN Setting */}
                    <button
                        onClick={handlePinAction}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPinSet ? 'bg-green-100' : 'bg-amber-100'}`}>
                                <Lock size={20} className={isPinSet ? 'text-green-600' : 'text-amber-600'} />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-slate-800">Transaction PIN</p>
                                <p className="text-sm text-slate-500">
                                    {isPinSet ? 'PIN is set • Tap to change' : 'Not set • Tap to create'}
                                </p>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${isPinSet ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isPinSet ? 'Active' : 'Required'}
                        </div>
                    </button>
                </div>

                {/* Language Settings */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                    <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Globe size={20} className="text-purple-600" />
                            Language / भाषा
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Select language and tap Save to apply</p>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-2 gap-2">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => setPendingLanguage(lang.code)}
                                    className={`p-3 rounded-xl border-2 transition-all text-left ${pendingLanguage === lang.code
                                        ? 'border-purple-500 bg-purple-50 shadow-md'
                                        : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <p className={`font-bold text-sm ${pendingLanguage === lang.code ? 'text-purple-700' : 'text-slate-800'
                                        }`}>
                                        {lang.nativeName}
                                    </p>
                                    <p className="text-xs text-slate-500">{lang.name}</p>
                                    {pendingLanguage === lang.code && (
                                        <div className="mt-1">
                                            <Check size={14} className="text-purple-600" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Save Button */}
                        <div className="mt-4 space-y-2">
                            {pendingLanguage !== currentLanguage && (
                                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg text-center">
                                    ⚠️ Language changed. Tap Save to apply.
                                </p>
                            )}
                            <Button
                                onClick={handleSaveLanguage}
                                fullWidth
                                disabled={isSavingLanguage || pendingLanguage === currentLanguage}
                                className={pendingLanguage !== currentLanguage
                                    ? 'bg-purple-600 hover:bg-purple-700'
                                    : 'bg-slate-300'
                                }
                            >
                                {isSavingLanguage ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin" />
                                        Applying...
                                    </span>
                                ) : pendingLanguage !== currentLanguage ? (
                                    `Save & Apply ${languages.find(l => l.code === pendingLanguage)?.nativeName}`
                                ) : (
                                    `✓ ${getCurrentLanguageInfo().nativeName} Active`
                                )}
                            </Button>
                        </div>

                        {languageSaved && (
                            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                <p className="text-green-700 text-sm font-medium">
                                    ✅ Language saved! All content will now be in {getCurrentLanguageInfo().nativeName}.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="font-semibold text-blue-800">Why set a PIN?</p>
                            <p className="text-sm text-blue-700 mt-1">
                                Your UPI PIN adds an extra layer of security. Every transaction will require this PIN,
                                just like a real banking app. This helps you practice secure banking habits!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Account Info */}
                <div className="bg-slate-100 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-200">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <User size={20} className="text-blue-800" />
                            Account Information
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-200">
                        <div className="p-4 flex justify-between">
                            <span className="text-slate-600">Name</span>
                            <span className="font-medium text-slate-900">{user?.name || '-'}</span>
                        </div>
                        <div className="p-4 flex justify-between">
                            <span className="text-slate-600">Email</span>
                            <span className="font-medium text-slate-900 text-sm">{user?.email || '-'}</span>
                        </div>
                        {/* Phone Number - Editable */}
                        <button
                            onClick={() => {
                                setPhoneError('');
                                setPhoneSuccess('');
                                setShowPhoneModal(true);
                            }}
                            className="w-full p-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
                        >
                            <span className="text-slate-600">Phone Number</span>
                            <div className="flex items-center gap-2">
                                {dbUser?.phone ? (
                                    <>
                                        <span className="font-medium text-slate-900">+91 {dbUser.phone}</span>
                                        {dbUser.phone_verified ? (
                                            <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                <Check size={10} /> Verified
                                            </span>
                                        ) : (
                                            <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">
                                                Not Verified
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span className="font-medium text-amber-600">Add phone</span>
                                )}
                                <Edit2 size={14} className="text-slate-400" />
                            </div>
                        </button>
                        <div className="p-4 flex justify-between">
                            <span className="text-slate-600">Account Type</span>
                            <span className="font-medium text-blue-800">Demo Account</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* PIN Modal */}
            <Modal
                isOpen={showPinModal}
                onClose={closePinModal}
                title={getPinModalTitle()}
            >
                <div className="text-center">
                    <p className="text-slate-600 mb-6">{getPinModalSubtitle()}</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2 text-red-700">
                            <AlertCircle size={18} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2 text-green-700">
                            <Check size={18} />
                            <span className="text-sm">{success}</span>
                        </div>
                    )}

                    {!success && (
                        <PinPad
                            onComplete={handlePinComplete}
                            key={`${pinMode}-${pinStep}`} // Reset PinPad on step change
                        />
                    )}

                    <button
                        onClick={closePinModal}
                        className="mt-6 text-slate-500 hover:text-slate-700 text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </Modal>

            {/* Phone Number Modal */}
            <Modal
                isOpen={showPhoneModal}
                onClose={() => setShowPhoneModal(false)}
                title="Update Phone Number"
            >
                <div className="space-y-4">
                    <p className="text-slate-600 text-sm">
                        Your phone number helps friends find and pay you. It will be visible to other SeniorSafe users who search for you.
                    </p>

                    <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-medium">+91</span>
                        <Input
                            icon={Phone}
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="Enter 10-digit number"
                            maxLength={10}
                            className="flex-1"
                        />
                    </div>

                    {phoneError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                            <AlertCircle size={18} />
                            <span className="text-sm">{phoneError}</span>
                        </div>
                    )}

                    {phoneSuccess && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700">
                            <Check size={18} />
                            <span className="text-sm">{phoneSuccess}</span>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowPhoneModal(false)}
                            fullWidth
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSavePhone}
                            fullWidth
                            disabled={isSavingPhone || phoneNumber.length !== 10}
                        >
                            {isSavingPhone ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin" />
                                    Saving...
                                </span>
                            ) : 'Save Phone'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Phone.Email Verification Modal */}
            <PhoneEmailVerification
                isOpen={showOTPModal}
                onClose={() => {
                    setShowOTPModal(false);
                }}
                onVerified={handlePhoneVerified}
                countryCode="91"
            />
        </div>
    );
};

export default Profile;
