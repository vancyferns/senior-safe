import React, { useEffect, useState } from 'react';
import { CheckCircle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import Button from '../ui/Button';

const SuccessScreen = ({ amount, recipientName, recipient, message, onDone, onClose }) => {
    const navigate = useNavigate();
    const [showConfetti, setShowConfetti] = useState(true);
    
    const displayName = recipientName || recipient;
    const handleDone = onDone || onClose;

    useEffect(() => {
        // Stop confetti after 3 seconds
        const timer = setTimeout(() => setShowConfetti(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleGoHome = () => {
        if (handleDone) {
            handleDone();
        } else {
            navigate('/');
        }
    };

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
            {showConfetti && (
                <Confetti
                    width={window.innerWidth}
                    height={window.innerHeight}
                    recycle={false}
                    numberOfPieces={200}
                    colors={['#3B82F6', '#10B981', '#F59E0B', '#EC4899']}
                />
            )}

            {/* Success Icon */}
            <div className="relative mb-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-[bounce_0.5s_ease-out]">
                    <CheckCircle size={64} className="text-brand-green" strokeWidth={2.5} />
                </div>
            </div>

            {/* Message */}
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
                {message || 'Payment Successful!'}
            </h1>
            <p className="text-slate-600 text-center mb-6">
                You sent <span className="font-bold text-brand-blue">₹{amount?.toLocaleString()}</span>
                {displayName && (
                    <> to <span className="font-bold">{displayName}</span></>
                )}
            </p>

            {/* Transaction Detail Card */}
            <div className="w-full max-w-xs bg-slate-50 rounded-xl p-4 border border-slate-200 mb-8">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Amount</span>
                    <span className="font-bold text-slate-800">₹{amount?.toLocaleString()}</span>
                </div>
                {displayName && (
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500">Sent To</span>
                        <span className="font-bold text-slate-800">{displayName}</span>
                    </div>
                )}
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Status</span>
                    <span className="font-bold text-brand-green">Complete</span>
                </div>
            </div>

            {/* Educational Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 max-w-xs text-center">
                <p className="text-sm text-blue-800">
                    🎉 <strong>Great job!</strong> You've successfully completed a simulated payment.
                    This is exactly how real apps work!
                </p>
            </div>

            {/* Actions */}
            <Button onClick={handleGoHome} size="lg" fullWidth className="max-w-xs">
                <Home size={20} className="mr-2 inline" />
                Back to Home
            </Button>
        </div>
    );
};

export default SuccessScreen;
