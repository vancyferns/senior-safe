import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import Card from '../components/ui/Card';
import { ScanLine, Send, Wallet, Receipt, ChevronRight, QrCode, UserPlus, ShieldAlert, Calculator, CreditCard, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

const ActionButton = ({ icon: Icon, label, to, color = "bg-brand-blue" }) => (
    <Link to={to} className="flex flex-col items-center gap-2 group">
        <div className={`${color} text-white p-4 rounded-2xl shadow-md group-hover:scale-105 transition-transform`}>
            <Icon size={32} />
        </div>
        <span className="font-semibold text-slate-700 text-sm">{label}</span>
    </Link>
);

const Dashboard = () => {
    const { balance, contacts, addContact, transactions } = useWallet();
    const [showBalance, setShowBalance] = useState(false);
    const [showAddContact, setShowAddContact] = useState(false);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');

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
            <div className="bg-gradient-to-r from-brand-blue to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <h2 className="text-lg opacity-90 mb-1">Total Balance</h2>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold">
                        {showBalance ? `₹${balance.toLocaleString()}` : "₹ •••••"}
                    </span>
                    <button
                        onClick={() => setShowBalance(!showBalance)}
                        className="text-sm bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors mb-1"
                    >
                        {showBalance ? "Hide" : "Show"}
                    </button>
                </div>
                <p className="text-xs mt-4 opacity-75">Secure Environment • Demo Money</p>
            </div>

            {/* --- Quick Actions --- */}
            <div className="grid grid-cols-4 gap-2">
                <ActionButton to="/scan" icon={ScanLine} label="Scan QR" />
                <ActionButton to="/send" icon={Send} label="To Contact" />
                <ActionButton to="/receive" icon={Download} label="Receive" color="bg-brand-green" />
                <ActionButton to="/history" icon={Receipt} label="History" color="bg-indigo-500" />
            </div>

            {/* --- More Features --- */}
            <div className="grid grid-cols-4 gap-2">
                <ActionButton to="/voucher" icon={QrCode} label="P2P Cash" color="bg-amber-500" />
                <ActionButton to="/scam-lab" icon={ShieldAlert} label="Scam Lab" color="bg-red-500" />
                <ActionButton to="/loan-center" icon={Calculator} label="Loans" color="bg-purple-500" />
                <ActionButton to="/bills" icon={CreditCard} label="Bills" color="bg-teal-500" />
            </div>

            {/* --- Daily Mission --- */}
            <Card className="border-l-4 border-l-brand-green">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800">Daily Mission</h3>
                        <p className="text-slate-600 text-sm">Send ₹100 to a contact.</p>
                    </div>
                    <Link to="/send" className="bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors">
                        Start
                    </Link>
                </div>
            </Card>

            {/* --- Contacts / People --- */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800 text-lg">People</h3>
                    <button
                        onClick={() => setShowAddContact(true)}
                        className="text-brand-blue text-sm font-semibold flex items-center gap-1 hover:underline"
                    >
                        <UserPlus size={16} /> Add
                    </button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {contacts.map((contact) => (
                        <Link
                            key={contact.id}
                            to="/send"
                            className="flex flex-col items-center min-w-[70px] group"
                        >
                            <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg mb-1 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                {contact.name.charAt(0)}
                            </div>
                            <span className="text-xs text-slate-600 truncate w-16 text-center">
                                {contact.name.split(' ')[0]}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* --- Recent Activity --- */}
            {recentTransactions.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-800 text-lg">Recent Activity</h3>
                        <Link to="/history" className="text-brand-blue text-sm font-semibold hover:underline">
                            See All
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {recentTransactions.map((tx) => (
                            <div key={tx.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">{tx.toName || tx.description}</p>
                                    <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</p>
                                </div>
                                <p className={`font-bold ${tx.type === 'CREDIT' ? 'text-brand-green' : 'text-red-500'}`}>
                                    {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                                </p>
                            </div>
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
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Name</label>
                        <input
                            type="text"
                            value={newContactName}
                            onChange={(e) => setNewContactName(e.target.value)}
                            placeholder="e.g., Sharma Uncle"
                            className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-brand-blue outline-none text-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            value={newContactPhone}
                            onChange={(e) => setNewContactPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="e.g., 9876543210"
                            className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-brand-blue outline-none text-lg"
                            maxLength={10}
                        />
                    </div>
                    <Button onClick={handleAddContact} fullWidth size="lg" disabled={!newContactName.trim() || !newContactPhone.trim()}>
                        Add Contact
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default Dashboard;
