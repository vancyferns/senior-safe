import React from 'react';
import { X, AlertTriangle, Shield, Lightbulb, Volume2 } from 'lucide-react';
import { getScamEducation } from '../services/scamAnalyzer';
import { useSpeech } from '../hooks/useSpeech';
import Button from './ui/Button';

const ScamGuideModal = ({ scamType, redFlags = [], onClose, onUnderstood }) => {
    const { speak, isSupported } = useSpeech();
    const education = getScamEducation(scamType);

    const handleSpeak = () => {
        const text = `${education.title}. ${education.description}. Remember: ${education.tips.join('. ')}`;
        speak(text);
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-pulse-once">
                {/* Warning Header */}
                <div className="bg-red-500 p-6 text-white text-center">
                    <AlertTriangle size={48} className="mx-auto mb-2" />
                    <h2 className="text-2xl font-bold">Scam Alert!</h2>
                    <p className="text-red-100 text-sm mt-1">This was a training exercise</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* What You Clicked */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="text-red-500" size={20} />
                            <h3 className="font-bold text-red-800">{education.title}</h3>
                            {isSupported && (
                                <button
                                    onClick={handleSpeak}
                                    className="ml-auto p-1 hover:bg-red-100 rounded-full"
                                    title="Listen to explanation"
                                >
                                    <Volume2 size={18} className="text-red-500" />
                                </button>
                            )}
                        </div>
                        <p className="text-red-700 text-sm">{education.description}</p>
                    </div>

                    {/* Red Flags */}
                    {redFlags.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-orange-500" />
                                Red Flags in This Message:
                            </h4>
                            <ul className="space-y-1">
                                {redFlags.map((flag, i) => (
                                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                        <span className="text-red-500 font-bold">•</span>
                                        {flag}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Tips */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                            <Lightbulb size={16} />
                            How to Stay Safe:
                        </h4>
                        <ul className="space-y-2">
                            {education.tips.map((tip, i) => (
                                <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                                    <span className="text-green-500 font-bold">✓</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Real World Impact */}
                    <div className="bg-slate-100 rounded-xl p-4 text-center">
                        <p className="text-sm text-slate-600">
                            <strong>In real life:</strong> Clicking this would have led to a fake website 
                            that steals your personal information or money.
                        </p>
                    </div>

                    {/* Action Button */}
                    <Button onClick={onUnderstood || onClose} className="w-full" color="green">
                        ✓ I Understand - Continue Learning
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ScamGuideModal;
