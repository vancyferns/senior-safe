import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { useAchievements } from '../context/AchievementContext';
import Card from '../components/ui/Card';
import ScratchCard from '../components/ScratchCard';
import { ScanLine, Send, Wallet, Receipt, ChevronRight, QrCode, UserPlus, ShieldAlert, Calculator, CreditCard, User, Phone, Download, RefreshCw, CheckCircle, AlertCircle, Loader2, Flame, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { findUserByPhone, isSupabaseConfigured } from '../lib/supabase';
import { getStreakMotivation } from '../services/geminiService';


const ActionButton = ({ icon: Icon, label, to, color = "bg-blue-800" }) => (
    <Link to={to} className="flex flex-col items-center gap-2 group">
        <div className={`${color} text-white p-4 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
            <Icon size={32} />
        </div>
        <span className="font-semibold text-slate-900 text-sm">{label}</span>
    </Link>
);

const Dashboard = () => {
    const { balance, contacts, addContact, transactions, refreshWallet, isLoading, addMoney } = useWallet();
    const { streak, claimStreakReward } = useAchievements();
    const [showBalance, setShowBalance] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAddContact, setShowAddContact] = useState(false);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');
    const [showScratchCard, setShowScratchCard] = useState(false);
    const [motivation, setMotivation] = useState('Keep going! 💪');

    // Fetch motivational message on mount
    useEffect(() => {
        const fetchMotivation = async () => {
            try {
                const msg = await getStreakMotivation(streak.currentStreak);
                if (msg) setMotivation(msg);
            } catch (e) {
                // Use fallback
            }
        };
        fetchMotivation();
    }, [streak.currentStreak]);
    
    // New states for phone validation
    const [isSearchingUser, setIsSearchingUser] = useState(false);
    const [matchedUser, setMatchedUser] = useState(null);
    const [showNameMismatch, setShowNameMismatch] = useState(false);
    const [phoneValidated, setPhoneValidated] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshWallet();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    // Debounced phone lookup
    const lookupUserByPhone = useCallback(async (phone) => {
        if (!phone || phone.length < 10 || !isSupabaseConfigured()) {
            setMatchedUser(null);
            setPhoneValidated(false);
            setShowNameMismatch(false);
            return;
        }

        setIsSearchingUser(true);
        try {
            const { user } = await findUserByPhone(phone);
            setMatchedUser(user);
            setPhoneValidated(!!user);
            
            // Check if name matches (case-insensitive)
            if (user && newContactName.trim()) {
                const enteredName = newContactName.trim().toLowerCase();
                const actualName = user.name?.toLowerCase() || '';
                setShowNameMismatch(enteredName !== actualName && enteredName.length > 0);
            } else {
                setShowNameMismatch(false);
            }
        } catch (error) {
            console.error('Error looking up user:', error);
            setMatchedUser(null);
            setPhoneValidated(false);
        }
        setIsSearchingUser(false);
    }, [newContactName]);

    // Effect to lookup user when phone changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (newContactPhone.length >= 10) {
                lookupUserByPhone(newContactPhone);
            } else {
                setMatchedUser(null);
                setPhoneValidated(false);
                setShowNameMismatch(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [newContactPhone, lookupUserByPhone]);

    // Effect to check name mismatch when name changes
    useEffect(() => {
        if (matchedUser && newContactName.trim()) {
            const enteredName = newContactName.trim().toLowerCase();
            const actualName = matchedUser.name?.toLowerCase() || '';
            setShowNameMismatch(enteredName !== actualName);
        } else {
            setShowNameMismatch(false);
        }
    }, [newContactName, matchedUser]);

    const handleAddContact = () => {
        // Allow adding if we have a matched user OR if both name and phone are provided
        const hasValidPhone = newContactPhone.trim().length === 10;
        const canAdd = hasValidPhone && (matchedUser || newContactName.trim());
        
        if (!canAdd) return;
        
        // If we found a matching user, use their actual info
        if (matchedUser) {
            addContact(
                matchedUser.name, // Use actual name from DB
                newContactPhone.trim(),
                matchedUser.email,
                matchedUser.picture,
                matchedUser.id
            );
        } else {
            // No matching user, add as regular contact
            addContact(newContactName.trim(), newContactPhone.trim());
        }
        resetAddContactModal();
    };

    const handleUseActualName = () => {
        if (matchedUser) {
            setNewContactName(matchedUser.name);
            setShowNameMismatch(false);
        }
    };

    const resetAddContactModal = () => {
        setNewContactName('');
        setNewContactPhone('');
        setMatchedUser(null);
        setPhoneValidated(false);
        setShowNameMismatch(false);
        setShowAddContact(false);
    };

    // Get recent transactions for display
    const recentTransactions = transactions.slice(0, 3);

    return (
        <div className="space-y-6">
            {/* --- Balance Card --- */}
            <div className="bg-blue-800 rounded-3xl p-6 text-white shadow-xl">
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-lg opacity-90">Total Balance</h2>
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing || isLoading}
                            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-all border border-white/30 disabled:opacity-50"
                            title="Refresh balance"
                        >
                            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold">
                            {showBalance ? `₹${balance.toLocaleString()}` : "₹ •••••"}
                        </span>
                        <button
                            onClick={() => setShowBalance(!showBalance)}
                            className="text-sm bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-all mb-1 border border-white/30"
                        >
                            {showBalance ? "Hide" : "Show"}
                        </button>
                    </div>
                    <p className="text-sm mt-4 opacity-80">🔒 Secure Environment • Demo Money</p>
                </div>
            </div>

            {/* --- Compact Streak Card --- */}
            <div 
                className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl px-3 py-2 text-white shadow-md cursor-pointer hover:shadow-lg transition-all flex items-center gap-3"
                onClick={() => streak.pendingReward && setShowScratchCard(true)}
            >
                <div className="flex items-center gap-1 flex-shrink-0">
                    <Flame size={18} className="text-white" />
                    <span className="text-xs font-bold">Streak</span>
                </div>
                
                {/* Streak Worm - circles */}
                <div className="flex items-center gap-1">
                    {[...Array(7)].map((_, i) => (
                        <div 
                            key={i}
                            className={`w-4 h-4 rounded-full border-2 border-white/50 transition-all ${
                                i < (streak.currentStreak % 7 || (streak.currentStreak > 0 && streak.currentStreak % 7 === 0 ? 7 : 0))
                                    ? 'bg-white scale-110' 
                                    : 'bg-white/20'
                            }`}
                        />
                    ))}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{streak.currentStreak} day{streak.currentStreak !== 1 ? 's' : ''} • {motivation}</p>
                </div>

                {streak.pendingReward && (
                    <div className="bg-white/30 px-2 py-1 rounded-lg animate-pulse flex-shrink-0">
                        <Gift size={16} />
                    </div>
                )}
            </div>

            {/* --- Quick Actions --- */}
            <div className="grid grid-cols-4 gap-2">
                <ActionButton to="/scan" icon={ScanLine} label="Scan QR" />
                <ActionButton to="/send" icon={Send} label="To Contact" />
                <ActionButton to="/receive" icon={Download} label="Receive" color="bg-emerald-600" />
                <ActionButton to="/history" icon={Receipt} label="History" color="bg-blue-700" />
            </div>

            {/* --- More Features --- */}
            <div className="grid grid-cols-4 gap-2">
                <ActionButton to="/voucher" icon={QrCode} label="P2P Cash" color="bg-blue-800" />
                <ActionButton to="/scam-lab" icon={ShieldAlert} label="Scam Lab" color="bg-red-600" />
                <ActionButton to="/loan-center" icon={Calculator} label="Loans" color="bg-blue-800" />
                <ActionButton to="/bills" icon={CreditCard} label="Bills" color="bg-emerald-600" />
            </div>

            {/* --- Contacts / People --- */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 text-lg">People</h3>
                    <button
                        onClick={() => setShowAddContact(true)}
                        className="text-blue-800 text-sm font-semibold flex items-center gap-1 hover:underline bg-blue-100 px-3 py-1 rounded-full transition-all hover:bg-blue-200"
                    >
                        <UserPlus size={16} /> Add
                    </button>
                </div>
                {contacts.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {contacts.map((contact) => (
                            <Link
                                key={contact.id}
                                to="/send"
                                state={{ preselectedContact: contact }}
                                className="flex flex-col items-center min-w-[70px] group"
                            >
                                <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center text-slate-700 font-bold text-lg mb-1 group-hover:bg-blue-800 group-hover:text-white transition-all duration-300 shadow-md group-hover:shadow-lg overflow-hidden">
                                    {contact.picture ? (
                                        <img 
                                            src={contact.picture} 
                                            alt={contact.name} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        contact.name.charAt(0)
                                    )}
                                </div>
                                <span className="text-xs text-slate-600 truncate w-16 text-center">
                                    {contact.name.split(' ')[0]}
                                </span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
                        <p className="text-slate-500 text-sm">No contacts yet</p>
                        <p className="text-slate-400 text-xs mt-1">People you pay will appear here</p>
                    </div>
                )}
            </div>

            {/* --- Recent Activity --- */}
            {recentTransactions.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900 text-lg">Recent Activity</h3>
                        <Link to="/history" className="text-blue-800 text-sm font-semibold hover:underline">
                            See All
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {recentTransactions.map((tx) => (
                            <Card key={tx.id} variant="elevated" hover={false} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                        {tx.type === 'CREDIT' ? '↓' : '↑'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 text-sm">{tx.toName || tx.description}</p>
                                        <p className="text-xs text-slate-600">{new Date(tx.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <p className={`font-bold text-lg ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* --- Add Contact Modal --- */}
            <Modal
                isOpen={showAddContact}
                onClose={resetAddContactModal}
                title="Add New Contact"
            >
                <div className="space-y-4">
                    {/* Phone Input - Search first */}
                    <div>
                        <Input
                            label="Phone Number"
                            icon={Phone}
                            type="tel"
                            value={newContactPhone}
                            onChange={(e) => setNewContactPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="e.g., 9876543210"
                            maxLength={10}
                        />
                        {isSearchingUser && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                                <Loader2 size={14} className="animate-spin" />
                                <span>Searching for user...</span>
                            </div>
                        )}
                        {phoneValidated && matchedUser && !isSearchingUser && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                                <CheckCircle size={16} />
                                <span>User found: <strong>{matchedUser.name}</strong></span>
                            </div>
                        )}
                        {newContactPhone.length === 10 && !matchedUser && !isSearchingUser && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
                                <AlertCircle size={16} />
                                <span>This number is not registered. You can still add as a contact.</span>
                            </div>
                        )}
                    </div>

                    {/* Name Input */}
                    <div>
                        <Input
                            label="Name"
                            icon={User}
                            value={newContactName}
                            onChange={(e) => setNewContactName(e.target.value)}
                            placeholder={matchedUser ? matchedUser.name : "e.g., Sharma Uncle"}
                        />
                        
                        {/* Name mismatch warning */}
                        {showNameMismatch && matchedUser && (
                            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-800 mb-2">
                                    <AlertCircle size={14} className="inline mr-1" />
                                    Did you mean <strong>"{matchedUser.name}"</strong>?
                                </p>
                                <p className="text-xs text-amber-600 mb-2">
                                    This is the actual name registered with this phone number.
                                </p>
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={handleUseActualName}
                                    className="text-amber-700 border-amber-300 hover:bg-amber-100"
                                >
                                    Use "{matchedUser.name}"
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Matched user preview */}
                    {matchedUser && !showNameMismatch && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                                {matchedUser.picture ? (
                                    <img src={matchedUser.picture} alt={matchedUser.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-indigo-600 font-bold text-lg">{matchedUser.name?.charAt(0)}</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-slate-800">{matchedUser.name}</p>
                                <p className="text-xs text-slate-500">{matchedUser.email}</p>
                            </div>
                            <CheckCircle size={20} className="text-green-500" />
                        </div>
                    )}

                    <Button 
                        onClick={handleAddContact} 
                        fullWidth 
                        size="lg" 
                        disabled={newContactPhone.length !== 10 || (!newContactName.trim() && !matchedUser)}
                    >
                        {matchedUser ? `Add ${matchedUser.name}` : 'Add Contact'}
                    </Button>
                </div>
            </Modal>

            {/* --- Scratch Card Modal --- */}
            {showScratchCard && streak.pendingReward && (
                <ScratchCard
                    reward={streak.pendingReward}
                    streakDays={streak.currentStreak}
                    onClaim={(reward) => {
                        if (reward.type === 'money') {
                            addMoney(reward.amount);
                        }
                        claimStreakReward(reward);
                        setShowScratchCard(false);
                    }}
                    onClose={() => setShowScratchCard(false)}
                />
            )}
        </div>
    );
};

export default Dashboard;
