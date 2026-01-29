import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import Card from '../components/ui/Card';
import { ScanLine, Send, Wallet, Receipt, ChevronRight, QrCode, UserPlus, ShieldAlert, Calculator, CreditCard, User, Phone, Download, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const ActionButton = ({ icon: Icon, label, to, color = "bg-blue-800" }) => (
    <Link to={to} className="flex flex-col items-center gap-2 group">
        <div className={`${color} text-white p-4 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
            <Icon size={32} />
        </div>
        <span className="font-semibold text-slate-900 text-sm">{label}</span>
    </Link>
);

const Dashboard = () => {
    const { balance, contacts, addContact, transactions, refreshWallet, isLoading } = useWallet();
    const [showBalance, setShowBalance] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAddContact, setShowAddContact] = useState(false);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshWallet();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleAddContact = () => {
        if (newContactName.trim() && newContactPhone.trim()) {
            addContact(newContactName.trim(), newContactPhone.trim());
            setNewContactName('');
            setNewContactPhone('');
            setShowAddContact(false);
        }
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

            {/* --- Daily Mission --- */}
            <Card variant="gradient" className="border-l-4 border-l-emerald-600">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">Daily Mission</h3>
                        <p className="text-slate-600 text-sm">Send ₹100 to a contact.</p>
                    </div>
                    <Link to="/send" className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all">
                        Start
                    </Link>
                </div>
            </Card>

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
                onClose={() => setShowAddContact(false)}
                title="Add New Contact"
            >
                <div className="space-y-4">
                    <Input
                        label="Name"
                        icon={User}
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="e.g., Sharma Uncle"
                    />
                    <Input
                        label="Phone Number"
                        icon={Phone}
                        type="tel"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="e.g., 9876543210"
                        maxLength={10}
                    />
                    <Button onClick={handleAddContact} fullWidth size="lg" disabled={!newContactName.trim() || !newContactPhone.trim()}>
                        Add Contact
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default Dashboard;
