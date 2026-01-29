import React, { useState } from 'react';
import { ArrowLeft, Calculator, IndianRupee, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';

/**
 * Calculate EMI using standard formula
 * EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
 */
const calculateEMI = (principal, annualRate, tenureMonths) => {
    if (principal <= 0 || tenureMonths <= 0) return 0;
    if (annualRate === 0) return principal / tenureMonths;
    
    const monthlyRate = annualRate / 12 / 100;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) 
                / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi);
};

const LoanCenter = () => {
    const { addTransaction } = useWallet();
    
    const [principal, setPrincipal] = useState('');
    const [tenure, setTenure] = useState('12');
    const [interestRate] = useState(10.5); // Fixed rate for demo
    const [showResult, setShowResult] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [loanApproved, setLoanApproved] = useState(false);

    const principalAmount = parseFloat(principal) || 0;
    const tenureMonths = parseInt(tenure) || 12;
    const emi = calculateEMI(principalAmount, interestRate, tenureMonths);
    const totalPayment = emi * tenureMonths;
    const totalInterest = totalPayment - principalAmount;

    const handleCalculate = () => {
        if (principalAmount >= 1000) {
            setShowResult(true);
        }
    };

    const handleApplyLoan = () => {
        setShowApprovalModal(true);
        // Simulate processing
        setTimeout(() => {
            setLoanApproved(true);
            // Credit the loan amount to wallet
            addTransaction(principalAmount, 'CREDIT', 'Loan Disbursement', 'SeniorSafe Bank');
        }, 2000);
    };

    const tenureOptions = [
        { value: '6', label: '6 Months' },
        { value: '12', label: '1 Year' },
        { value: '24', label: '2 Years' },
        { value: '36', label: '3 Years' },
        { value: '60', label: '5 Years' },
    ];

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
                <div className="flex items-center gap-3 max-w-md mx-auto">
                    <Link to="/" className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="font-bold text-lg text-slate-800">Loan Center</h1>
                        <p className="text-xs text-slate-500">Learn about EMI & Interest</p>
                    </div>
                </div>
            </header>

            <div className="max-w-md mx-auto p-4 space-y-4">
                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                        <Info className="text-blue-500 flex-shrink-0" size={20} />
                        <div>
                            <p className="text-sm text-blue-800 font-semibold">Learning Mode</p>
                            <p className="text-xs text-blue-700 mt-1">
                                This is a simulator to help you understand how loans and EMI work. 
                                No real money is involved!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Loan Calculator */}
                <Card className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Calculator className="text-brand-blue" size={24} />
                        <h2 className="font-bold text-lg text-slate-800">EMI Calculator</h2>
                    </div>

                    {/* Principal Amount */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Loan Amount (₹)
                        </label>
                        <div className="relative">
                            <IndianRupee size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="number"
                                value={principal}
                                onChange={(e) => setPrincipal(e.target.value)}
                                placeholder="Enter amount (min ₹1,000)"
                                className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 rounded-xl focus:border-brand-blue focus:outline-none text-lg"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Range: ₹1,000 - ₹10,00,000
                        </p>
                    </div>

                    {/* Tenure */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Loan Tenure
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {tenureOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setTenure(opt.value)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                        tenure === opt.value
                                            ? 'bg-brand-blue text-white'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Interest Rate (Fixed) */}
                    <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Interest Rate</span>
                            <span className="font-bold text-slate-800">{interestRate}% p.a.</span>
                        </div>
                    </div>

                    {/* Calculate Button */}
                    <Button onClick={handleCalculate} className="w-full" disabled={principalAmount < 1000}>
                        Calculate EMI
                    </Button>
                </Card>

                {/* Result Card */}
                {showResult && principalAmount >= 1000 && (
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 space-y-4">
                        <h3 className="font-bold text-lg text-green-800 flex items-center gap-2">
                            <CheckCircle size={20} />
                            Your EMI Breakdown
                        </h3>

                        {/* EMI Display */}
                        <div className="text-center py-4 bg-white rounded-xl">
                            <p className="text-sm text-slate-600">Monthly EMI</p>
                            <p className="text-4xl font-bold text-green-600">₹{emi.toLocaleString()}</p>
                            <p className="text-xs text-slate-500 mt-1">per month for {tenureMonths} months</p>
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Principal Amount</span>
                                <span className="font-semibold">₹{principalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Total Interest</span>
                                <span className="font-semibold text-orange-600">+ ₹{totalInterest.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-green-200 pt-2 flex justify-between">
                                <span className="font-semibold text-slate-700">Total Payment</span>
                                <span className="font-bold text-lg">₹{totalPayment.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Visual Bar */}
                        <div>
                            <p className="text-xs text-slate-600 mb-1">Payment Breakdown</p>
                            <div className="h-4 rounded-full overflow-hidden flex">
                                <div 
                                    className="bg-green-500 transition-all"
                                    style={{ width: `${(principalAmount / totalPayment) * 100}%` }}
                                />
                                <div 
                                    className="bg-orange-400 transition-all"
                                    style={{ width: `${(totalInterest / totalPayment) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                                <span className="text-green-600">Principal ({Math.round((principalAmount / totalPayment) * 100)}%)</span>
                                <span className="text-orange-600">Interest ({Math.round((totalInterest / totalPayment) * 100)}%)</span>
                            </div>
                        </div>

                        {/* Apply Button (Demo) */}
                        <Button onClick={handleApplyLoan} className="w-full" color="green">
                            Apply for This Loan (Demo)
                        </Button>
                    </Card>
                )}

                {/* Educational Tips */}
                <Card>
                    <h3 className="font-bold text-slate-800 mb-3">💡 Understanding Loans</h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-start gap-2">
                            <Clock size={16} className="text-brand-blue flex-shrink-0 mt-0.5" />
                            <span><strong>EMI</strong> = Equal Monthly Installment. You pay the same amount every month.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <IndianRupee size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                            <span><strong>Principal</strong> = The original amount you borrow.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertCircle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                            <span><strong>Interest</strong> = Extra money the bank charges for lending.</span>
                        </li>
                    </ul>
                </Card>
            </div>

            {/* Approval Modal */}
            {showApprovalModal && (
                <Modal onClose={() => {
                    setShowApprovalModal(false);
                    setLoanApproved(false);
                }}>
                    <div className="text-center py-6">
                        {!loanApproved ? (
                            <>
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <Clock size={32} className="text-brand-blue" />
                                </div>
                                <h3 className="font-bold text-lg text-slate-800">Processing...</h3>
                                <p className="text-sm text-slate-600 mt-2">Checking your eligibility</p>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} className="text-green-500" />
                                </div>
                                <h3 className="font-bold text-lg text-green-700">Loan Approved!</h3>
                                <p className="text-sm text-slate-600 mt-2">
                                    ₹{principalAmount.toLocaleString()} has been added to your wallet.
                                </p>
                                <p className="text-xs text-slate-500 mt-4 bg-slate-100 p-2 rounded-lg">
                                    In real life, approval takes 1-7 days and requires document verification.
                                </p>
                                <Button 
                                    onClick={() => {
                                        setShowApprovalModal(false);
                                        setLoanApproved(false);
                                    }} 
                                    className="mt-4"
                                >
                                    Got It!
                                </Button>
                            </>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default LoanCenter;
