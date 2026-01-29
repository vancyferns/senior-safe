import React from 'react';
import { ArrowLeft, Award, Star, Trophy, Lock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAchievements, ACHIEVEMENTS } from '../context/AchievementContext';
import Card from '../components/ui/Card';

const Achievements = () => {
    const { stats, unlockedAchievements, getLevel } = useAchievements();
    const levelInfo = getLevel();

    return (
        <div className="space-y-4">
            {/* XP & Level Card */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
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
                    <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-white transition-all duration-500"
                            style={{ width: `${levelInfo.progress}%` }}
                        />
                    </div>
                    {levelInfo.nextLevel && (
                        <p className="text-xs text-amber-100 mt-1 text-center">
                            {levelInfo.nextLevel - stats.totalXP} XP to next level
                        </p>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            <Card>
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Star size={18} className="text-brand-blue" />
                    Your Progress
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-slate-800">{stats.totalTransactions}</p>
                        <p className="text-xs text-slate-600">Transactions</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-slate-800">{stats.scamsIdentified}</p>
                        <p className="text-xs text-slate-600">Scams Spotted</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-slate-800">{stats.qrScans}</p>
                        <p className="text-xs text-slate-600">QR Scans</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-slate-800">{stats.billsPaid}</p>
                        <p className="text-xs text-slate-600">Bills Paid</p>
                    </div>
                </div>
            </Card>

            {/* Achievements List */}
            <div>
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Trophy size={18} className="text-amber-500" />
                    Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
                </h3>
                <div className="space-y-2">
                    {ACHIEVEMENTS.map((achievement) => {
                        const isUnlocked = unlockedAchievements.includes(achievement.id);
                        return (
                            <div
                                key={achievement.id}
                                className={`rounded-xl p-4 border-2 transition-colors ${
                                    isUnlocked 
                                        ? 'bg-green-50 border-green-200' 
                                        : 'bg-slate-50 border-slate-200 opacity-70'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`text-3xl ${!isUnlocked && 'grayscale opacity-50'}`}>
                                        {achievement.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-semibold ${isUnlocked ? 'text-green-800' : 'text-slate-600'}`}>
                                                {achievement.title}
                                            </p>
                                            {isUnlocked ? (
                                                <CheckCircle size={16} className="text-green-500" />
                                            ) : (
                                                <Lock size={14} className="text-slate-400" />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-600">{achievement.description}</p>
                                    </div>
                                    <div className={`text-right ${isUnlocked ? 'text-green-600' : 'text-slate-400'}`}>
                                        <p className="font-bold">+{achievement.xp}</p>
                                        <p className="text-xs">XP</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Encouragement */}
            <Card className="bg-blue-50 border-blue-200 text-center">
                <p className="text-blue-800">
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
