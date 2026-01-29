import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
    isSupabaseConfigured,
    getWallet,
    updateWalletBalance,
    updateWalletPin,
    getTransactions,
    addTransactionToDb,
    getContacts,
    addContactToDb,
    transferToUser
} from '../lib/supabase';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
    const { user, dbUser } = useAuth();
    
    // --- State ---
    const [balance, setBalance] = useState(10000);
    const [transactions, setTransactions] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [upiPin, setUpiPinState] = useState(null); // null = not set, string = PIN
    const [isPinSet, setIsPinSet] = useState(false);

    // Default contacts for offline/new users
    const defaultContacts = [
        { id: 1, name: "Raju Milkman", phone: "9876543210" },
        { id: 2, name: "Priya Granddaughter", phone: "9123456780" }
    ];

    // --- Load data from Supabase or localStorage ---
    const loadData = useCallback(async () => {
        setIsLoading(true);

        // If user is logged in and we have a database user ID, fetch from Supabase
        if (dbUser?.id && isSupabaseConfigured()) {
            try {
                // Fetch wallet
                const { wallet, error: walletError } = await getWallet(dbUser.id);
                if (wallet && !walletError) {
                    setBalance(parseFloat(wallet.balance));
                    // Load PIN from wallet
                    if (wallet.upi_pin) {
                        setUpiPinState(wallet.upi_pin);
                        setIsPinSet(true);
                    } else {
                        setUpiPinState(null);
                        setIsPinSet(false);
                    }
                }

                // Fetch transactions
                const { transactions: dbTransactions, error: txError } = await getTransactions(dbUser.id);
                if (dbTransactions && !txError) {
                    setTransactions(dbTransactions);
                }

                // Fetch contacts
                const { contacts: dbContacts, error: contactsError } = await getContacts(dbUser.id);
                if (dbContacts && !contactsError) {
                    setContacts(dbContacts.length > 0 ? dbContacts : defaultContacts);
                }

                console.log('✅ Wallet data loaded from Supabase');
            } catch (error) {
                console.error('Error loading from Supabase, falling back to localStorage:', error);
                loadFromLocalStorage();
            }
        } else {
            // Fallback to localStorage for offline mode or when not logged in
            loadFromLocalStorage();
        }

        setIsLoading(false);
    }, [dbUser?.id]);

    // Load from localStorage (fallback)
    const loadFromLocalStorage = () => {
        const savedBalance = localStorage.getItem('seniorSafe_balance');
        const savedTransactions = localStorage.getItem('seniorSafe_transactions');
        const savedContacts = localStorage.getItem('seniorSafe_contacts');
        const savedPin = localStorage.getItem('seniorSafe_upiPin');

        setBalance(savedBalance ? parseFloat(savedBalance) : 10000);
        setTransactions(savedTransactions ? JSON.parse(savedTransactions) : []);
        setContacts(savedContacts ? JSON.parse(savedContacts) : defaultContacts);
        
        if (savedPin) {
            setUpiPinState(savedPin);
            setIsPinSet(true);
        } else {
            setUpiPinState(null);
            setIsPinSet(false);
        }
        
        console.log('📦 Wallet data loaded from localStorage');
    };

    // --- Effect: Load data when user changes ---
    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- Persist to localStorage (always, as backup) ---
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
    const addTransaction = async (amount, type, description, toName) => {
        const newTx = {
            id: Date.now(),
            amount,
            type,
            description,
            toName,
            date: new Date().toISOString(),
        };

        // Update local state immediately (optimistic update)
        setTransactions(prev => [newTx, ...prev]);

        const newBalance = type === 'DEBIT' 
            ? balance - amount 
            : balance + amount;
        setBalance(newBalance);

        // Sync to Supabase if configured and user is logged in
        if (dbUser?.id && isSupabaseConfigured()) {
            setIsSyncing(true);
            try {
                // Add transaction to database
                await addTransactionToDb(dbUser.id, amount, type, description, toName);
                
                // Update wallet balance
                await updateWalletBalance(dbUser.id, newBalance);
                
                console.log('✅ Transaction synced to Supabase');
            } catch (error) {
                console.error('Error syncing transaction to Supabase:', error);
                // Local state already updated, will sync on next load
            }
            setIsSyncing(false);
        }
    };

    const addContact = async (name, phone) => {
        const newContact = { id: Date.now(), name, phone };
        
        // Update local state immediately
        setContacts(prev => [...prev, newContact]);

        // Sync to Supabase if configured
        if (dbUser?.id && isSupabaseConfigured()) {
            try {
                await addContactToDb(dbUser.id, name, phone);
                console.log('✅ Contact synced to Supabase');
            } catch (error) {
                console.error('Error syncing contact to Supabase:', error);
            }
        }
    };

    // Send money to another registered user (P2P transfer)
    const sendToUser = async (recipientId, recipientName, amount) => {
        if (!dbUser?.id || !isSupabaseConfigured()) {
            return { success: false, error: 'User not logged in or Supabase not configured' };
        }

        // Check sufficient balance
        if (balance < amount) {
            return { success: false, error: 'Insufficient balance' };
        }

        setIsSyncing(true);
        
        try {
            const result = await transferToUser(
                dbUser.id,
                user?.name || 'Unknown',
                recipientId,
                recipientName,
                amount
            );

            if (result.success) {
                // Update local balance immediately
                setBalance(result.senderNewBalance);
                
                // Add transaction to local state
                const newTx = {
                    id: Date.now(),
                    amount,
                    type: 'DEBIT',
                    description: `Sent to ${recipientName}`,
                    toName: recipientName,
                    date: new Date().toISOString(),
                    recipientUserId: recipientId
                };
                setTransactions(prev => [newTx, ...prev]);
                
                console.log('✅ P2P Transfer completed successfully');
            }

            setIsSyncing(false);
            return result;
        } catch (error) {
            console.error('P2P Transfer error:', error);
            setIsSyncing(false);
            return { success: false, error: 'Transfer failed. Please try again.' };
        }
    };

    // Reset wallet (for testing/demo purposes)
    const resetWallet = async () => {
        setBalance(10000);
        setTransactions([]);
        setContacts(defaultContacts);

        // Also reset in Supabase if connected
        if (dbUser?.id && isSupabaseConfigured()) {
            try {
                await updateWalletBalance(dbUser.id, 10000);
                console.log('✅ Wallet reset in Supabase');
            } catch (error) {
                console.error('Error resetting wallet in Supabase:', error);
            }
        }
    };

    // --- PIN Management ---
    const setUpiPin = async (newPin) => {
        setUpiPinState(newPin);
        setIsPinSet(true);
        localStorage.setItem('seniorSafe_upiPin', newPin);

        // Sync to Supabase if configured
        if (dbUser?.id && isSupabaseConfigured()) {
            try {
                await updateWalletPin(dbUser.id, newPin);
                console.log('✅ PIN synced to Supabase');
            } catch (error) {
                console.error('Error syncing PIN to Supabase:', error);
            }
        }
    };

    const verifyPin = (enteredPin) => {
        if (!isPinSet || !upiPin) {
            return true; // No PIN set, allow transaction
        }
        return enteredPin === upiPin;
    };

    const changePin = async (oldPin, newPin) => {
        if (!verifyPin(oldPin)) {
            return { success: false, error: 'Current PIN is incorrect' };
        }
        await setUpiPin(newPin);
        return { success: true };
    };

    return (
        <WalletContext.Provider value={{
            balance,
            transactions,
            contacts,
            addTransaction,
            addContact,
            sendToUser,
            resetWallet,
            notifications,
            setNotifications,
            isLoading,
            isSyncing,
            // PIN related
            isPinSet,
            setUpiPin,
            verifyPin,
            changePin
        }}>
            {children}
        </WalletContext.Provider>
    );
};
