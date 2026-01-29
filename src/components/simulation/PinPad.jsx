import React, { useState } from 'react';
import { Delete } from 'lucide-react';

const PinPad = ({ onComplete, length = 4 }) => {
    const [pin, setPin] = useState("");

    const handlePress = (num) => {
        if (pin.length < length) {
            const newPin = pin + num;
            setPin(newPin);
            // Play sound? (Optional)
            if (newPin.length === length) {
                setTimeout(() => onComplete(newPin), 300); // Small delay for UX
            }
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    return (
        <div className="flex flex-col items-center">
            {/* --- Display Dots --- */}
            <div className="flex gap-4 mb-8">
                {[...Array(length)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-4 h-4 rounded-full border-2 border-slate-400 ${i < pin.length ? 'bg-slate-800 border-slate-800' : 'bg-transparent'
                            }`}
                    />
                ))}
            </div>

            {/* --- Numpad --- */}
            <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handlePress(num)}
                        className="w-16 h-16 rounded-full bg-slate-100 text-slate-900 text-2xl font-bold hover:bg-slate-200 active:bg-brand-blue active:text-white transition-colors flex items-center justify-center shadow-sm"
                    >
                        {num}
                    </button>
                ))}
                {/* Placeholder for alignment */}
                <div />
                <button
                    onClick={() => handlePress(0)}
                    className="w-16 h-16 rounded-full bg-slate-100 text-slate-900 text-2xl font-bold hover:bg-slate-200 active:bg-brand-blue active:text-white transition-colors flex items-center justify-center shadow-sm"
                >
                    0
                </button>
                <button
                    onClick={handleDelete}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                    <Delete size={24} />
                </button>
            </div>
        </div>
    );
};

export default PinPad;
