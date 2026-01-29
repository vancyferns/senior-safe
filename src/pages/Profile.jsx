import React, { useState } from 'react';
import { ArrowLeft, User, Lock, Shield, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import PinPad from '../components/simulation/PinPad';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

const Profile = () => {
    const { user } = useAuth();
    const { isPinSet, setUpiPin, verifyPin, changePin } = useWallet();
    const navigate = useNavigate();

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
                        <h1 className="font-bold text-lg text-slate-800">Profile & Settings</h1>
                        <p className="text-xs text-slate-500">Manage your account</p>
                    </div>
                </div>
            </header>

            <div className="max-w-md mx-auto p-4 space-y-4">
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
        </div>
    );
};

export default Profile;
