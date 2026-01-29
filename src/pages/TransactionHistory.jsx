import React from 'react';
import { useWallet } from '../context/WalletContext';
import { ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react';

const TransactionHistory = () => {
    const { transactions } = useWallet();

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Transaction History</h2>

            {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Clock size={40} className="text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium">No transactions yet</p>
                    <p className="text-sm text-slate-400 mt-1">
                        Your payment history will appear here
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {transactions.map((tx) => (
                        <div
                            key={tx.id}
                            className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4"
                        >
                            {/* Icon */}
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${tx.type === 'CREDIT'
                                        ? 'bg-green-100 text-brand-green'
                                        : 'bg-red-100 text-red-500'
                                    }`}
                            >
                                {tx.type === 'CREDIT' ? (
                                    <ArrowDownLeft size={24} strokeWidth={2.5} />
                                ) : (
                                    <ArrowUpRight size={24} strokeWidth={2.5} />
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 truncate">
                                    {tx.toName || tx.description}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {formatDate(tx.date)}
                                </p>
                            </div>

                            {/* Amount */}
                            <div
                                className={`text-right font-bold text-lg ${tx.type === 'CREDIT' ? 'text-brand-green' : 'text-red-500'
                                    }`}
                            >
                                {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TransactionHistory;
