import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, AlertTriangle, CheckCircle, Shield, Flag, Volume2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SCAM_SCENARIOS, getRandomScenarios } from '../data/scamScenarios';
import { useAchievements } from '../context/AchievementContext';
import { useSpeech } from '../hooks/useSpeech';
import ScamGuideModal from '../components/ScamGuideModal';
import ScamDetector from '../components/ScamDetector';
import Confetti from 'react-confetti';

const ScamLab = () => {
    const { addXP, incrementStat } = useAchievements();
    const { speak, isSupported } = useSpeech();
    
    const [scenarios] = useState(() => getRandomScenarios(6));
    const [completedScenarios, setCompletedScenarios] = useState([]);
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [showDetector, setShowDetector] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [stats, setStats] = useState({ correct: 0, incorrect: 0, xp: 0 });

    const handleScenarioClick = (scenario) => {
        setSelectedScenario(scenario);
    };

    const handleAction = (action) => {
        if (!selectedScenario) return;
        
        const isCorrectAction = 
            (action === 'report' && selectedScenario.isScam) ||
            (action === 'safe' && !selectedScenario.isScam);

        if (isCorrectAction) {
            // Correct! Award XP
            setStats(prev => ({
                ...prev,
                correct: prev.correct + 1,
                xp: prev.xp + selectedScenario.xpReward
            }));
            
            // Add XP through achievement system (no money)
            addXP(selectedScenario.xpReward);
            
            // Track scam identification for achievements
            if (selectedScenario.isScam) {
                incrementStat('scamsIdentified');
            }
            
            // Show confetti
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
            
            // Speak success
            if (isSupported) {
                speak("Correct! You identified it correctly. Well done!");
            }
        } else {
            // Wrong - show educational modal
            setStats(prev => ({
                ...prev,
                incorrect: prev.incorrect + 1
            }));
            
            if (selectedScenario.isScam) {
                // Clicked on scam as safe - dangerous!
                setShowGuideModal(true);
            } else {
                // Marked legitimate as scam
                if (isSupported) {
                    speak("This was actually a legitimate message. Not all messages are scams!");
                }
            }
        }

        // Mark as completed
        setCompletedScenarios(prev => [...prev, selectedScenario.id]);
        setSelectedScenario(null);
    };

    const handleCloseGuide = () => {
        setShowGuideModal(false);
    };

    const isCompleted = (id) => completedScenarios.includes(id);

    return (
        <div className="min-h-screen bg-slate-100">
            {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
            
            {/* Header */}
            <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
                <div className="flex items-center gap-3 max-w-md mx-auto">
                    <Link to="/" className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="font-bold text-lg text-slate-800">Scam Lab</h1>
                        <p className="text-xs text-slate-500">Learn to spot fraud</p>
                    </div>
                </div>
            </header>

            <div className="max-w-md mx-auto p-4 space-y-4">
                {/* Stats Card */}
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Training Progress</p>
                            <p className="text-2xl font-bold">{stats.xp} XP</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm">
                                <span className="text-green-300">{stats.correct} ✓</span>
                                {' / '}
                                <span className="text-red-300">{stats.incorrect} ✗</span>
                            </p>
                            <p className="text-xs text-purple-200">Correct / Incorrect</p>
                        </div>
                    </div>
                </div>

                {/* AI Detector Button */}
                <button
                    onClick={() => setShowDetector(true)}
                    className="w-full bg-brand-blue text-white rounded-xl p-4 flex items-center gap-3 hover:bg-blue-600 transition-colors"
                >
                    <Search size={24} />
                    <div className="text-left">
                        <p className="font-bold">AI Scam Detector</p>
                        <p className="text-xs text-blue-100">Paste any message to check if it's a scam</p>
                    </div>
                </button>

                {/* Instructions */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="text-amber-600 flex-shrink-0" size={18} />
                        <p className="text-sm text-amber-800">
                            <strong>Practice Mode:</strong> Tap on messages below to review them, 
                            then decide if they are SCAM or SAFE.
                        </p>
                    </div>
                </div>

                {/* Messages List */}
                <div className="space-y-2">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare size={18} />
                        Inbox ({scenarios.length} messages)
                    </h2>
                    
                    {scenarios.map((scenario) => (
                        <button
                            key={scenario.id}
                            onClick={() => handleScenarioClick(scenario)}
                            disabled={isCompleted(scenario.id)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                isCompleted(scenario.id)
                                    ? 'bg-slate-50 border-slate-200 opacity-60'
                                    : selectedScenario?.id === scenario.id
                                        ? 'bg-blue-50 border-brand-blue'
                                        : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    isCompleted(scenario.id)
                                        ? scenario.isScam ? 'bg-red-100' : 'bg-green-100'
                                        : 'bg-slate-100'
                                }`}>
                                    {isCompleted(scenario.id) ? (
                                        scenario.isScam 
                                            ? <AlertTriangle size={18} className="text-red-500" />
                                            : <CheckCircle size={18} className="text-green-500" />
                                    ) : (
                                        <MessageSquare size={18} className="text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-slate-800 text-sm truncate">
                                            {scenario.senderName}
                                        </p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            scenario.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                            scenario.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {scenario.difficulty}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">{scenario.sender}</p>
                                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                        {scenario.message}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Action Buttons (when scenario selected) */}
                {selectedScenario && !isCompleted(selectedScenario.id) && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
                        <div className="max-w-md mx-auto">
                            <p className="text-center text-sm text-slate-600 mb-3">
                                Is this message a <strong>SCAM</strong> or <strong>SAFE</strong>?
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleAction('report')}
                                    className="bg-red-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
                                >
                                    <Flag size={20} />
                                    SCAM
                                </button>
                                <button
                                    onClick={() => handleAction('safe')}
                                    className="bg-green-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                                >
                                    <Shield size={20} />
                                    SAFE
                                </button>
                            </div>
                            {isSupported && (
                                <button
                                    onClick={() => speak(selectedScenario.message)}
                                    className="w-full mt-2 text-center text-brand-blue text-sm flex items-center justify-center gap-1"
                                >
                                    <Volume2 size={14} />
                                    Read message aloud
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showGuideModal && selectedScenario && (
                <ScamGuideModal
                    scamType={selectedScenario.type}
                    redFlags={selectedScenario.redFlags}
                    onClose={handleCloseGuide}
                    onUnderstood={handleCloseGuide}
                />
            )}

            {showDetector && (
                <ScamDetector onClose={() => setShowDetector(false)} />
            )}
        </div>
    );
};

export default ScamLab;
