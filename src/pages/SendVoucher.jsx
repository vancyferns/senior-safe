import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { ArrowLeft } from 'lucide-react';
import QRCodeGenerator from '../components/simulation/QRCodeGenerator';
import Button from '../components/ui/Button';

const SendVoucher = () => {
    const navigate = useNavigate();
    const { balance, addTransaction } = useWallet();

    const [amount, setAmount] = useState('');
    const [showQR, setShowQR] = useState(false);

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setAmount(value);
    };

    const handleGenerate = () => {
        const numAmount = parseInt(amount);

        if (!numAmount || numAmount <= 0) {
            return;
        }

        if (numAmount > balance) {
            alert('Insufficient balance!');
            return;
        }

        // Deduct the amount immediately when generating voucher
        addTransaction(numAmount, 'DEBIT', 'Created Cash Voucher', 'Cash Voucher');
        setShowQR(true);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 flex items-center gap-3">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full">
                    <ArrowLeft size={24} className="text-slate-700" />
                </button>
                <h1 className="text-xl font-bold text-slate-900">Create Cash Voucher</h1>
            </div>

            <div className="p-4">
                {!showQR ? (
                    <div className="space-y-6">
                        {/* Explanation Card */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h3 className="font-bold text-blue-800 mb-2">📱 How P2P Works</h3>
                            <p className="text-sm text-blue-700">
                                Create a QR code "cash voucher" that someone else can scan to receive demo money.
                                This works even <strong>offline</strong> - just like handing over real cash!
                            </p>
                        </div>

                        {/* Amount Input */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <label className="block text-sm font-semibold text-slate-600 mb-2">
                                Voucher Amount
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
                                Available: <span className="font-bold text-brand-blue">₹{balance.toLocaleString()}</span>
                            </p>
                        </div>

                        {/* Quick Amounts */}
                        <div className="grid grid-cols-4 gap-2">
                            {[50, 100, 200, 500].map((preset) => (
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
                            onClick={handleGenerate}
                            fullWidth
                            size="lg"
                            disabled={!amount || parseInt(amount) <= 0}
                        >
                            Generate Voucher
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <QRCodeGenerator amount={amount} />

                        <p className="text-sm text-slate-600 mt-6 text-center max-w-xs">
                            Ask the other person to <strong>Scan QR</strong> from their app to receive ₹{amount}.
                        </p>

                        <Button
                            onClick={() => navigate('/')}
                            variant="outline"
                            className="mt-6"
                        >
                            Done
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SendVoucher;
