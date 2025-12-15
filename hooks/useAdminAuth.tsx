/**
 * Admin Authentication Hook
 *
 * Provides admin authentication state and methods for the platform admin panel.
 * Handles login, logout, session management, and one-time setup.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { PlatformAdmin, AdminPermission } from '../types';
import {
  checkAdminSetupStatus,
  setupFirstAdmin,
  authenticateAdmin,
  getAdmin,
  generateSessionToken,
} from '../services/adminService';

// ============================================
// Types
// ============================================

interface AdminAuthContextType {
  // State
  admin: PlatformAdmin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSetup: boolean;
  error: string | null;

  // Methods
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setupAdmin: (email: string, displayName: string, password: string) => Promise<boolean>;
  checkSetup: () => Promise<void>;
  hasPermission: (permission: AdminPermission) => boolean;
  clearError: () => void;
}

// ============================================
// Constants
// ============================================

const ADMIN_SESSION_KEY = 'renova8_admin_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

// ============================================
// Context
// ============================================

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// ============================================
// Provider Component
// ============================================

interface AdminAuthProviderProps {
  children: ReactNode;
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetup, setIsSetup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if admin platform has been set up
  const checkSetup = useCallback(async () => {
    try {
      const status = await checkAdminSetupStatus();
      setIsSetup(status.isSetup);
    } catch (err) {
      console.error('Error checking setup status:', err);
      setIsSetup(false);
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Check if admin is set up
        await checkSetup();

        // Try to restore session from localStorage
        const sessionData = localStorage.getItem(ADMIN_SESSION_KEY);
        if (sessionData) {
          const session = JSON.parse(sessionData);

          // Check if session is expired
          if (session.expiresAt < Date.now()) {
            localStorage.removeItem(ADMIN_SESSION_KEY);
            setIsLoading(false);
            return;
          }

          // Fetch fresh admin data
          const adminData = await getAdmin(session.adminId);
          if (adminData && adminData.isActive) {
            setAdmin(adminData);
          } else {
            localStorage.removeItem(ADMIN_SESSION_KEY);
          }
        }
      } catch (err) {
        console.error('Error restoring session:', err);
        localStorage.removeItem(ADMIN_SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [checkSetup]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await authenticateAdmin(email, password);

      if (!result.success || !result.admin) {
        setError(result.error || 'Login failed');
        setIsLoading(false);
        return false;
      }

      // Create session
      const session = {
        adminId: result.admin.id,
        token: generateSessionToken(),
        expiresAt: Date.now() + SESSION_DURATION,
        createdAt: Date.now(),
      };

      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      setAdmin(result.admin);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      setIsLoading(false);
      return false;
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setAdmin(null);
  }, []);

  // Setup first admin
  const setupAdmin = useCallback(async (
    email: string,
    displayName: string,
    password: string
  ): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await setupFirstAdmin(email, displayName, password);

      if (!result.success || !result.admin) {
        setError(result.error || 'Setup failed');
        setIsLoading(false);
        return false;
      }

      // Auto-login after setup
      const session = {
        adminId: result.admin.id,
        token: generateSessionToken(),
        expiresAt: Date.now() + SESSION_DURATION,
        createdAt: Date.now(),
      };

      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      setAdmin(result.admin);
      setIsSetup(true);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message || 'Setup failed');
      setIsLoading(false);
      return false;
    }
  }, []);

  // Check permission
  const hasPermission = useCallback((permission: AdminPermission): boolean => {
    if (!admin) return false;
    if (admin.isSuperAdmin) return true;
    return admin.permissions.includes(permission);
  }, [admin]);

  const value: AdminAuthContextType = {
    admin,
    isLoading,
    isAuthenticated: !!admin,
    isSetup,
    error,
    login,
    logout,
    setupAdmin,
    checkSetup,
    hasPermission,
    clearError,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);

  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }

  return context;
}

// ============================================
// Export Types
// ============================================

export type { AdminAuthContextType };
