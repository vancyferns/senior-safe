import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { ArrowLeft, AlertTriangle, Gift, CheckCircle, User } from 'lucide-react';
import QRScanner from '../components/simulation/QRScanner';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import SuccessScreen from '../components/simulation/SuccessScreen';

const ScanQR = () => {
    const navigate = useNavigate();
    const { addTransaction } = useWallet();

    const [showScanner, setShowScanner] = useState(true);
    const [showFakeWarning, setShowFakeWarning] = useState(false);
    const [showVoucherSuccess, setShowVoucherSuccess] = useState(false);
    const [voucherAmount, setVoucherAmount] = useState(0);
    
    // P2P Payment states
    const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
    const [scannedPayee, setScannedPayee] = useState(null);

    const handleScan = (data) => {
        if (!data) return;

        // Close scanner
        setShowScanner(false);

        // Parse the scanned data
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

            // Check if it's a P2P payment QR (from Receive Money page)
            if (parsed.type === 'SENIORSAFE_PAY' && parsed.userId) {
                setScannedPayee({
                    id: parsed.userId,
                    name: parsed.name,
                    email: parsed.email,
                    picture: parsed.picture,
                    amount: parsed.amount,
                    isUser: true
                });
                setShowPaymentConfirm(true);
                return;
            }
        } catch {
            // Not JSON - could be a URL or fake link
        }

        // Check if it looks like a suspicious link
        if (data.includes('http') || data.includes('www.') || data.includes('.com')) {
            setShowFakeWarning(true);
            return;
        }

        // Unknown QR code
        alert(`Scanned: ${data}\n\nThis doesn't look like a valid payment code.`);
        setShowScanner(true);
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

    return (
        <div className="min-h-screen bg-surface">
            {/* Header - only shown when scanner is closed */}
            {!showScanner && (
                <div className="bg-white border-b border-slate-200 p-4 flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} className="text-slate-700" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800">Scan QR</h1>
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
            {!showScanner && !showFakeWarning && !showVoucherSuccess && !showPaymentConfirm && (
                <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
                    <Button onClick={() => setShowScanner(true)} size="lg">
                        Open Scanner Again
                    </Button>
                </div>
            )}

            {/* P2P Payment Confirmation Modal */}
            <Modal
                isOpen={showPaymentConfirm}
                onClose={() => {
                    setShowPaymentConfirm(false);
                    setScannedPayee(null);
                    navigate('/');
                }}
                title="Payment Request"
                showClose={true}
            >
                <div className="flex flex-col items-center text-center">
                    {/* Payee Profile */}
                    <div className="w-20 h-20 bg-brand-blue rounded-full flex items-center justify-center mb-4 overflow-hidden">
                        {scannedPayee?.picture ? (
                            <img 
                                src={scannedPayee.picture} 
                                alt={scannedPayee.name} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User size={40} className="text-white" />
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-1">
                        {scannedPayee?.name}
                    </h3>
                    <p className="text-slate-500 text-sm mb-4">
                        {scannedPayee?.email}
                    </p>

                    {/* Requested Amount */}
                    {scannedPayee?.amount && (
                        <div className="bg-brand-green/10 rounded-xl p-4 mb-4 w-full">
                            <p className="text-sm text-slate-600">Requested Amount</p>
                            <p className="text-3xl font-bold text-brand-green">
                                ₹{parseInt(scannedPayee.amount).toLocaleString()}
                            </p>
                        </div>
                    )}

                    {!scannedPayee?.amount && (
                        <div className="bg-slate-100 rounded-xl p-4 mb-4 w-full">
                            <p className="text-slate-600 text-sm">
                                Enter amount on next screen
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 w-full mt-2">
                        <Button
                            onClick={() => {
                                setShowPaymentConfirm(false);
                                setScannedPayee(null);
                                navigate('/');
                            }}
                            variant="secondary"
                            fullWidth
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                // Navigate to send money with scanned payee data
                                navigate('/send', { 
                                    state: { 
                                        scannedPayee: scannedPayee 
                                    } 
                                });
                            }}
                            fullWidth
                        >
                            Proceed to Pay
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ScanQR;
