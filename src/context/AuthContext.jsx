import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getUserById, signUpLocal as apiSignUpLocal, signInLocal as apiSignInLocal } from '../lib/supabase';

const AuthContext = createContext(null);

const STORAGE_KEY = 'seniorsafe_user';
const DB_USER_KEY = 'seniorsafe_db_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapSessionUser = useCallback((currentSessionUser) => {
    if (!currentSessionUser) return null;

    return {
      id: currentSessionUser.id,
      name: currentSessionUser.name || '',
      email: currentSessionUser.email || '',
      picture: currentSessionUser.picture || null,
      phone: currentSessionUser.phone || '',
    };
  }, []);

  // Try to restore user from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedDb = localStorage.getItem(DB_USER_KEY);
      if (stored) setUser(JSON.parse(stored));
      if (storedDb) setDbUser(JSON.parse(storedDb));
    } catch (e) {
      console.error('Failed to restore user from localStorage:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Local signup (name + email or phone)
  const signUpLocal = useCallback(async ({ name, email, phone }) => {
    try {
      const { user: createdUser, error } = await apiSignUpLocal({ name, email, phone });
      if (error || !createdUser) {
        throw error || new Error('Signup failed');
      }

      const mapped = mapSessionUser(createdUser);
      setUser(mapped);
      setDbUser(createdUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
      localStorage.setItem(DB_USER_KEY, JSON.stringify(createdUser));
      return createdUser;
    } catch (err) {
      console.error('Signup failed:', err);
      throw err;
    }
  }, [mapSessionUser]);

  // Local sign-in by email or phone
  const signInLocal = useCallback(async ({ email, phone }) => {
    try {
      const { user: foundUser, error } = await apiSignInLocal({ email, phone });
      if (error || !foundUser) {
        throw error || new Error('Signin failed');
      }

      const mapped = mapSessionUser(foundUser);
      setUser(mapped);
      setDbUser(foundUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
      localStorage.setItem(DB_USER_KEY, JSON.stringify(foundUser));
      return foundUser;
    } catch (err) {
      console.error('Signin failed:', err);
      throw err;
    }
  }, [mapSessionUser]);

  const logout = async () => {
    setUser(null);
    setDbUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DB_USER_KEY);
  };

  const refreshUser = useCallback(async () => {
    const currentUserId = dbUser?.id || user?.id;
    if (!currentUserId) return;
    
    try {
      const { user: updatedUser, error } = await getUserById(currentUserId);
      if (updatedUser && !error) {
        setDbUser(updatedUser);
        localStorage.setItem(DB_USER_KEY, JSON.stringify(updatedUser));
        console.log('✅ User data refreshed');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, [dbUser?.id, user?.id]);

  const value = {
    user,
    dbUser,
    isAuthenticated: !!user,
    isLoading,
    signUpLocal,
    signInLocal,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
