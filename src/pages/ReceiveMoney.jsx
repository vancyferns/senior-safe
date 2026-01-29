import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, QrCode, Copy, Check, IndianRupee, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const ReceiveMoney = () => {
    const navigate = useNavigate();
    const { user, dbUser } = useAuth();
    
    const [amount, setAmount] = useState('');
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);

    // Generate QR data payload
    const generateQRData = () => {
        return JSON.stringify({
            type: 'SENIORSAFE_PAY',
            userId: dbUser?.id,
            name: user?.name || 'Unknown',
            email: user?.email,
            picture: user?.picture,
            amount: amount ? parseInt(amount) : null,
            timestamp: Date.now()
        });
    };

    const handleGenerateQR = () => {
        setShowQR(true);
    };

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setAmount(value);
    };

    const handleCopyDetails = async () => {
        const details = `Pay ${user?.name}\nAmount: ${amount ? `₹${amount}` : 'Any amount'}\nSeniorSafe App`;
        try {
            await navigator.clipboard.writeText(details);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Pay via SeniorSafe',
            text: `Pay ${user?.name}${amount ? ` ₹${amount}` : ''} on SeniorSafe App`,
        };
        
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                handleCopyDetails();
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    const handleResetQR = () => {
        setShowQR(false);
        setAmount('');
    };

    return (
        <div className="min-h-screen bg-surface">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 flex items-center gap-3 sticky top-0 z-10">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full">
                    <ArrowLeft size={24} className="text-slate-700" />
                </button>
                <h1 className="text-xl font-bold text-slate-800">Receive Money</h1>
            </div>

            <div className="p-4">
                {!showQR ? (
                    /* Amount Input Screen */
                    <div className="space-y-6">
                        {/* User Info Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-brand-blue flex items-center justify-center">
                                {user?.picture ? (
                                    <img 
                                        src={user.picture} 
                                        alt={user.name} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl font-bold text-white">
                                        {user?.name?.charAt(0) || '?'}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">{user?.name || 'User'}</h2>
                            <p className="text-slate-500 text-sm">{user?.email}</p>
                        </div>

                        {/* Amount Input */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                            <label className="block text-slate-600 text-sm font-medium mb-2">
                                Enter Amount (Optional)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-slate-400">₹</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    className="w-full text-3xl font-bold py-4 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-center"
                                />
                            </div>
                            <p className="text-slate-500 text-xs mt-2 text-center">
                                Leave empty to accept any amount
                            </p>
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="grid grid-cols-4 gap-2">
                            {[100, 200, 500, 1000].map((quickAmount) => (
                                <button
                                    key={quickAmount}
                                    onClick={() => setAmount(quickAmount.toString())}
                                    className={`py-3 rounded-xl font-semibold transition-all ${
                                        amount === quickAmount.toString()
                                            ? 'bg-brand-blue text-white'
                                            : 'bg-white border border-slate-200 text-slate-700 hover:border-brand-blue'
                                    }`}
                                >
                                    ₹{quickAmount}
                                </button>
                            ))}
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerateQR}
                            className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:bg-blue-600 transition-colors active:scale-98"
                        >
                            <QrCode size={24} />
                            Generate QR Code
                        </button>
                    </div>
                ) : (
                    /* QR Display Screen */
                    <div className="space-y-6">
                        {/* QR Code Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                            <div className="text-center mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Scan to Pay</h2>
                                <p className="text-slate-500 text-sm">{user?.name}</p>
                            </div>

                            {/* QR Code */}
                            <div className="flex justify-center mb-4">
                                <div className="p-4 bg-white border-4 border-slate-900 rounded-2xl">
                                    <QRCodeSVG 
                                        value={generateQRData()} 
                                        size={200} 
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>
                            </div>

                            {/* Amount Display */}
                            {amount && (
                                <div className="bg-brand-green/10 rounded-xl p-4 text-center mb-4">
                                    <p className="text-sm text-brand-green font-medium">Requested Amount</p>
                                    <p className="text-3xl font-bold text-brand-green">₹{parseInt(amount).toLocaleString()}</p>
                                </div>
                            )}

                            {!amount && (
                                <div className="bg-slate-100 rounded-xl p-4 text-center mb-4">
                                    <p className="text-slate-600 text-sm">Accepting any amount</p>
                                </div>
                            )}

                            {/* Profile Picture in QR */}
                            <div className="flex items-center justify-center gap-3 py-3 border-t border-slate-100">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-blue flex items-center justify-center">
                                    {user?.picture ? (
                                        <img 
                                            src={user.picture} 
                                            alt={user.name} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-lg font-bold text-white">
                                            {user?.name?.charAt(0) || '?'}
                                        </span>
                                    )}
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-slate-800">{user?.name}</p>
                                    <p className="text-xs text-slate-500">{user?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleCopyDetails}
                                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                            >
                                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                {copied ? 'Copied!' : 'Copy Details'}
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                            >
                                <Share2 size={20} />
                                Share
                            </button>
                        </div>

                        {/* Change Amount */}
                        <button
                            onClick={handleResetQR}
                            className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                        >
                            Change Amount
                        </button>

                        {/* Help Text */}
                        <div className="bg-blue-50 rounded-xl p-4">
                            <p className="text-blue-800 text-sm text-center">
                                <strong>Tip:</strong> Ask the sender to scan this QR code using the "Scan QR" option in their SeniorSafe app.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReceiveMoney;
