import React, { useState, useEffect } from 'react';
import { ArrowLeft, Receipt, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PinPad from '../components/simulation/PinPad';
import SuccessScreen from '../components/simulation/SuccessScreen';
import Confetti from 'react-confetti';

// Mock EMI/Bill data
const MOCK_BILLS = [
    {
        id: 1,
        type: 'Loan EMI',
        provider: 'SeniorSafe Bank',
        amount: 2500,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        icon: '🏦',
        isPaid: false
    },
    {
        id: 2,
        type: 'Electricity Bill',
        provider: 'State Electricity Board',
        amount: 1850,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        icon: '⚡',
        isPaid: false
    },
    {
        id: 3,
        type: 'Mobile Recharge',
        provider: 'Jio Prepaid',
        amount: 349,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        icon: '📱',
        isPaid: false
    },
    {
        id: 4,
        type: 'Gas Bill',
        provider: 'City Gas Ltd',
        amount: 680,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        icon: '🔥',
        isPaid: false
    }
];

const EMIPayment = () => {
    const { balance, addTransaction } = useWallet();
    
    const [bills, setBills] = useState(() => {
        const saved = localStorage.getItem('seniorSafe_bills');
        return saved ? JSON.parse(saved) : MOCK_BILLS;
    });
    const [selectedBill, setSelectedBill] = useState(null);
    const [step, setStep] = useState('list'); // 'list', 'confirm', 'pin', 'success'
    const [showConfetti, setShowConfetti] = useState(false);

    // Save bills to localStorage
    useEffect(() => {
        localStorage.setItem('seniorSafe_bills', JSON.stringify(bills));
    }, [bills]);

    const getDaysUntilDue = (dueDate) => {
        const due = new Date(dueDate);
        const now = new Date();
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getUrgencyColor = (days) => {
        if (days <= 1) return 'text-red-600 bg-red-50 border-red-200';
        if (days <= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-green-600 bg-green-50 border-green-200';
    };

    const handleSelectBill = (bill) => {
        setSelectedBill(bill);
        setStep('confirm');
    };

    const handleConfirmPayment = () => {
        if (balance < selectedBill.amount) {
            alert('Insufficient balance!');
            return;
        }
        setStep('pin');
    };

    const handlePinComplete = (_pin) => {
        // Process payment
        addTransaction(selectedBill.amount, 'DEBIT', `${selectedBill.type} Payment`, selectedBill.provider);
        
        // Mark bill as paid
        setBills(prev => prev.map(b => 
            b.id === selectedBill.id ? { ...b, isPaid: true } : b
        ));
        
        setShowConfetti(true);
        setStep('success');
    };

    const handleSuccessClose = () => {
        setShowConfetti(false);
        setStep('list');
        setSelectedBill(null);
    };

    const unpaidBills = bills.filter(b => !b.isPaid);
    const paidBills = bills.filter(b => b.isPaid);

    if (step === 'success') {
        return (
            <>
                {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
                <SuccessScreen
                    amount={selectedBill.amount}
                    recipient={selectedBill.provider}
                    message={`${selectedBill.type} paid successfully!`}
                    onClose={handleSuccessClose}
                />
            </>
        );
    }

    if (step === 'pin') {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <header className="bg-white border-b border-slate-200 p-4">
                    <div className="flex items-center gap-3 max-w-md mx-auto">
                        <button onClick={() => setStep('confirm')} className="p-2 hover:bg-slate-100 rounded-full">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="font-bold text-lg text-slate-800">Enter PIN</h1>
                    </div>
                </header>
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <p className="text-slate-600 mb-6">Enter your 4-digit PIN to confirm payment</p>
                    <PinPad onComplete={handlePinComplete} />
                </div>
            </div>
        );
    }

    if (step === 'confirm' && selectedBill) {
        return (
            <div className="min-h-screen bg-slate-100">
                <header className="bg-white border-b border-slate-200 p-4">
                    <div className="flex items-center gap-3 max-w-md mx-auto">
                        <button onClick={() => setStep('list')} className="p-2 hover:bg-slate-100 rounded-full">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="font-bold text-lg text-slate-800">Confirm Payment</h1>
                    </div>
                </header>
                <div className="max-w-md mx-auto p-4 space-y-4">
                    <Card className="text-center">
                        <div className="text-4xl mb-2">{selectedBill.icon}</div>
                        <h2 className="font-bold text-lg text-slate-800">{selectedBill.type}</h2>
                        <p className="text-slate-600">{selectedBill.provider}</p>
                        
                        <div className="my-6 py-4 border-y border-slate-200">
                            <p className="text-sm text-slate-500">Amount to Pay</p>
                            <p className="text-4xl font-bold text-slate-900">₹{selectedBill.amount.toLocaleString()}</p>
                        </div>

                        <div className="flex justify-between text-sm text-slate-600 mb-4">
                            <span>Your Balance</span>
                            <span className="font-semibold">₹{balance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600 mb-4">
                            <span>After Payment</span>
                            <span className={`font-semibold ${balance - selectedBill.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                ₹{(balance - selectedBill.amount).toLocaleString()}
                            </span>
                        </div>

                        {balance < selectedBill.amount && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-red-600 flex items-center gap-2">
                                    <AlertTriangle size={16} />
                                    Insufficient balance
                                </p>
                            </div>
                        )}

                        <Button 
                            onClick={handleConfirmPayment} 
                            className="w-full"
                            disabled={balance < selectedBill.amount}
                        >
                            Pay ₹{selectedBill.amount.toLocaleString()}
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
                <div className="flex items-center gap-3 max-w-md mx-auto">
                    <Link to="/" className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="font-bold text-lg text-slate-800">Bills & EMI</h1>
                        <p className="text-xs text-slate-500">Pay your pending dues</p>
                    </div>
                </div>
            </header>

            <div className="max-w-md mx-auto p-4 space-y-4">
                {/* Balance Card */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white">
                    <p className="text-indigo-100 text-sm">Available Balance</p>
                    <p className="text-3xl font-bold">₹{balance.toLocaleString()}</p>
                </div>

                {/* Pending Bills */}
                {unpaidBills.length > 0 ? (
                    <div>
                        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Clock size={18} className="text-orange-500" />
                            Pending Bills ({unpaidBills.length})
                        </h2>
                        <div className="space-y-2">
                            {unpaidBills.map((bill) => {
                                const daysLeft = getDaysUntilDue(bill.dueDate);
                                return (
                                    <button
                                        key={bill.id}
                                        onClick={() => handleSelectBill(bill)}
                                        className="w-full bg-white rounded-xl p-4 border-2 border-slate-200 hover:border-brand-blue transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl">{bill.icon}</div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-800">{bill.type}</p>
                                                <p className="text-xs text-slate-500">{bill.provider}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-800">₹{bill.amount.toLocaleString()}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getUrgencyColor(daysLeft)}`}>
                                                    {daysLeft <= 0 ? 'Overdue!' : daysLeft === 1 ? 'Due Tomorrow' : `${daysLeft} days left`}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <Card className="text-center py-8">
                        <CheckCircle size={48} className="text-green-500 mx-auto mb-2" />
                        <h3 className="font-bold text-green-700">All bills paid!</h3>
                        <p className="text-sm text-slate-600">Great job staying on top of your payments.</p>
                    </Card>
                )}

                {/* Paid Bills */}
                {paidBills.length > 0 && (
                    <div>
                        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-500" />
                            Paid ({paidBills.length})
                        </h2>
                        <div className="space-y-2">
                            {paidBills.map((bill) => (
                                <div
                                    key={bill.id}
                                    className="bg-green-50 rounded-xl p-4 border border-green-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl opacity-50">{bill.icon}</div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-green-800">{bill.type}</p>
                                            <p className="text-xs text-green-600">{bill.provider}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-700">₹{bill.amount.toLocaleString()}</p>
                                            <span className="text-xs text-green-600">Paid ✓</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Link to Loan Center */}
                <Link
                    to="/loan-center"
                    className="block bg-slate-100 rounded-xl p-4 border-2 border-dashed border-slate-300 hover:border-blue-800 transition-colors text-center"
                >
                    <p className="font-semibold text-blue-800">Need a Loan?</p>
                    <p className="text-xs text-slate-600">Learn about EMI with our calculator →</p>
                </Link>
            </div>
        </div>
    );
};

export default EMIPayment;
