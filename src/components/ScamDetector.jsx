import React, { useState } from 'react';
import { AlertTriangle, Shield, ShieldCheck, ShieldX, X, Volume2 } from 'lucide-react';
import { analyzeMessage } from '../services/scamAnalyzer';
import { useSpeech } from '../hooks/useSpeech';
import Button from './ui/Button';

const ScamDetector = ({ onClose }) => {
    const [inputText, setInputText] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const { speak, isSupported } = useSpeech();

    const handleAnalyze = async () => {
        if (!inputText.trim()) return;
        
        setLoading(true);
        try {
            // Try to get API key from localStorage (user can set it in settings)
            const apiKey = localStorage.getItem('gemini_api_key');
            const analysis = await analyzeMessage(inputText, apiKey);
            setResult(analysis);
            
            // Speak the result for accessibility
            if (isSupported) {
                const spokenResult = analysis.isScam 
                    ? `Warning! This is likely a scam. ${analysis.explanation}`
                    : `This message appears to be safe. ${analysis.explanation}`;
                speak(spokenResult);
            }
        } catch (error) {
            console.error('Analysis error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
            case 'MEDIUM': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const getRiskIcon = (level) => {
        switch (level) {
            case 'HIGH': return <ShieldX size={32} className="text-red-500" />;
            case 'MEDIUM': return <Shield size={32} className="text-orange-500" />;
            case 'LOW': return <ShieldCheck size={32} className="text-green-500" />;
            default: return <Shield size={32} />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="text-brand-blue" size={24} />
                        <h2 className="font-bold text-lg text-slate-800">Scam Detector</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <p className="text-sm text-blue-800">
                            <strong>How to use:</strong> Copy any suspicious SMS or message and paste it below. 
                            Our AI will check if it's a scam.
                        </p>
                    </div>

                    {/* Input Area */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Paste Suspicious Message:
                        </label>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste the message here..."
                            className="w-full h-32 p-3 border-2 border-slate-300 rounded-xl focus:border-brand-blue focus:outline-none text-base resize-none"
                        />
                    </div>

                    {/* Analyze Button */}
                    <Button
                        onClick={handleAnalyze}
                        disabled={!inputText.trim() || loading}
                        className="w-full"
                    >
                        {loading ? 'Analyzing...' : '🔍 Check Message'}
                    </Button>

                    {/* Results */}
                    {result && (
                        <div className={`border-2 rounded-xl p-4 ${getRiskColor(result.riskLevel)}`}>
                            <div className="flex items-start gap-3">
                                {getRiskIcon(result.riskLevel)}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-lg">
                                            {result.riskLevel} RISK
                                        </h3>
                                        {isSupported && (
                                            <button
                                                onClick={() => speak(result.explanation)}
                                                className="p-2 hover:bg-white/50 rounded-full"
                                                title="Listen"
                                            >
                                                <Volume2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm mt-1">{result.explanation}</p>
                                    
                                    {/* Risk Score Bar */}
                                    <div className="mt-3">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>Risk Score</span>
                                            <span>{result.riskScore}%</span>
                                        </div>
                                        <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all ${
                                                    result.riskScore >= 70 ? 'bg-red-500' :
                                                    result.riskScore >= 40 ? 'bg-orange-500' : 'bg-green-500'
                                                }`}
                                                style={{ width: `${result.riskScore}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Matched Keywords */}
                                    {result.matchedKeywords?.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs font-semibold mb-1">Red Flags Found:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {result.matchedKeywords.map((keyword, i) => (
                                                    <span key={i} className="text-xs bg-white/70 px-2 py-0.5 rounded-full">
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Badge */}
                    {result && (
                        <p className="text-xs text-center text-slate-400">
                            Analysis by: {result.method === 'ai' ? 'Gemini AI' : 'Smart Keyword Detection'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScamDetector;
