import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import PropTypes from 'prop-types';
import { getOrCreateUser, isSupabaseConfigured, getUserById } from '../lib/supabase';

const AuthContext = createContext(null);

const STORAGE_KEY = 'seniorsafe_user';
const DB_USER_KEY = 'seniorsafe_db_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null); // Supabase database user
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      const savedDbUser = localStorage.getItem(DB_USER_KEY);
      
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        // Check if token is still valid (not expired)
        if (parsed.exp && parsed.exp * 1000 > Date.now()) {
          setUser(parsed);
          
          // Also restore dbUser if available
          if (savedDbUser) {
            setDbUser(JSON.parse(savedDbUser));
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(DB_USER_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DB_USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle successful Google login
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const userData = {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        givenName: decoded.given_name,
        familyName: decoded.family_name,
        exp: decoded.exp,
      };
      
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

      // Sync with Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          const { user: supabaseUser, error } = await getOrCreateUser(userData);
          if (supabaseUser && !error) {
            setDbUser(supabaseUser);
            localStorage.setItem(DB_USER_KEY, JSON.stringify(supabaseUser));
            console.log('✅ User synced with Supabase:', supabaseUser.email);
          } else if (error) {
            console.error('Error syncing user with Supabase:', error);
          }
        } catch (syncError) {
          console.error('Supabase sync failed:', syncError);
          // Continue without Supabase - app will work in offline mode
        }
      }

      return userData;
    } catch (error) {
      console.error('Error decoding credential:', error);
      return null;
    }
  };

  // Handle logout
  const logout = () => {
    googleLogout();
    setUser(null);
    setDbUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DB_USER_KEY);
  };

  // Refresh user data from database
  const refreshUser = useCallback(async () => {
    if (!dbUser?.id || !isSupabaseConfigured()) return;
    
    try {
      const { user: updatedUser, error } = await getUserById(dbUser.id);
      if (updatedUser && !error) {
        setDbUser(updatedUser);
        localStorage.setItem(DB_USER_KEY, JSON.stringify(updatedUser));
        console.log('✅ User data refreshed');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, [dbUser?.id]);

  const value = {
    user,
    dbUser, // Supabase database user (has the UUID for queries)
    isAuthenticated: !!user,
    isLoading,
    handleGoogleSuccess,
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
