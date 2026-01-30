import React, { useState, useEffect } from 'react';
import { ArrowLeft, Receipt, Clock, AlertTriangle, CheckCircle, RefreshCw, Sparkles, Loader2, ChevronRight, FileText, Zap, Droplets, Flame, Smartphone, Wifi, Tv, CreditCard, Shield, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useAchievements } from '../context/AchievementContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PinPad from '../components/simulation/PinPad';
import SuccessScreen from '../components/simulation/SuccessScreen';
import Confetti from 'react-confetti';
import { generateBills, isGeminiAvailable } from '../services/geminiService';

// Fallback bills when AI is unavailable
const FALLBACK_BILLS = [
    {
        id: 1,
        type: 'Loan EMI',
        provider: 'SeniorSafe Bank',
        amount: 2500,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        icon: '🏦',
        consumerNumber: 'LN2024001234',
        billNumber: 'EMI-2026-01-001',
        billingPeriod: 'Jan 2026',
        breakdown: [{ item: 'Principal', amount: 2000 }, { item: 'Interest', amount: 500 }],
        isPaid: false
    },
    {
        id: 2,
        type: 'Electricity Bill',
        provider: 'BESCOM',
        amount: 1850,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        icon: '⚡',
        consumerNumber: 'K-123456789',
        billNumber: 'EB/2026/0001234',
        billingPeriod: 'Dec 2025',
        previousReading: 45230,
        currentReading: 45462,
        unitsConsumed: 232,
        breakdown: [{ item: 'Energy Charges', amount: 1520 }, { item: 'Fixed Charges', amount: 200 }, { item: 'Tax', amount: 130 }],
        isPaid: false
    },
    {
        id: 3,
        type: 'Mobile Recharge',
        provider: 'Jio',
        amount: 349,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        icon: '📱',
        consumerNumber: '9876543210',
        billNumber: 'JIO-PRE-349',
        billingPeriod: 'Feb 2026',
        breakdown: [{ item: '2GB/day + Unlimited Calls', amount: 349 }],
        isPaid: false
    },
    {
        id: 4,
        type: 'Gas Bill',
        provider: 'Indraprastha Gas Ltd',
        amount: 680,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        icon: '🔥',
        consumerNumber: 'IGL/DEL/123456',
        billNumber: 'GB-2026-01-5678',
        billingPeriod: 'Dec 2025',
        previousReading: 1250,
        currentReading: 1278,
        unitsConsumed: 28,
        breakdown: [{ item: 'Gas Consumption', amount: 560 }, { item: 'Service Charge', amount: 80 }, { item: 'GST', amount: 40 }],
        isPaid: false
    }
];

// Icon mapping for bill types
const getBillIcon = (type) => {
    const iconMap = {
        'Electricity': Zap,
        'Water': Droplets,
        'Gas': Flame,
        'Mobile': Smartphone,
        'Broadband': Wifi,
        'DTH': Tv,
        'Credit Card': CreditCard,
        'Insurance': Shield,
        'LPG': Package,
        'Loan': Receipt
    };
    
    for (const [key, Icon] of Object.entries(iconMap)) {
        if (type.toLowerCase().includes(key.toLowerCase())) {
            return Icon;
        }
    }
    return Receipt;
};

const EMIPayment = () => {
    const { balance, addTransaction } = useWallet();
    const { incrementStat } = useAchievements();
    
    const [bills, setBills] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAIGenerated, setIsAIGenerated] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [step, setStep] = useState('list'); // 'list', 'details', 'confirm', 'pin', 'processing', 'success'
    const [showConfetti, setShowConfetti] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);

    // Load bills on mount
    useEffect(() => {
        loadBills();
    }, []);

    const loadBills = async () => {
        setIsLoading(true);
        
        // Check for saved bills first
        const savedBills = localStorage.getItem('seniorSafe_bills_v2');
        if (savedBills) {
            const parsed = JSON.parse(savedBills);
            // Check if bills are still valid (not too old)
            const isValid = parsed.some(b => !b.isPaid);
            if (isValid) {
                setBills(parsed);
                setIsAIGenerated(parsed[0]?.isAIGenerated || false);
                setIsLoading(false);
                return;
            }
        }

        // Generate new bills
        if (isGeminiAvailable()) {
            try {
                const aiBills = await generateBills(4);
                setBills(aiBills);
                setIsAIGenerated(true);
                localStorage.setItem('seniorSafe_bills_v2', JSON.stringify(aiBills));
            } catch (error) {
                console.error('Failed to generate bills:', error);
                setBills(FALLBACK_BILLS);
                setIsAIGenerated(false);
            }
        } else {
            setBills(FALLBACK_BILLS);
            setIsAIGenerated(false);
        }
        
        setIsLoading(false);
    };

    const handleRefresh = async () => {
        localStorage.removeItem('seniorSafe_bills_v2');
        await loadBills();
    };

    // Save bills to localStorage whenever they change
    useEffect(() => {
        if (bills.length > 0) {
            localStorage.setItem('seniorSafe_bills_v2', JSON.stringify(bills));
        }
    }, [bills]);

    const getDaysUntilDue = (dueDate) => {
        const due = new Date(dueDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
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
        setStep('details');
    };

    const handleProceedToPayment = () => {
        if (balance < selectedBill.amount) {
            alert('Insufficient balance!');
            return;
        }
        setStep('confirm');
    };

    const handleConfirmPayment = () => {
        setStep('pin');
    };

    const handlePinComplete = async (_pin) => {
        // Show processing animation
        setStep('processing');
        setProcessingProgress(0);
        
        // Simulate realistic processing steps
        const steps = [
            { progress: 20, delay: 500 },
            { progress: 40, delay: 800 },
            { progress: 60, delay: 600 },
            { progress: 80, delay: 700 },
            { progress: 100, delay: 500 }
        ];

        for (const s of steps) {
            await new Promise(resolve => setTimeout(resolve, s.delay));
            setProcessingProgress(s.progress);
        }

        // Process payment
        addTransaction(selectedBill.amount, 'DEBIT', `${selectedBill.type} Payment`, selectedBill.provider);
        
        // Track achievement
        incrementStat('billsPaid');
        incrementStat('totalTransactions');
        
        // Mark bill as paid
        setBills(prev => prev.map(b => 
            b.id === selectedBill.id ? { ...b, isPaid: true, paidOn: new Date().toISOString() } : b
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

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
                <Loader2 size={48} className="animate-spin text-indigo-600 mb-4" />
                <p className="text-slate-600 font-medium">Fetching your bills...</p>
                <p className="text-sm text-slate-500">This may take a moment</p>
            </div>
        );
    }

    // Success screen
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

    // Processing animation
    if (step === 'processing') {
        const getProgressMessage = () => {
            if (processingProgress < 25) return 'Initiating payment...';
            if (processingProgress < 50) return 'Verifying account...';
            if (processingProgress < 75) return 'Processing transaction...';
            if (processingProgress < 100) return 'Finalizing...';
            return 'Complete!';
        };

        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="#e2e8f0"
                                strokeWidth="8"
                                fill="none"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="#6366f1"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${processingProgress * 2.51} 251`}
                                strokeLinecap="round"
                                className="transition-all duration-300"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-indigo-600">
                            {processingProgress}%
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Processing Payment</h2>
                    <p className="text-slate-600 mb-4">{getProgressMessage()}</p>
                    <div className="text-sm text-slate-500">
                        <p>₹{selectedBill?.amount.toLocaleString()} to {selectedBill?.provider}</p>
                    </div>
                </div>
            </div>
        );
    }

    // PIN entry
    if (step === 'pin') {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <header className="bg-white border-b border-slate-200 p-4">
                    <div className="flex items-center gap-3 max-w-md mx-auto">
                        <button onClick={() => setStep('confirm')} className="p-2 hover:bg-slate-100 rounded-full">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="font-bold text-lg text-slate-800">Secure Payment</h1>
                    </div>
                </header>
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <div className="bg-indigo-50 rounded-full p-4 mb-4">
                        <Shield size={32} className="text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Enter Your PIN</h2>
                    <p className="text-slate-600 mb-6 text-center">Authorize payment of ₹{selectedBill?.amount.toLocaleString()}</p>
                    <PinPad onComplete={handlePinComplete} />
                </div>
            </div>
        );
    }

    // Confirm payment step
    if (step === 'confirm' && selectedBill) {
        return (
            <div className="min-h-screen bg-slate-100">
                <header className="bg-white border-b border-slate-200 p-4">
                    <div className="flex items-center gap-3 max-w-md mx-auto">
                        <button onClick={() => setStep('details')} className="p-2 hover:bg-slate-100 rounded-full">
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

                        {/* Payment summary */}
                        <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Consumer No.</span>
                                <span className="font-mono font-medium text-slate-800">{selectedBill.consumerNumber}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Bill Number</span>
                                <span className="font-mono font-medium text-slate-800">{selectedBill.billNumber}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Billing Period</span>
                                <span className="font-medium text-slate-800">{selectedBill.billingPeriod}</span>
                            </div>
                        </div>

                        <div className="flex justify-between text-sm text-slate-600 mb-2">
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
                            Proceed to Pay ₹{selectedBill.amount.toLocaleString()}
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    // Bill details step (new!)
    if (step === 'details' && selectedBill) {
        const daysLeft = getDaysUntilDue(selectedBill.dueDate);
        const BillIcon = getBillIcon(selectedBill.type);

        return (
            <div className="min-h-screen bg-slate-100">
                <header className="bg-white border-b border-slate-200 p-4">
                    <div className="flex items-center gap-3 max-w-md mx-auto">
                        <button onClick={() => { setStep('list'); setSelectedBill(null); }} className="p-2 hover:bg-slate-100 rounded-full">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="font-bold text-lg text-slate-800">Bill Details</h1>
                    </div>
                </header>
                <div className="max-w-md mx-auto p-4 space-y-4">
                    {/* Bill header */}
                    <Card>
                        <div className="flex items-start gap-4">
                            <div className="bg-indigo-100 rounded-xl p-3">
                                <BillIcon size={28} className="text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <h2 className="font-bold text-lg text-slate-800">{selectedBill.type}</h2>
                                <p className="text-slate-600">{selectedBill.provider}</p>
                                <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium ${getUrgencyColor(daysLeft)}`}>
                                    {daysLeft <= 0 ? '⚠️ Overdue!' : daysLeft === 1 ? '⏰ Due Tomorrow' : `📅 ${daysLeft} days left`}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Consumer details */}
                    <Card>
                        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <FileText size={18} />
                            Account Details
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Consumer Number</span>
                                <span className="font-mono font-medium text-slate-800">{selectedBill.consumerNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Bill Number</span>
                                <span className="font-mono font-medium text-slate-800">{selectedBill.billNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Billing Period</span>
                                <span className="font-medium text-slate-800">{selectedBill.billingPeriod}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Due Date</span>
                                <span className="font-medium text-slate-800">{new Date(selectedBill.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Meter readings if available */}
                    {selectedBill.previousReading !== undefined && (
                        <Card>
                            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <Receipt size={18} />
                                Meter Readings
                            </h3>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 mb-1">Previous</p>
                                    <p className="font-bold text-slate-800">{selectedBill.previousReading.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 mb-1">Current</p>
                                    <p className="font-bold text-slate-800">{selectedBill.currentReading.toLocaleString()}</p>
                                </div>
                                <div className="bg-indigo-50 rounded-lg p-3">
                                    <p className="text-xs text-indigo-600 mb-1">Units</p>
                                    <p className="font-bold text-indigo-700">{selectedBill.unitsConsumed}</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Bill breakdown */}
                    {selectedBill.breakdown && selectedBill.breakdown.length > 0 && (
                        <Card>
                            <h3 className="font-semibold text-slate-700 mb-3">Bill Breakdown</h3>
                            <div className="space-y-2">
                                {selectedBill.breakdown.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-slate-600">{item.item}</span>
                                        <span className="font-medium text-slate-800">₹{item.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between">
                                    <span className="font-semibold text-slate-700">Total Amount</span>
                                    <span className="font-bold text-lg text-indigo-600">₹{selectedBill.amount.toLocaleString()}</span>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Pay button */}
                    <Button onClick={handleProceedToPayment} className="w-full flex items-center justify-center gap-2">
                        Pay ₹{selectedBill.amount.toLocaleString()}
                        <ChevronRight size={20} />
                    </Button>
                </div>
            </div>
        );
    }

    // Main bill list
    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
                <div className="flex items-center gap-3 max-w-md mx-auto">
                    <Link to="/" className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} />
                    </Link>
                    <div className="flex-1">
                        <h1 className="font-bold text-lg text-slate-800">Bills & EMI</h1>
                        <p className="text-xs text-slate-500">Pay your pending dues</p>
                    </div>
                    <button 
                        onClick={handleRefresh} 
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        title="Refresh bills"
                    >
                        <RefreshCw size={20} className="text-slate-600" />
                    </button>
                </div>
            </header>

            <div className="max-w-md mx-auto p-4 space-y-4">
                {/* AI Badge */}
                {isAIGenerated && (
                    <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg px-3 py-2">
                        <Sparkles size={16} className="text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">AI-Generated Bills</span>
                    </div>
                )}

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
                        <div className="space-y-3">
                            {unpaidBills.map((bill) => {
                                const daysLeft = getDaysUntilDue(bill.dueDate);
                                const BillIcon = getBillIcon(bill.type);
                                return (
                                    <button
                                        key={bill.id}
                                        onClick={() => handleSelectBill(bill)}
                                        className="w-full bg-white rounded-xl p-4 border-2 border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-100 group-hover:bg-indigo-100 rounded-xl p-3 transition-colors">
                                                <BillIcon size={24} className="text-slate-600 group-hover:text-indigo-600 transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-800 truncate">{bill.type}</p>
                                                <p className="text-xs text-slate-500 truncate">{bill.provider}</p>
                                                <p className="text-xs text-slate-400 font-mono mt-1">{bill.consumerNumber}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-bold text-slate-800">₹{bill.amount.toLocaleString()}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getUrgencyColor(daysLeft)}`}>
                                                    {daysLeft <= 0 ? 'Overdue!' : daysLeft === 1 ? 'Due Tomorrow' : `${daysLeft} days`}
                                                </span>
                                            </div>
                                            <ChevronRight size={20} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
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
                        <p className="text-sm text-slate-600 mb-4">Great job staying on top of your payments.</p>
                        <Button variant="outline" size="sm" onClick={handleRefresh} className="mx-auto">
                            <RefreshCw size={16} className="mr-2" />
                            Load New Bills
                        </Button>
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
                            {paidBills.map((bill) => {
                                const BillIcon = getBillIcon(bill.type);
                                return (
                                    <div
                                        key={bill.id}
                                        className="bg-green-50 rounded-xl p-4 border border-green-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-100 rounded-xl p-3 opacity-75">
                                                <BillIcon size={24} className="text-green-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-green-800">{bill.type}</p>
                                                <p className="text-xs text-green-600">{bill.provider}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-700">₹{bill.amount.toLocaleString()}</p>
                                                <span className="text-xs text-green-600 flex items-center gap-1 justify-end">
                                                    <CheckCircle size={12} /> Paid
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Quick Link to Loan Center */}
                <Link
                    to="/loan-center"
                    className="block bg-white rounded-xl p-4 border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-colors text-center group"
                >
                    <p className="font-semibold text-indigo-600 group-hover:text-indigo-700">Need a Loan?</p>
                    <p className="text-xs text-slate-600">Learn about EMI with our calculator →</p>
                </Link>
            </div>
        </div>
    );
};

export default EMIPayment;
