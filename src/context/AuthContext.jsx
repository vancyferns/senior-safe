import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getOrCreateUser, getUserById } from '../lib/supabase';
import { neonAuthClient } from '../lib/neonAuth';

const AuthContext = createContext(null);

const STORAGE_KEY = 'seniorsafe_user';
const DB_USER_KEY = 'seniorsafe_db_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const session = neonAuthClient?.auth.useSession();

  const sessionUser = session?.data?.user ?? null;

  const mapSessionUser = useCallback((currentSessionUser, currentSession) => {
    if (!currentSessionUser) return null;

    return {
      id: currentSessionUser.id,
      name: currentSessionUser.name || currentSessionUser.fullName || currentSessionUser.displayName || '',
      email: currentSessionUser.email || '',
      picture: currentSessionUser.image || currentSessionUser.picture || currentSessionUser.avatarUrl || null,
      givenName: currentSessionUser.firstName || currentSessionUser.givenName || '',
      familyName: currentSessionUser.lastName || currentSessionUser.familyName || '',
      exp: currentSession?.expiresAt ? Math.floor(new Date(currentSession.expiresAt).getTime() / 1000) : undefined,
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const syncSessionUser = async () => {
      if (!neonAuthClient) {
        setUser(null);
        setDbUser(null);
        setIsLoading(false);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(DB_USER_KEY);
        return;
      }

      if (session?.isPending) {
        setIsLoading(true);
        return;
      }

      if (!sessionUser) {
        setUser(null);
        setDbUser(null);
        setIsLoading(false);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(DB_USER_KEY);
        return;
      }

      const mappedUser = mapSessionUser(sessionUser, session.data?.session)

      if (!isActive) return;

      setUser(mappedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedUser));

      try {
        const { user: syncedUser, error } = await getOrCreateUser(mappedUser);
        if (!isActive) return;

        if (syncedUser && !error) {
          setDbUser(syncedUser);
          localStorage.setItem(DB_USER_KEY, JSON.stringify(syncedUser));
          console.log('✅ User synced with Neon REST:', syncedUser.email);
        } else if (error) {
          console.error('Error syncing user with Neon REST:', error);
          const { user: existingUser, error: lookupError } = await getUserById(mappedUser.id);
          if (!isActive) return;

          if (existingUser && !lookupError) {
            setDbUser(existingUser);
            localStorage.setItem(DB_USER_KEY, JSON.stringify(existingUser));
          }
        }
      } catch (syncError) {
        console.error('Neon sync failed:', syncError);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    syncSessionUser();

    return () => {
      isActive = false;
    }
  }, [mapSessionUser, session?.data, session?.isPending, sessionUser]);

  const handleGoogleSuccess = async () => null;

  const logout = async () => {
    try {
      if (neonAuthClient) {
        await neonAuthClient.signOut();
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }

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
  }, [dbUser?.id]);

  const value = {
    user,
    dbUser,
    isAuthenticated: !!sessionUser,
    isLoading: isLoading || !!session?.isPending,
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
