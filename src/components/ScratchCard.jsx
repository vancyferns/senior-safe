import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, X, Coins } from 'lucide-react';
import Confetti from 'react-confetti';

const ScratchCard = ({ reward, onClose, onClaim }) => {
    const [isScratched, setIsScratched] = useState(false);
    const [scratchProgress, setScratchProgress] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    const handleScratch = (e) => {
        if (isRevealed) return;
        
        // Simulate scratching with multiple touches/moves
        setScratchProgress(prev => {
            const newProgress = Math.min(prev + 15, 100);
            if (newProgress >= 100 && !isRevealed) {
                setIsRevealed(true);
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
            }
            return newProgress;
        });
        setIsScratched(true);
    };

    const handleQuickReveal = () => {
        setScratchProgress(100);
        setIsRevealed(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
    };

    const handleClaim = () => {
        onClaim(reward);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
            
            <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl animate-bounce-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white text-center relative">
                    <button 
                        onClick={onClose}
                        className="absolute right-3 top-3 p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <Gift size={40} className="mx-auto mb-2" />
                    <h2 className="text-xl font-bold">🎉 Streak Reward!</h2>
                    <p className="text-amber-100 text-sm">You've earned a scratch card!</p>
                </div>

                {/* Scratch Area */}
                <div className="p-6">
                    <div 
                        className="relative w-full h-40 rounded-2xl overflow-hidden cursor-pointer select-none"
                        onMouseMove={handleScratch}
                        onTouchMove={handleScratch}
                        onClick={() => !isScratched && handleQuickReveal()}
                    >
                        {/* Revealed content underneath */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-600 flex flex-col items-center justify-center">
                            <Sparkles size={32} className="text-yellow-300 mb-2" />
                            <p className="text-white text-sm font-medium mb-1">You Won!</p>
                            <div className="flex items-center gap-2">
                                {reward.type === 'xp' ? (
                                    <>
                                        <Sparkles size={28} className="text-yellow-300" />
                                        <span className="text-4xl font-bold text-white">+{reward.amount} XP</span>
                                    </>
                                ) : (
                                    <>
                                        <Coins size={28} className="text-yellow-300" />
                                        <span className="text-4xl font-bold text-white">₹{reward.amount}</span>
                                    </>
                                )}
                            </div>
                            <p className="text-emerald-100 text-sm mt-2">{reward.message}</p>
                        </div>

                        {/* Scratch overlay */}
                        {!isRevealed && (
                            <div 
                                className="absolute inset-0 bg-gradient-to-br from-slate-400 to-slate-600 flex flex-col items-center justify-center transition-opacity duration-300"
                                style={{ opacity: 1 - (scratchProgress / 100) }}
                            >
                                <div className="text-center">
                                    <div className="text-6xl mb-2">🎁</div>
                                    <p className="text-white font-bold text-lg">Scratch to reveal!</p>
                                    <p className="text-slate-200 text-sm">Swipe or tap here</p>
                                </div>
                                
                                {/* Progress indicator */}
                                {scratchProgress > 0 && scratchProgress < 100 && (
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-amber-400 transition-all duration-200"
                                                style={{ width: `${scratchProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Claim button */}
                    {isRevealed && (
                        <button
                            onClick={handleClaim}
                            className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-4 rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            🎉 Claim Reward!
                        </button>
                    )}

                    {!isRevealed && (
                        <p className="text-center text-slate-500 text-sm mt-4">
                            Tap or swipe on the card to reveal your reward
                        </p>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes bounce-in {
                    0% { transform: scale(0.5); opacity: 0; }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-bounce-in {
                    animation: bounce-in 0.4s ease-out;
                }
            `}</style>
        </div>
    );
};

export default ScratchCard;
