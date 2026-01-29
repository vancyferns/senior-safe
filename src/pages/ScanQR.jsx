import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { ArrowLeft, AlertTriangle, Gift, CheckCircle, IndianRupee } from 'lucide-react';
import QRScanner from '../components/simulation/QRScanner';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import SuccessScreen from '../components/simulation/SuccessScreen';
import PinPad from '../components/simulation/PinPad';

// Helper function to parse UPI QR code
const parseUPICode = (data) => {
    if (!data.startsWith('upi://pay')) return null;
    
    try {
        const url = new URL(data);
        const params = new URLSearchParams(url.search);
        
        return {
            pa: params.get('pa') || '', // Payment address (UPI ID)
            pn: decodeURIComponent(params.get('pn') || 'Unknown'), // Payee name
            am: params.get('am') || '', // Amount
            cu: params.get('cu') || 'INR', // Currency
            tn: params.get('tn') || '', // Transaction note
        };
    } catch {
        return null;
    }
};

const ScanQR = () => {
    const navigate = useNavigate();
    const { addTransaction, balance } = useWallet();

    const [showScanner, setShowScanner] = useState(true);
    const [showFakeWarning, setShowFakeWarning] = useState(false);
    const [showVoucherSuccess, setShowVoucherSuccess] = useState(false);
    const [voucherAmount, setVoucherAmount] = useState(0);
    
    // UPI Payment states
    const [showUPIPayment, setShowUPIPayment] = useState(false);
    const [upiDetails, setUpiDetails] = useState(null);
    const [upiAmount, setUpiAmount] = useState('');
    const [showPinPad, setShowPinPad] = useState(false);
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

    const handleScan = (data) => {
        if (!data) return;

        // Close scanner
        setShowScanner(false);

        // 1. Check if it's a UPI QR code
        const upiData = parseUPICode(data);
        if (upiData) {
            setUpiDetails(upiData);
            setUpiAmount(upiData.am || '');
            setShowUPIPayment(true);
            return;
        }

        // 2. Parse the scanned data as JSON (SeniorSafe voucher)
        try {
            const parsed = JSON.parse(data);

            // Check if it's a valid SeniorSafe voucher
            if (parsed.type === 'SENIORSAFE_CASH' && parsed.amt) {
                // Valid voucher - add money!
                const amount = parseInt(parsed.amt);
                addTransaction(amount, 'CREDIT', 'Received Cash Voucher', 'QR Voucher');
                setVoucherAmount(amount);
                setShowVoucherSuccess(true);
                return;
            }
        } catch {
            // Not JSON - could be a URL or fake link
        }

        // 3. Check if it looks like a suspicious link
        if (data.includes('http') || data.includes('www.') || data.includes('.com')) {
            setShowFakeWarning(true);
            return;
        }

        // Unknown QR code
        alert(`Scanned: ${data}\n\nThis doesn't look like a valid payment code.`);
        setShowScanner(true);
    };

    const handleUPIPayment = () => {
        const amount = parseInt(upiAmount);
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        if (amount > balance) {
            alert('Insufficient balance! This is demo money, but we still check 😊');
            return;
        }
        setShowPinPad(true);
    };

    const handlePinComplete = () => {
        const amount = parseInt(upiAmount);
        addTransaction(amount, 'DEBIT', `Paid to ${upiDetails.pn}`, upiDetails.pn);
        setShowPinPad(false);
        setShowUPIPayment(false);
        setShowPaymentSuccess(true);
    };

    const handleCloseScanner = () => {
        navigate('/');
    };

    // Show success screen for voucher
    if (showVoucherSuccess) {
        return (
            <SuccessScreen
                amount={voucherAmount}
                recipientName="Cash Voucher Received"
                onDone={() => navigate('/')}
            />
        );
    }

    // Show success screen for UPI payment
    if (showPaymentSuccess) {
        return (
            <SuccessScreen
                amount={parseInt(upiAmount)}
                recipientName={upiDetails?.pn || 'Merchant'}
                onDone={() => navigate('/')}
            />
        );
    }

    // Show PIN pad for UPI payment
    if (showPinPad) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <div className="bg-white border-b border-slate-200 p-4 flex items-center gap-3">
                    <button onClick={() => setShowPinPad(false)} className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} className="text-slate-700" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">Enter PIN</h1>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <p className="text-slate-600 mb-2">Paying <strong>{upiDetails?.pn}</strong></p>
                    <p className="text-3xl font-bold text-blue-800 mb-6">₹{parseInt(upiAmount).toLocaleString()}</p>
                    <PinPad onComplete={handlePinComplete} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header - only shown when scanner is closed */}
            {!showScanner && (
                <div className="bg-white border-b border-slate-200 p-4 flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} className="text-slate-700" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">Scan QR</h1>
                </div>
            )}

            {/* Scanner Modal */}
            {showScanner && (
                <QRScanner
                    onScan={handleScan}
                    onClose={handleCloseScanner}
                />
            )}

            {/* Fake Link / Scam Warning Modal */}
            <Modal
                isOpen={showFakeWarning}
                onClose={() => {
                    setShowFakeWarning(false);
                    navigate('/');
                }}
                title="⚠️ Warning!"
                showClose={false}
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <AlertTriangle size={40} className="text-red-500" />
                    </div>

                    <h3 className="text-xl font-bold text-red-600 mb-2">
                        Oops! Fake QR Code Detected!
                    </h3>

                    <p className="text-slate-600 mb-4">
                        This QR code leads to a <strong>suspicious website</strong>.
                        In real life, scanning this could steal your money!
                    </p>

                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 w-full">
                        <p className="text-sm text-red-700">
                            <strong>🚨 Real-World Tip:</strong> Scammers put fake QR codes in public places.
                            Always verify the source before scanning!
                        </p>
                    </div>

                    <Button
                        onClick={() => {
                            setShowFakeWarning(false);
                            navigate('/');
                        }}
                        variant="danger"
                        fullWidth
                        size="lg"
                    >
                        I Understand
                    </Button>
                </div>
            </Modal>

            {/* Content when scanner is dismissed but not on warning */}
            {!showScanner && !showFakeWarning && !showVoucherSuccess && !showUPIPayment && (
                <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
                    <Button onClick={() => setShowScanner(true)} size="lg">
                        Open Scanner Again
                    </Button>
                </div>
            )}

            {/* UPI Payment Modal */}
            <Modal
                isOpen={showUPIPayment}
                onClose={() => {
                    setShowUPIPayment(false);
                    navigate('/');
                }}
                title="💳 UPI Payment"
            >
                <div className="space-y-4">
                    {/* Payee Info */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-brand-blue to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-lg">
                            {upiDetails?.pn?.charAt(0)?.toUpperCase() || 'M'}
                        </div>
                        <p className="font-bold text-lg text-slate-800">{upiDetails?.pn}</p>
                        <p className="text-sm text-slate-500 break-all">{upiDetails?.pa}</p>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-slate-400">₹</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={upiAmount}
                                onChange={(e) => setUpiAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="0"
                                className="w-full p-4 pl-10 text-3xl font-bold text-center border-2 border-slate-200 rounded-xl focus:border-brand-blue outline-none"
                                readOnly={!!upiDetails?.am} // If amount is preset, make readonly
                            />
                        </div>
                        {upiDetails?.am && (
                            <p className="text-xs text-slate-500 text-center mt-1">Amount fixed by merchant</p>
                        )}
                    </div>

                    {/* Pay Button */}
                    <Button 
                        onClick={handleUPIPayment} 
                        fullWidth 
                        size="lg"
                        disabled={!upiAmount || parseInt(upiAmount) <= 0}
                    >
                        Pay ₹{upiAmount ? parseInt(upiAmount).toLocaleString() : '0'}
                    </Button>

                    <p className="text-xs text-center text-slate-400">
                        🔒 This is a demo payment - no real money involved
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default ScanQR;
