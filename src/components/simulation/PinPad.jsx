import React, { useState, useEffect } from 'react';
import { Delete, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';

const PinPad = ({ onComplete, length = 4, error = null, onClear }) => {
    const [pin, setPin] = useState("");
    const [shake, setShake] = useState(false);

    // Reset PIN when error changes or component remounts
    useEffect(() => {
        if (error) {
            setShake(true);
            setTimeout(() => {
                setShake(false);
                setPin("");
            }, 500);
        }
    }, [error]);

    // Clear PIN when onClear is called
    useEffect(() => {
        if (onClear) {
            setPin("");
        }
    }, [onClear]);

    const handlePress = (num) => {
        if (pin.length < length) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === length) {
                setTimeout(() => {
                    onComplete(newPin);
                    // Don't reset here - let parent handle it
                }, 300);
            }
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    return (
        <div className="flex flex-col items-center">
            {/* --- Error Message --- */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4 flex items-center gap-2 text-red-700">
                    <AlertCircle size={16} />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* --- Display Dots --- */}
            <div className={`flex gap-4 mb-8 ${shake ? 'animate-shake' : ''}`}>
                {[...Array(length)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                            i < pin.length 
                                ? error 
                                    ? 'bg-red-500 border-red-500' 
                                    : 'bg-slate-800 border-slate-800' 
                                : 'bg-transparent border-slate-400'
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
                        className="w-16 h-16 rounded-full bg-slate-100 text-slate-900 text-2xl font-bold hover:bg-slate-200 active:bg-blue-800 active:text-white transition-colors flex items-center justify-center shadow-sm"
                    >
                        {num}
                    </button>
                ))}
                {/* Placeholder for alignment */}
                <div />
                <button
                    onClick={() => handlePress(0)}
                    className="w-16 h-16 rounded-full bg-slate-100 text-slate-900 text-2xl font-bold hover:bg-slate-200 active:bg-blue-800 active:text-white transition-colors flex items-center justify-center shadow-sm"
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

PinPad.propTypes = {
    onComplete: PropTypes.func.isRequired,
    length: PropTypes.number,
    error: PropTypes.string,
    onClear: PropTypes.any
};

export default PinPad;
