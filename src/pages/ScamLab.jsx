import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, AlertTriangle, CheckCircle, Shield, Flag, Volume2, Search, RefreshCw, Sparkles, Loader2, Trophy, Zap, Target, ChevronRight, Mail, Phone, Globe, Cloud, CloudOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchDynamicScenarios, getRandomScenarios } from '../data/scamScenarios';
import { useAchievements } from '../context/AchievementContext';
import { useLanguage } from '../context/LanguageContext';
import { useSpeech } from '../hooks/useSpeech';
import { translateArray } from '../services/translateService';
import ScamGuideModal from '../components/ScamGuideModal';
import ScamDetector from '../components/ScamDetector';
import Confetti from 'react-confetti';

const ScamLab = () => {
    // Get lifetime stats from AchievementContext (synced to database)
    const { addXP, incrementStat, stats: globalStats, isSyncing } = useAchievements();
    const { currentLanguage } = useLanguage();
    const { speak, isSupported } = useSpeech();

    const [scenarios, setScenarios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAIGenerated, setIsAIGenerated] = useState(false);
    const [completedScenarios, setCompletedScenarios] = useState([]);
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [showDetector, setShowDetector] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    // Session stats (for current round only)
    const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0, xpEarned: 0 });
    const [showResult, setShowResult] = useState(null); // 'correct' or 'incorrect'

    // Load scenarios on mount
    useEffect(() => {
        loadScenarios();
    }, []);

    const loadScenarios = async () => {
        setIsLoading(true);
        try {
            // Pass current language to generate scenarios in the correct language
            const result = await fetchDynamicScenarios(6, 'mixed', currentLanguage);
            let loadedScenarios = result.scenarios;

            // POST-TRANSLATION: If English is selected, translate any Hinglish to pure English
            if (currentLanguage === 'en' && result.isAIGenerated) {
                loadedScenarios = await translateArray(
                    loadedScenarios,
                    ['message'],
                    'en',
                    'hi'
                );
            }

            setScenarios(loadedScenarios);
            setIsAIGenerated(result.isAIGenerated);
        } catch (error) {
            console.error('Failed to load scenarios:', error);
            setScenarios(getRandomScenarios(6));
            setIsAIGenerated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setCompletedScenarios([]);
        setSelectedScenario(null);
        setSessionStats({ correct: 0, incorrect: 0, xpEarned: 0 });
        await loadScenarios();
    };

    const handleScenarioClick = (scenario) => {
        if (!isCompleted(scenario.id)) {
            setSelectedScenario(scenario);
        }
    };

    const handleAction = (action) => {
        if (!selectedScenario) return;

        const isCorrectAction =
            (action === 'report' && selectedScenario.isScam) ||
            (action === 'safe' && !selectedScenario.isScam);

        if (isCorrectAction) {
            // Update session stats (local tracking for this round)
            setSessionStats(prev => ({
                ...prev,
                correct: prev.correct + 1,
                xpEarned: prev.xpEarned + selectedScenario.xpReward
            }));

            // Update global stats (synced to database via AchievementContext)
            addXP(selectedScenario.xpReward);

            if (selectedScenario.isScam) {
                incrementStat('scamsIdentified');
            }

            setShowConfetti(true);
            setShowResult('correct');
            setTimeout(() => {
                setShowConfetti(false);
                setShowResult(null);
            }, 2500);

            if (isSupported) {
                speak("Correct! You identified it correctly. Well done!");
            }
        } else {
            // Update session stats for incorrect answer
            setSessionStats(prev => ({
                ...prev,
                incorrect: prev.incorrect + 1
            }));

            setShowResult('incorrect');
            setTimeout(() => setShowResult(null), 2000);

            if (selectedScenario.isScam) {
                setShowGuideModal(true);
            } else {
                if (isSupported) {
                    speak("This was actually a legitimate message. Not all messages are scams!");
                }
            }
        }

        setCompletedScenarios(prev => [...prev, selectedScenario.id]);
        setSelectedScenario(null);
    };

    const handleCloseGuide = () => {
        setShowGuideModal(false);
    };

    const isCompleted = (id) => completedScenarios.includes(id);

    const completedCount = completedScenarios.length;
    const totalCount = scenarios.length;
    const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    const getTypeIcon = (type) => {
        switch (type) {
            case 'sms': return <Phone size={14} />;
            case 'email': return <Mail size={14} />;
            case 'website': return <Globe size={14} />;
            default: return <MessageSquare size={14} />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
            {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}

            {/* Result Overlay */}
            {showResult && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-all duration-300`}>
                    <div className={`p-8 rounded-3xl shadow-2xl transform animate-bounce ${showResult === 'correct'
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                        : 'bg-gradient-to-br from-red-400 to-rose-500'
                        }`}>
                        {showResult === 'correct' ? (
                            <div className="text-center text-white">
                                <CheckCircle size={64} className="mx-auto mb-2" />
                                <p className="text-xl font-bold">Correct!</p>
                                <p className="text-green-100 text-sm">+{selectedScenario?.xpReward || 10} XP</p>
                            </div>
                        ) : (
                            <div className="text-center text-white">
                                <AlertTriangle size={64} className="mx-auto mb-2" />
                                <p className="text-xl font-bold">Oops!</p>
                                <p className="text-red-100 text-sm">Keep learning!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 px-4 py-3 sticky top-0 z-10">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="p-1.5 hover:bg-slate-100 rounded-xl transition-all">
                            <ArrowLeft size={20} className="text-slate-600" />
                        </Link>
                        <div>
                            <h1 className="font-bold text-base text-slate-800 flex items-center gap-1.5">
                                <Shield size={18} className="text-purple-600" />
                                Scam Lab
                                {isAIGenerated && (
                                    <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                        <Sparkles size={10} />AI
                                    </span>
                                )}
                            </h1>
                            <p className="text-[10px] text-slate-500">Train your scam detection skills</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="p-2 hover:bg-purple-100 rounded-xl transition-all disabled:opacity-50 group"
                        title="Get new scenarios"
                    >
                        <RefreshCw size={18} className={`text-purple-600 group-hover:text-purple-700 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-32">
                {/* Stats Card - Premium Design */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-4 text-white shadow-xl">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative">
                        {/* Sync indicator */}
                        <div className="absolute top-0 right-0 flex items-center gap-1">
                            {isSyncing ? (
                                <span className="flex items-center gap-1 text-purple-200 text-[10px]">
                                    <Cloud size={12} className="animate-pulse" />
                                    Saving...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-green-300 text-[10px]">
                                    <Cloud size={12} />
                                    Saved
                                </span>
                            )}
                        </div>

                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-purple-200 text-xs font-medium mb-0.5">Lifetime Progress</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-extrabold">{globalStats?.totalXP || 0}</span>
                                    <span className="text-purple-200 text-sm">XP</span>
                                </div>
                                <p className="text-purple-200 text-[10px] mt-0.5">
                                    {globalStats?.scamsIdentified || 0} scams identified
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-center">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mb-0.5">
                                        <CheckCircle size={20} className="text-green-300" />
                                    </div>
                                    <span className="text-green-300 text-sm font-bold">{sessionStats.correct}</span>
                                    <p className="text-purple-200 text-[8px]">This round</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center mb-0.5">
                                        <AlertTriangle size={20} className="text-red-300" />
                                    </div>
                                    <span className="text-red-300 text-sm font-bold">{sessionStats.incorrect}</span>
                                    <p className="text-purple-200 text-[8px]">This round</p>
                                </div>
                            </div>
                        </div>

                        {/* Session XP earned */}
                        {sessionStats.xpEarned > 0 && (
                            <div className="bg-white/10 rounded-lg px-3 py-1.5 mb-2 inline-block">
                                <span className="text-yellow-300 text-xs font-semibold">
                                    +{sessionStats.xpEarned} XP earned this session ✨
                                </span>
                            </div>
                        )}

                        {/* Progress Bar */}
                        <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-purple-200 mb-1">
                                <span>{completedCount} of {totalCount} completed</span>
                                <span>{Math.round(progressPercent)}%</span>
                            </div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Detector Button - Glassmorphism */}
                <button
                    onClick={() => setShowDetector(true)}
                    className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02]"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Search size={22} />
                    </div>
                    <div className="relative text-left flex-1">
                        <p className="font-bold text-sm flex items-center gap-1.5">
                            AI Scam Detector
                            <Sparkles size={14} className="text-yellow-300" />
                        </p>
                        <p className="text-xs text-blue-100">Analyze any suspicious message instantly</p>
                    </div>
                    <ChevronRight size={20} className="relative text-blue-200 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Quick Tips */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-3">
                    <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <Target size={16} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-amber-800">Training Mode</p>
                            <p className="text-[11px] text-amber-700 leading-relaxed">
                                Review each message carefully, then decide if it's a <span className="font-semibold text-red-600">SCAM</span> or <span className="font-semibold text-green-600">SAFE</span>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-slate-100">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                            <Loader2 size={32} className="animate-spin text-purple-600" />
                        </div>
                        <p className="text-slate-800 font-semibold">Generating scenarios...</p>
                        <p className="text-xs text-slate-400 mt-1">AI is crafting new challenges for you</p>
                    </div>
                ) : (
                    /* Messages List */
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <Mail size={16} className="text-purple-600" />
                                Inbox
                            </h2>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {scenarios.length} messages
                            </span>
                        </div>

                        {scenarios.map((scenario, index) => (
                            <button
                                key={scenario.id}
                                onClick={() => handleScenarioClick(scenario)}
                                disabled={isCompleted(scenario.id)}
                                className={`w-full text-left rounded-2xl border-2 transition-all duration-300 overflow-hidden ${isCompleted(scenario.id)
                                    ? 'bg-slate-50 border-slate-100 opacity-70'
                                    : selectedScenario?.id === scenario.id
                                        ? 'bg-purple-50 border-purple-400 shadow-lg shadow-purple-500/10 scale-[1.02]'
                                        : 'bg-white border-slate-100 hover:border-purple-200 hover:shadow-md'
                                    }`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="p-3">
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isCompleted(scenario.id)
                                            ? scenario.isScam
                                                ? 'bg-gradient-to-br from-red-100 to-red-200'
                                                : 'bg-gradient-to-br from-green-100 to-green-200'
                                            : 'bg-gradient-to-br from-slate-100 to-slate-200'
                                            }`}>
                                            {isCompleted(scenario.id) ? (
                                                scenario.isScam
                                                    ? <AlertTriangle size={20} className="text-red-500" />
                                                    : <CheckCircle size={20} className="text-green-500" />
                                            ) : (
                                                <MessageSquare size={20} className="text-slate-400" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <p className="font-semibold text-slate-800 text-sm truncate">
                                                    {scenario.senderName}
                                                </p>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${scenario.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                                        scenario.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        <Zap size={10} />
                                                        {scenario.difficulty}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                                        {getTypeIcon(scenario.type)}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate">{scenario.sender}</p>
                                            <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                                                {scenario.message}
                                            </p>

                                            {/* XP Badge */}
                                            {!isCompleted(scenario.id) && (
                                                <div className="mt-2 inline-flex items-center gap-1 bg-purple-50 text-purple-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                                    <Trophy size={10} />
                                                    +{scenario.xpReward} XP
                                                </div>
                                            )}

                                            {/* Completed Badge */}
                                            {isCompleted(scenario.id) && (
                                                <div className={`mt-2 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${scenario.isScam
                                                    ? 'bg-red-100 text-red-600'
                                                    : 'bg-green-100 text-green-600'
                                                    }`}>
                                                    {scenario.isScam ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
                                                    {scenario.isScam ? 'Was a Scam' : 'Was Legitimate'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Buttons (when scenario selected) */}
            {selectedScenario && !isCompleted(selectedScenario.id) && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20">
                    <div className="max-w-md mx-auto p-4">
                        <p className="text-center text-xs text-slate-600 mb-3 font-medium">
                            Is this message from <span className="text-purple-600 font-semibold">{selectedScenario.senderName}</span> a scam?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleAction('report')}
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-red-600 hover:to-rose-700 transition-all shadow-lg shadow-red-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-95"
                            >
                                <Flag size={18} />
                                SCAM
                            </button>
                            <button
                                onClick={() => handleAction('safe')}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-95"
                            >
                                <Shield size={18} />
                                SAFE
                            </button>
                        </div>
                        {isSupported && (
                            <button
                                onClick={() => speak(selectedScenario.message)}
                                className="w-full mt-3 text-center text-purple-600 text-xs font-medium flex items-center justify-center gap-1.5 py-2 hover:bg-purple-50 rounded-lg transition-colors"
                            >
                                <Volume2 size={14} />
                                Read message aloud
                            </button>
                        )}
                    </div>
                </div>
            )}

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
