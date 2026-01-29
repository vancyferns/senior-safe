import React from 'react';
import { ArrowLeft, Award, Star, Trophy, Lock, CheckCircle, ChevronRight, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAchievements, ACHIEVEMENTS } from '../context/AchievementContext';
import Card from '../components/ui/Card';

const Achievements = () => {
    const { stats, unlockedAchievements, getLevel } = useAchievements();
    const navigate = useNavigate();
    const levelInfo = getLevel();

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
