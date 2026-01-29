import React, { useState, useEffect, createContext, useContext } from 'react';
import Confetti from 'react-confetti';

// Achievement definitions
export const ACHIEVEMENTS = [
    {
        id: 'first_payment',
        title: 'First Steps',
        description: 'Complete your first payment',
        icon: '🎯',
        xp: 100,
        checkCondition: (stats) => stats.totalTransactions >= 1
    },
    {
        id: 'five_payments',
        title: 'Getting Comfortable',
        description: 'Complete 5 payments',
        icon: '💪',
        xp: 250,
        checkCondition: (stats) => stats.totalTransactions >= 5
    },
    {
        id: 'scam_spotter',
        title: 'Scam Spotter',
        description: 'Identify 3 scams correctly in Scam Lab',
        icon: '🛡️',
        xp: 300,
        checkCondition: (stats) => stats.scamsIdentified >= 3
    },
    {
        id: 'scam_expert',
        title: 'Scam Expert',
        description: 'Identify 10 scams correctly',
        icon: '🏆',
        xp: 500,
        checkCondition: (stats) => stats.scamsIdentified >= 10
    },
    {
        id: 'qr_scanner',
        title: 'QR Master',
        description: 'Scan 3 QR codes successfully',
        icon: '📱',
        xp: 150,
        checkCondition: (stats) => stats.qrScans >= 3
    },
    {
        id: 'voucher_sender',
        title: 'P2P Pioneer',
        description: 'Send a cash voucher to someone',
        icon: '🤝',
        xp: 200,
        checkCondition: (stats) => stats.vouchersSent >= 1
    },
    {
        id: 'bill_payer',
        title: 'Bill Payer',
        description: 'Pay 3 bills on time',
        icon: '📄',
        xp: 200,
        checkCondition: (stats) => stats.billsPaid >= 3
    },
    {
        id: 'loan_learner',
        title: 'Loan Learner',
        description: 'Use the EMI calculator',
        icon: '📊',
        xp: 100,
        checkCondition: (stats) => stats.loanCalculations >= 1
    },
    {
        id: 'confident',
        title: 'Confidence Builder',
        description: 'Reach 1000 XP total',
        icon: '⭐',
        xp: 500,
        checkCondition: (stats) => stats.totalXP >= 1000
    },
    {
        id: 'master',
        title: 'Digital Payment Master',
        description: 'Reach 3000 XP total',
        icon: '👑',
        xp: 1000,
        checkCondition: (stats) => stats.totalXP >= 3000
    }
];

// Context for achievements
const AchievementContext = createContext();

export const useAchievements = () => useContext(AchievementContext);

export const AchievementProvider = ({ children }) => {
    const [stats, setStats] = useState(() => {
        const saved = localStorage.getItem('seniorSafe_stats');
        return saved ? JSON.parse(saved) : {
            totalTransactions: 0,
            scamsIdentified: 0,
            qrScans: 0,
            vouchersSent: 0,
            billsPaid: 0,
            loanCalculations: 0,
            totalXP: 0
        };
    });

    const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
        const saved = localStorage.getItem('seniorSafe_achievements');
        return saved ? JSON.parse(saved) : [];
    });

    const [newAchievement, setNewAchievement] = useState(null);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('seniorSafe_stats', JSON.stringify(stats));
    }, [stats]);

    useEffect(() => {
        localStorage.setItem('seniorSafe_achievements', JSON.stringify(unlockedAchievements));
    }, [unlockedAchievements]);

    // Check for new achievements when stats change
    useEffect(() => {
        ACHIEVEMENTS.forEach(achievement => {
            if (!unlockedAchievements.includes(achievement.id) && achievement.checkCondition(stats)) {
                // Unlock achievement
                setUnlockedAchievements(prev => [...prev, achievement.id]);
                setStats(prev => ({ ...prev, totalXP: prev.totalXP + achievement.xp }));
                setNewAchievement(achievement);
                
                // Clear notification after 5 seconds
                setTimeout(() => setNewAchievement(null), 5000);
            }
        });
    }, [stats, unlockedAchievements]);

    const incrementStat = (statName, amount = 1) => {
        setStats(prev => ({
            ...prev,
            [statName]: (prev[statName] || 0) + amount
        }));
    };

    const addXP = (amount) => {
        setStats(prev => ({
            ...prev,
            totalXP: prev.totalXP + amount
        }));
    };

    const getLevel = () => {
        const xp = stats.totalXP;
        if (xp < 500) return { level: 1, title: 'Beginner', nextLevel: 500, progress: (xp / 500) * 100 };
        if (xp < 1500) return { level: 2, title: 'Learner', nextLevel: 1500, progress: ((xp - 500) / 1000) * 100 };
        if (xp < 3000) return { level: 3, title: 'Practitioner', nextLevel: 3000, progress: ((xp - 1500) / 1500) * 100 };
        if (xp < 5000) return { level: 4, title: 'Expert', nextLevel: 5000, progress: ((xp - 3000) / 2000) * 100 };
        return { level: 5, title: 'Master', nextLevel: null, progress: 100 };
    };

    return (
        <AchievementContext.Provider value={{
            stats,
            unlockedAchievements,
            incrementStat,
            addXP,
            getLevel,
            achievements: ACHIEVEMENTS
        }}>
            {children}
            
            {/* Achievement Notification Popup */}
            {newAchievement && (
                <AchievementNotification achievement={newAchievement} onClose={() => setNewAchievement(null)} />
            )}
        </AchievementContext.Provider>
    );
};

// Achievement notification component
const AchievementNotification = ({ achievement, onClose }) => {
    return (
        <>
            <Confetti recycle={false} numberOfPieces={100} />
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 min-w-[280px]">
                    <div className="text-4xl">{achievement.icon}</div>
                    <div>
                        <p className="text-xs opacity-80">Achievement Unlocked!</p>
                        <p className="font-bold">{achievement.title}</p>
                        <p className="text-xs">+{achievement.xp} XP</p>
                    </div>
                    <button onClick={onClose} className="ml-auto text-white/80 hover:text-white">✕</button>
                </div>
            </div>
        </>
    );
};

export default AchievementProvider;
