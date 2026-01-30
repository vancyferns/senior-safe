import React, { useState, useEffect } from 'react';
import { ArrowLeft, Award, Star, Trophy, Lock, CheckCircle, ChevronRight, Info, Target, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAchievements, ACHIEVEMENTS } from '../context/AchievementContext';
import Card from '../components/ui/Card';
import { generateDailyChallenges, isGeminiAvailable } from '../services/geminiService';

// Fallback challenges when AI is unavailable
const FALLBACK_CHALLENGES = [
    {
        id: 'fallback_send_1',
        title: 'First Payment',
        description: 'Send ₹100 to any contact to practice safe payments',
        action: 'send_money',
        link: '/send',
        targetCount: 1,
        xpReward: 75,
        icon: '💰',
        difficulty: 'easy',
        progress: 0,
        completed: false
    },
    {
        id: 'fallback_scam_1',
        title: 'Scam Spotter',
        description: 'Identify 2 scam messages in the Scam Lab',
        action: 'scam_lab',
        link: '/scam-lab',
        targetCount: 2,
        xpReward: 100,
        icon: '🛡️',
        difficulty: 'medium',
        progress: 0,
        completed: false
    },
    {
        id: 'fallback_bill_1',
        title: 'Bill Master',
        description: 'Pay one utility bill on time',
        action: 'pay_bill',
        link: '/bills',
        targetCount: 1,
        xpReward: 75,
        icon: '📄',
        difficulty: 'easy',
        progress: 0,
        completed: false
    }
];

const Achievements = () => {
    const { stats, unlockedAchievements, getLevel } = useAchievements();
    const navigate = useNavigate();
    const levelInfo = getLevel();

    // Challenge states
    const [challenges, setChallenges] = useState([]);
    const [isLoadingChallenges, setIsLoadingChallenges] = useState(true);
    const [isAIChallenges, setIsAIChallenges] = useState(false);

    // Load challenges on mount
    useEffect(() => {
        loadChallenges();
    }, []);

    // Update challenge progress based on stats
    useEffect(() => {
        if (challenges.length === 0) return;
        
        setChallenges(prev => prev.map(challenge => {
            let progress = 0;
            let completed = challenge.completed;
            
            // Map action to stat
            switch (challenge.action) {
                case 'send_money':
                    progress = Math.min(stats.totalTransactions, challenge.targetCount);
                    break;
                case 'scan_qr':
                    progress = Math.min(stats.qrScans, challenge.targetCount);
                    break;
                case 'pay_bill':
                    progress = Math.min(stats.billsPaid, challenge.targetCount);
                    break;
                case 'scam_lab':
                    progress = Math.min(stats.scamsIdentified, challenge.targetCount);
                    break;
                case 'loan_calc':
                    progress = Math.min(stats.loanCalculations, challenge.targetCount);
                    break;
                case 'create_voucher':
                    progress = Math.min(stats.vouchersSent, challenge.targetCount);
                    break;
                default:
                    progress = 0;
            }
            
            // Check if newly completed
            if (progress >= challenge.targetCount && !completed) {
                completed = true;
            }
            
            return { ...challenge, progress, completed };
        }));
    }, [stats, challenges.length]);

    // Check if all challenges are complete
    const allChallengesComplete = challenges.length > 0 && challenges.every(c => c.completed);
    
    // Save challenges to localStorage
    useEffect(() => {
        if (challenges.length > 0) {
            localStorage.setItem('seniorSafe_challenges_v2', JSON.stringify({
                challenges,
                isAI: isAIChallenges,
                savedAt: new Date().toISOString()
            }));
        }
    }, [challenges, isAIChallenges]);

    const loadChallenges = async () => {
        setIsLoadingChallenges(true);
        
        // Try to load from localStorage first
        const saved = localStorage.getItem('seniorSafe_challenges_v2');
        if (saved) {
            try {
                const { challenges: savedChallenges, isAI, savedAt } = JSON.parse(saved);
                // Check if challenges are still valid (not all completed and less than 24 hours old)
                const isRecent = new Date() - new Date(savedAt) < 24 * 60 * 60 * 1000;
                const hasIncomplete = savedChallenges.some(c => !c.completed);
                
                if (isRecent && hasIncomplete) {
                    setChallenges(savedChallenges);
                    setIsAIChallenges(isAI);
                    setIsLoadingChallenges(false);
                    return;
                }
            } catch (e) {
                console.error('Error parsing saved challenges:', e);
            }
        }

        // Generate new challenges
        await generateNewChallenges();
    };

    const generateNewChallenges = async () => {
        setIsLoadingChallenges(true);
        
        // Get completed challenge IDs from history
        const completedHistory = JSON.parse(localStorage.getItem('seniorSafe_completed_challenges') || '[]');
        
        if (isGeminiAvailable()) {
            try {
                const aiChallenges = await generateDailyChallenges(3, completedHistory);
                setChallenges(aiChallenges);
                setIsAIChallenges(true);
                setIsLoadingChallenges(false);
                return;
            } catch (error) {
                console.error('Failed to generate AI challenges:', error);
            }
        }
        
        // Fallback to hardcoded
        setChallenges(FALLBACK_CHALLENGES.map(c => ({ ...c, progress: 0, completed: false })));
        setIsAIChallenges(false);
        setIsLoadingChallenges(false);
    };

    const handleRefreshChallenges = async () => {
        // Save completed challenge IDs to history
        const completedIds = challenges.filter(c => c.completed).map(c => c.id);
        const existingHistory = JSON.parse(localStorage.getItem('seniorSafe_completed_challenges') || '[]');
        const newHistory = [...new Set([...existingHistory, ...completedIds])].slice(-50); // Keep last 50
        localStorage.setItem('seniorSafe_completed_challenges', JSON.stringify(newHistory));
        
        // Clear current challenges and generate new
        localStorage.removeItem('seniorSafe_challenges_v2');
        await generateNewChallenges();
    };

    return (
        <div className="space-y-4">
            {/* XP & Level Card */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-2xl shadow-orange-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-9xl opacity-10">🏆</div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-amber-100 text-sm">Current Level</p>
                            <p className="text-3xl font-bold">{levelInfo.title}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-amber-100 text-sm">Total XP</p>
                            <p className="text-2xl font-bold">{stats.totalXP}</p>
                        </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span>Level {levelInfo.level}</span>
                            {levelInfo.nextLevel && <span>Level {levelInfo.level + 1}</span>}
                        </div>
                        <div className="h-4 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                            <div 
                                className="h-full bg-gradient-to-r from-white to-amber-100 transition-all duration-500 rounded-full shimmer"
                                style={{ width: `${levelInfo.progress}%` }}
                            />
                        </div>
                        {levelInfo.nextLevel && (
                            <p className="text-xs text-amber-100 mt-2 text-center">
                                ✨ {levelInfo.nextLevel - stats.totalXP} XP to next level
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <Card variant="gradient">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Star size={18} className="text-blue-800" />
                    Your Progress
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-100 rounded-2xl p-4 text-center shadow-sm">
                        <p className="text-3xl font-bold text-blue-800">{stats.totalTransactions}</p>
                        <p className="text-xs text-slate-600 font-medium">Transactions</p>
                    </div>
                    <div className="bg-red-100 rounded-2xl p-4 text-center shadow-sm">
                        <p className="text-3xl font-bold text-red-600">{stats.scamsIdentified}</p>
                        <p className="text-xs text-slate-600 font-medium">Scams Spotted</p>
                    </div>
                    <div className="bg-blue-100 rounded-2xl p-4 text-center shadow-sm">
                        <p className="text-3xl font-bold text-blue-800">{stats.qrScans}</p>
                        <p className="text-xs text-slate-600 font-medium">QR Scans</p>
                    </div>
                    <div className="bg-emerald-100 rounded-2xl p-4 text-center shadow-sm">
                        <p className="text-3xl font-bold text-emerald-600">{stats.billsPaid}</p>
                        <p className="text-xs text-slate-600 font-medium">Bills Paid</p>
                    </div>
                </div>
            </Card>

            {/* --- Daily Challenges --- */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                        <Target size={20} className="text-emerald-600" />
                        Daily Challenges
                        {isAIChallenges && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                <Sparkles size={12} />
                                AI
                            </span>
                        )}
                    </h3>
                    {allChallengesComplete && (
                        <button
                            onClick={handleRefreshChallenges}
                            className="text-emerald-600 text-sm font-semibold flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full hover:bg-emerald-100 transition-colors"
                        >
                            <RefreshCw size={14} />
                            New Challenges
                        </button>
                    )}
                </div>

                {isLoadingChallenges ? (
                    <Card className="text-center py-6">
                        <Loader2 size={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">Generating challenges...</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {challenges.map((challenge) => (
                            <Card 
                                key={challenge.id} 
                                className={`border-l-4 transition-all ${
                                    challenge.completed 
                                        ? 'border-l-green-500 bg-green-50/50' 
                                        : 'border-l-emerald-500'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`text-3xl ${challenge.completed ? 'grayscale-0' : ''}`}>
                                        {challenge.completed ? '✅' : challenge.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`font-bold ${challenge.completed ? 'text-green-700' : 'text-slate-800'}`}>
                                                {challenge.title}
                                            </h4>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                challenge.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                                challenge.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {challenge.difficulty}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 text-sm">{challenge.description}</p>
                                        
                                        {/* Progress bar */}
                                        {!challenge.completed && challenge.targetCount > 1 && (
                                            <div className="mt-2">
                                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                    <span>Progress</span>
                                                    <span>{challenge.progress}/{challenge.targetCount}</span>
                                                </div>
                                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-emerald-500 transition-all duration-300"
                                                        style={{ width: `${(challenge.progress / challenge.targetCount) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="text-right">
                                        {challenge.completed ? (
                                            <div className="text-green-600">
                                                <CheckCircle size={24} className="mx-auto mb-1" />
                                                <span className="text-xs font-medium">+{challenge.xpReward} XP</span>
                                            </div>
                                        ) : (
                                            <Link 
                                                to={challenge.link}
                                                className="inline-flex items-center gap-1 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all"
                                            >
                                                Go
                                                <ChevronRight size={16} />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                        
                        {allChallengesComplete && (
                            <Card className="text-center py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                                <p className="text-green-700 font-bold text-lg">🎉 All Challenges Complete!</p>
                                <p className="text-green-600 text-sm">Great job! Click "New Challenges" for more.</p>
                            </Card>
                        )}
                    </div>
                )}
            </div>

            {/* Achievements List */}
            <div>
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Trophy size={18} className="text-amber-500" />
                    Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
                </h3>
                <div className="space-y-3">
                    {ACHIEVEMENTS.map((achievement) => {
                        const isUnlocked = unlockedAchievements.includes(achievement.id);
                        return (
                            <div
                                key={achievement.id}
                                className={`rounded-2xl p-4 border-2 transition-all duration-300 ${
                                    isUnlocked 
                                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-md' 
                                        : 'bg-white border-slate-200 shadow-sm'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`text-4xl ${!isUnlocked && 'grayscale opacity-50'} transition-transform hover:scale-110`}>
                                        {achievement.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-bold ${isUnlocked ? 'text-green-800' : 'text-slate-700'}`}>
                                                {achievement.title}
                                            </p>
                                            {isUnlocked ? (
                                                <CheckCircle size={18} className="text-green-500" />
                                            ) : (
                                                <Lock size={14} className="text-slate-400" />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-600">{achievement.description}</p>
                                    </div>
                                    <div className={`text-right px-3 py-1 rounded-full ${isUnlocked ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <p className="font-bold">+{achievement.xp}</p>
                                        <p className="text-xs">XP</p>
                                    </div>
                                </div>
                                
                                {/* Show instructions for locked achievements */}
                                {!isUnlocked && (
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
                                            <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold text-blue-800 mb-1">How to complete:</p>
                                                <p className="text-xs text-blue-700">{achievement.howTo}</p>
                                            </div>
                                        </div>
                                        {achievement.link && (
                                            <button
                                                onClick={() => navigate(achievement.link)}
                                                className="mt-2 w-full flex items-center justify-center gap-2 bg-brand-blue text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors active:scale-98"
                                            >
                                                Go to {achievement.title.includes('Scam') ? 'Scam Lab' : 
                                                       achievement.title.includes('QR') ? 'QR Scanner' :
                                                       achievement.title.includes('Voucher') ? 'Send Voucher' :
                                                       achievement.title.includes('Bill') ? 'Pay Bills' :
                                                       achievement.title.includes('Loan') ? 'Loan Center' :
                                                       'Send Money'}
                                                <ChevronRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Encouragement */}
            <Card variant="gradient" className="border-blue-200 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
                <p className="text-lg font-semibold text-blue-800 relative z-10">
                    {unlockedAchievements.length < 3 
                        ? "Keep practicing! You're doing great! 💪"
                        : unlockedAchievements.length < 6
                            ? "Excellent progress! You're becoming confident! 🌟"
                            : "Amazing! You're a digital payment expert! 🏆"
                    }
                </p>
            </Card>
        </div>
    );
};

export default Achievements;
