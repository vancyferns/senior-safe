import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, AlertTriangle, ChevronRight, Lock } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import PinPad from '../components/simulation/PinPad';
import SuccessScreen from '../components/simulation/SuccessScreen';

const LARGE_AMOUNT_THRESHOLD = 5000;

const SendMoney = () => {
    const { balance, contacts, addTransaction, isPinSet, verifyPin } = useWallet();
    const navigate = useNavigate();

    // --- Flow State ---
    const [step, setStep] = useState('select'); // 'select', 'amount', 'pin', 'success'
    const [selectedContact, setSelectedContact] = useState(null);
    const [amount, setAmount] = useState('');
    const [showLargeAmountWarning, setShowLargeAmountWarning] = useState(false);
    const [pinError, setPinError] = useState('');
    const [pinAttempts, setPinAttempts] = useState(0);

    // --- Handlers ---
    const handleSelectContact = (contact) => {
        setSelectedContact(contact);
        setStep('amount');
    };

    const handleAmountChange = (e) => {
        // Only allow numbers
        const value = e.target.value.replace(/[^0-9]/g, '');
        setAmount(value);
    };

    const handleProceedToPin = () => {
        const numAmount = parseInt(amount);

        if (!numAmount || numAmount <= 0) {
            return; // Don't proceed for invalid amounts
        }

        if (numAmount > balance) {
            alert('Insufficient balance! This is demo money, but we still check 😊');
            return;
        }

        // Check for large amount - show warning
        if (numAmount > LARGE_AMOUNT_THRESHOLD) {
            setShowLargeAmountWarning(true);
            return;
        }

        setPinError('');
        setPinAttempts(0);
        setStep('pin');
    };

    const handleLargeAmountProceed = () => {
        setShowLargeAmountWarning(false);
        setPinError('');
        setPinAttempts(0);
        setStep('pin');
    };

    const handlePinComplete = (pin) => {
        // Verify PIN if set
        if (isPinSet) {
            if (!verifyPin(pin)) {
                setPinAttempts(prev => prev + 1);
                if (pinAttempts >= 2) {
                    setPinError('Too many wrong attempts. Please try again later.');
                    setTimeout(() => {
                        navigate('/');
                    }, 2000);
                    return;
                }
                setPinError('Incorrect PIN. Please try again.');
                return;
            }
        }

        // PIN verified or not set - proceed with transaction
        const numAmount = parseInt(amount);
        addTransaction(numAmount, 'DEBIT', `Sent to ${selectedContact.name}`, selectedContact.name);
        setStep('success');
    };

    const handleBack = () => {
        if (step === 'amount') {
            setSelectedContact(null);
            setStep('select');
        } else if (step === 'pin') {
            setPinError('');
            setStep('amount');
        } else {
            navigate('/');
        }
    };

    // --- Success Screen ---
    if (step === 'success') {
        return (
            <SuccessScreen
                amount={parseInt(amount)}
                recipientName={selectedContact?.name}
                onDone={() => navigate('/')}
            />
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 flex items-center gap-3 sticky top-0 z-10">
                <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-full">
                    <ArrowLeft size={24} className="text-slate-700" />
                </button>
                <h1 className="text-xl font-bold text-slate-900">
                    {step === 'select' && 'Send Money'}
                    {step === 'amount' && `To ${selectedContact?.name}`}
                    {step === 'pin' && 'Enter PIN'}
                </h1>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* --- Step 1: Select Contact --- */}
                {step === 'select' && (
                    <div className="space-y-3">
                        <p className="text-slate-600 mb-4">
                            Choose who you want to send money to:
                        </p>

                        {contacts.map((contact) => (
                            <button
                                key={contact.id}
                                onClick={() => handleSelectContact(contact)}
                                className="w-full bg-white p-4 rounded-xl border-2 border-slate-200 flex items-center gap-4 hover:border-brand-blue transition-colors"
                            >
                                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg">
                                    {contact.name.charAt(0)}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-slate-800">{contact.name}</p>
                                    <p className="text-sm text-slate-500">{contact.phone}</p>
                                </div>
                                <ChevronRight size={24} className="text-slate-400" />
                            </button>
                        ))}

                        {contacts.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <User size={48} className="mx-auto mb-2 opacity-50" />
                                <p>No contacts yet. Add some from Home!</p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- Step 2: Enter Amount --- */}
                {step === 'amount' && (
                    <div className="space-y-6">
                        {/* Recipient Card */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                            <div className="w-14 h-14 bg-brand-blue rounded-full flex items-center justify-center text-white font-bold text-xl">
                                {selectedContact?.name?.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800">{selectedContact?.name}</p>
                                <p className="text-sm text-slate-500">{selectedContact?.phone}</p>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <label className="block text-sm font-semibold text-slate-600 mb-2">
                                Enter Amount
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-bold text-slate-400">₹</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    placeholder="0"
                                    className="text-4xl font-bold text-slate-900 w-full outline-none bg-transparent"
                                    autoFocus
                                />
                            </div>
                            <p className="text-sm text-slate-500 mt-2">
                                Available Balance: <span className="font-bold text-brand-blue">₹{balance.toLocaleString()}</span>
                            </p>
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="grid grid-cols-4 gap-2">
                            {[100, 500, 1000, 2000].map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => setAmount(preset.toString())}
                                    className="bg-slate-100 p-3 rounded-lg text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                                >
                                    ₹{preset}
                                </button>
                            ))}
                        </div>

                        <Button
                            onClick={handleProceedToPin}
                            fullWidth
                            size="lg"
                            disabled={!amount || parseInt(amount) <= 0}
                        >
                            Continue
                        </Button>
                    </div>
                )}

                {/* --- Step 3: PIN Entry --- */}
                {step === 'pin' && (
                    <div className="flex flex-col items-center pt-8">
                        <div className="mb-6 text-center">
                            <p className="text-slate-600 mb-1">Sending</p>
                            <p className="text-3xl font-bold text-brand-blue">₹{parseInt(amount).toLocaleString()}</p>
                            <p className="text-slate-600">to {selectedContact?.name}</p>
                        </div>

                        {/* PIN Not Set Warning */}
                        {!isPinSet && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 max-w-xs">
                                <div className="flex items-start gap-2">
                                    <Lock className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-sm text-amber-800">
                                            <strong>No PIN set!</strong> Any PIN will work now.
                                        </p>
                                        <Link to="/profile" className="text-xs text-amber-700 underline">
                                            Set your PIN for security →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <p className="text-center text-slate-600 mb-4 font-medium">
                                Enter your 4-digit PIN
                            </p>
                            <PinPad 
                                onComplete={handlePinComplete} 
                                error={pinError}
                                key={pinAttempts} // Reset PinPad on error
                            />
                        </div>

                        {isPinSet ? (
                            <p className="text-xs text-slate-400 mt-4 text-center">
                                Enter your secure PIN to confirm this transaction.
                            </p>
                        ) : (
                            <p className="text-xs text-slate-400 mt-4 text-center">
                                This is a simulated PIN. Any 4 digits will work.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Large Amount Warning Modal */}
            <Modal
                isOpen={showLargeAmountWarning}
                onClose={() => setShowLargeAmountWarning(false)}
                title="Large Amount"
                showClose={false}
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle size={32} className="text-amber-500" />
                    </div>

                    <p className="text-slate-700 mb-4">
                        You're sending <span className="font-bold text-red-600">₹{parseInt(amount).toLocaleString()}</span>.
                        <br />
                        <span className="text-sm">That's a large amount. Did you mean to send ₹{parseInt(amount) / 10}?</span>
                    </p>

                    <p className="text-xs text-slate-500 mb-6 bg-slate-50 p-3 rounded-lg">
                        💡 <strong>Tip:</strong> In real apps, always double-check large amounts before sending!
                    </p>

                    <div className="flex gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={() => setShowLargeAmountWarning(false)}
                            fullWidth
                        >
                            Go Back
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleLargeAmountProceed}
                            fullWidth
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SendMoney;
