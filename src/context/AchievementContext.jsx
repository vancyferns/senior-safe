import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import Confetti from 'react-confetti';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured, getOrCreateAchievementStats, updateAchievementStats, convertStatsFromDb } from '../lib/supabase';

// Achievement definitions with instructions
export const ACHIEVEMENTS = [
    {
        id: 'first_payment',
        title: 'First Steps',
        description: 'Complete your first payment',
        howTo: 'Go to "Send Money" from the home screen and send money to any contact.',
        link: '/send',
        icon: '🎯',
        xp: 100,
        checkCondition: (stats) => stats.totalTransactions >= 1
    },
    {
        id: 'five_payments',
        title: 'Getting Comfortable',
        description: 'Complete 5 payments',
        howTo: 'Keep practicing! Send money to different contacts or pay bills.',
        link: '/send',
        icon: '💪',
        xp: 250,
        checkCondition: (stats) => stats.totalTransactions >= 5
    },
    {
        id: 'scam_spotter',
        title: 'Scam Spotter',
        description: 'Identify 3 scams correctly in Scam Lab',
        howTo: 'Open "Scam Lab" and practice identifying fake messages and calls.',
        link: '/scam-lab',
        icon: '🛡️',
        xp: 300,
        checkCondition: (stats) => stats.scamsIdentified >= 3
    },
    {
        id: 'scam_expert',
        title: 'Scam Expert',
        description: 'Identify 10 scams correctly',
        howTo: 'Continue practicing in "Scam Lab" to become an expert!',
        link: '/scam-lab',
        icon: '🏆',
        xp: 500,
        checkCondition: (stats) => stats.scamsIdentified >= 10
    },
    {
        id: 'qr_scanner',
        title: 'QR Master',
        description: 'Scan 3 QR codes successfully',
        howTo: 'Use "Scan QR" to scan payment codes. You can also use the test button!',
        link: '/scan',
        icon: '📱',
        xp: 150,
        checkCondition: (stats) => stats.qrScans >= 3
    },
    {
        id: 'voucher_sender',
        title: 'P2P Pioneer',
        description: 'Send a cash voucher to someone',
        howTo: 'Go to "Send Voucher" to create a QR code that someone else can scan.',
        link: '/send-voucher',
        icon: '🤝',
        xp: 200,
        checkCondition: (stats) => stats.vouchersSent >= 1
    },
    {
        id: 'bill_payer',
        title: 'Bill Payer',
        description: 'Pay 3 bills on time',
        howTo: 'Find "Pay Bills" on the home screen and practice paying electricity or phone bills.',
        link: '/emi-payment',
        icon: '📄',
        xp: 200,
        checkCondition: (stats) => stats.billsPaid >= 3
    },
    {
        id: 'loan_learner',
        title: 'Loan Learner',
        description: 'Use the EMI calculator',
        howTo: 'Visit "Loan Center" and try the EMI calculator to see monthly payments.',
        link: '/loans',
        icon: '📊',
        xp: 100,
        checkCondition: (stats) => stats.loanCalculations >= 1
    },
    {
        id: 'confident',
        title: 'Confidence Builder',
        description: 'Reach 1000 XP total',
        howTo: 'Complete other achievements to earn XP and reach this milestone!',
        link: null,
        icon: '⭐',
        xp: 500,
        checkCondition: (stats) => stats.totalXP >= 1000
    },
    {
        id: 'master',
        title: 'Digital Payment Master',
        description: 'Reach 3000 XP total',
        howTo: 'You\'re almost there! Keep using the app to master digital payments.',
        link: null,
        icon: '👑',
        xp: 1000,
        checkCondition: (stats) => stats.totalXP >= 3000
    }
];

// Context for achievements
const AchievementContext = createContext();

export const useAchievements = () => useContext(AchievementContext);

export const AchievementProvider = ({ children }) => {
    const { dbUser } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    
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

    // Streak tracking
    const [streak, setStreak] = useState(() => {
        const saved = localStorage.getItem('seniorSafe_streak');
        return saved ? JSON.parse(saved) : {
            currentStreak: 0,
            longestStreak: 0,
            lastVisitDate: null,
            pendingReward: null // Stores reward to be claimed
        };
    });

    // Check and update streak on mount
    useEffect(() => {
        const today = new Date().toDateString();
        const lastVisit = streak.lastVisitDate;

        if (lastVisit === today) {
            // Already visited today, do nothing
            return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        let newStreak = { ...streak };

        if (lastVisit === yesterdayStr) {
            // Consecutive day - increment streak
            newStreak.currentStreak += 1;
            newStreak.longestStreak = Math.max(newStreak.longestStreak, newStreak.currentStreak);
        } else if (lastVisit !== null) {
            // Streak broken - reset to 1
            newStreak.currentStreak = 1;
        } else {
            // First visit ever
            newStreak.currentStreak = 1;
        }

        newStreak.lastVisitDate = today;

        // Check for milestone rewards (every 7 days)
        if (newStreak.currentStreak > 0 && newStreak.currentStreak % 7 === 0) {
            // Generate reward
            const rewardTypes = [
                { type: 'xp', amount: 100, message: 'Bonus XP for your dedication!' },
                { type: 'xp', amount: 150, message: 'Extra XP reward!' },
                { type: 'xp', amount: 200, message: 'Amazing streak bonus!' },
                { type: 'money', amount: 100, message: 'Demo cash added to wallet!' },
                { type: 'money', amount: 200, message: 'Streak bonus cash!' },
                { type: 'money', amount: 500, message: 'Mega streak reward!' },
            ];
            const randomReward = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
            newStreak.pendingReward = {
                ...randomReward,
                streakDay: newStreak.currentStreak,
                id: Date.now()
            };
        }

        setStreak(newStreak);
    }, []); // Only run once on mount

    // Persist streak to localStorage
    useEffect(() => {
        localStorage.setItem('seniorSafe_streak', JSON.stringify(streak));
    }, [streak]);

    // Load stats from Supabase when user logs in
    const loadStatsFromSupabase = useCallback(async () => {
        if (!dbUser?.id || !isSupabaseConfigured()) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const { stats: dbStats, error } = await getOrCreateAchievementStats(dbUser.id);
            
            if (dbStats && !error) {
                const convertedStats = convertStatsFromDb(dbStats);
                setStats(convertedStats);
                setUnlockedAchievements(dbStats.unlocked_achievements || []);
                console.log('✅ Achievement stats loaded from Supabase');
            }
        } catch (error) {
            console.error('Error loading stats from Supabase:', error);
        }
        setIsLoading(false);
    }, [dbUser?.id]);

    // Load from Supabase when user changes
    useEffect(() => {
        loadStatsFromSupabase();
    }, [loadStatsFromSupabase]);

    // Persist to localStorage (always, as backup)
    useEffect(() => {
        localStorage.setItem('seniorSafe_stats', JSON.stringify(stats));
    }, [stats]);

    useEffect(() => {
        localStorage.setItem('seniorSafe_achievements', JSON.stringify(unlockedAchievements));
    }, [unlockedAchievements]);

    // Sync to Supabase when stats change (debounced)
    useEffect(() => {
        if (!dbUser?.id || !isSupabaseConfigured() || isLoading) return;

        const syncTimeout = setTimeout(async () => {
            setIsSyncing(true);
            try {
                await updateAchievementStats(dbUser.id, stats, unlockedAchievements);
                console.log('✅ Achievement stats synced to Supabase');
            } catch (error) {
                console.error('Error syncing stats to Supabase:', error);
            }
            setIsSyncing(false);
        }, 1000); // Debounce 1 second

        return () => clearTimeout(syncTimeout);
    }, [stats, unlockedAchievements, dbUser?.id, isLoading]);

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

    const claimStreakReward = (reward) => {
        if (reward.type === 'xp') {
            addXP(reward.amount);
        }
        // Money rewards will be handled by the component via WalletContext
        setStreak(prev => ({ ...prev, pendingReward: null }));
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
            achievements: ACHIEVEMENTS,
            isLoading,
            isSyncing,
            streak,
            claimStreakReward
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
