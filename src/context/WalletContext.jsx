import React, { createContext, useContext, useState, useEffect } from 'react';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
    // --- State Initialization (Load from LocalStorage or Defaults) ---
    const [balance, setBalance] = useState(() => {
        const saved = localStorage.getItem('seniorSafe_balance');
        return saved ? parseFloat(saved) : 10000;
    });

    const [transactions, setTransactions] = useState(() => {
        const saved = localStorage.getItem('seniorSafe_transactions');
        return saved ? JSON.parse(saved) : [];
    });

    const [contacts, setContacts] = useState(() => {
        const saved = localStorage.getItem('seniorSafe_contacts');
        return saved ? JSON.parse(saved) : [
            { id: 1, name: "Raju Milkman", phone: "9876543210" },
            { id: 2, name: "Priya Granddaughter", phone: "9123456780" }
        ];
    });

    const [notifications, setNotifications] = useState([]); // For Toasts/Confetti

    // --- Persistence Effects ---
    useEffect(() => {
        localStorage.setItem('seniorSafe_balance', balance.toString());
    }, [balance]);

    useEffect(() => {
        localStorage.setItem('seniorSafe_transactions', JSON.stringify(transactions));
    }, [transactions]);

    useEffect(() => {
        localStorage.setItem('seniorSafe_contacts', JSON.stringify(contacts));
    }, [contacts]);

    // --- Actions ---
    const addTransaction = (amount, type, description, toName) => {
        const newTx = {
            id: Date.now(),
            amount,
            type, // 'DEBIT' or 'CREDIT'
            description,
            toName,
            date: new Date().toISOString(),
        };

        setTransactions(prev => [newTx, ...prev]);

        if (type === 'DEBIT') {
            setBalance(prev => prev - amount);
        } else {
            setBalance(prev => prev + amount);
        }
    };

    const addContact = (name, phone) => {
        const newContact = { id: Date.now(), name, phone };
        setContacts(prev => [...prev, newContact]);
    };

    return (
        <WalletContext.Provider value={{
            balance,
            transactions,
            contacts,
            addTransaction,
            addContact,
            notifications,
            setNotifications
        }}>
            {children}
        </WalletContext.Provider>
    );
};
