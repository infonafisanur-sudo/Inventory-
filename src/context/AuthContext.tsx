import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole } from '../types';
import { dbService } from '../services/db';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password_raw: string) => Promise<void>;
  signUp: (email: string, password_raw: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  demoSwitchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await dbService.getCurrentUser();
      setUser(currentUser);
    } catch (err: any) {
      console.error('Error fetching current user:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = useCallback(async (email: string, password_raw: string) => {
    try {
      setLoading(true);
      const loggedInUser = await dbService.login(email, password_raw);
      setUser(loggedInUser);
      toast(`Welcome back, ${loggedInUser.name}! Logged in as ${loggedInUser.role}`, 'success');
    } catch (err: any) {
      toast(err.message || 'Login failed', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signUp = useCallback(async (email: string, password_raw: string, name: string) => {
    try {
      setLoading(true);
      const registeredUser = await dbService.signUp(email, password_raw, name);
      setUser(registeredUser);
      toast(`Registration successful! Account created for ${name}`, 'success');
    } catch (err: any) {
      toast(err.message || 'Registration failed', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await dbService.logout();
      setUser(null);
      toast('Logged out successfully', 'info');
    } catch (err: any) {
      toast('Logout failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refreshProfile = useCallback(async () => {
    try {
      const currentUser = await dbService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  }, []);

  // Demo helper: allows rapid client-side switching of dashboard views in preview mode
  const demoSwitchRole = useCallback((newRole: UserRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    toast(`Switched role to ${newRole} (Sandbox Demo)`, 'info');
  }, [user, toast]);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    signUp,
    logout,
    refreshProfile,
    demoSwitchRole
  }), [user, loading, login, signUp, logout, refreshProfile, demoSwitchRole]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
