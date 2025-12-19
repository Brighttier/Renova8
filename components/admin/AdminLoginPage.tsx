/**
 * Admin Login Page Component
 *
 * Handles both:
 * 1. First-time setup (creating the super admin)
 * 2. Regular admin login
 */

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';

// Icons
const ShieldIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
}

export function AdminLoginPage({ onLoginSuccess }: AdminLoginPageProps) {
  const { isSetup, isLoading, error, login, setupAdmin, clearError, checkSetup } = useAdminAuth();

  // Form state
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check setup status on mount
  useEffect(() => {
    checkSetup();
  }, [checkSetup]);

  // Auto-switch to setup mode if not set up
  useEffect(() => {
    if (!isLoading && !isSetup) {
      setMode('setup');
    }
  }, [isSetup, isLoading]);

  // Validate form
  const validateForm = (): boolean => {
    setFormError(null);

    if (!email.trim()) {
      setFormError('Email is required');
      return false;
    }

    if (!email.includes('@')) {
      setFormError('Please enter a valid email');
      return false;
    }

    if (!password) {
      setFormError('Password is required');
      return false;
    }

    if (mode === 'setup') {
      if (!displayName.trim()) {
        setFormError('Display name is required');
        return false;
      }

      if (password.length < 8) {
        setFormError('Password must be at least 8 characters');
        return false;
      }

      if (password !== confirmPassword) {
        setFormError('Passwords do not match');
        return false;
      }

      // Check password strength
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        setFormError('Password must contain uppercase, lowercase, and numbers');
        return false;
      }
    }

    return true;
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const success = await login(email, password);
      if (success) {
        onLoginSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle setup
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const success = await setupAdmin(email, displayName, password);
      if (success) {
        onLoginSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength: 1, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 4) return { strength: 2, label: 'Medium', color: 'bg-yellow-500' };
    return { strength: 3, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ShieldIcon />
          </div>
          <p className="text-white/70">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#D4AF37]/20">
            <span className="text-white">
              <ShieldIcon />
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white mb-2">
            RenovateMySite Admin
          </h1>
          <p className="text-white/60 text-sm">
            {mode === 'setup' ? 'Set up your platform administrator account' : 'Sign in to access the admin dashboard'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Mode Toggle (only show if already set up) */}
          {isSetup && (
            <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
              <button
                type="button"
                onClick={() => { setMode('login'); clearError(); setFormError(null); }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  mode === 'login'
                    ? 'bg-[#D4AF37] text-white shadow-lg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Login
              </button>
            </div>
          )}

          {/* Setup Banner */}
          {mode === 'setup' && !isSetup && (
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-[#D4AF37] mt-0.5">
                  <CheckCircleIcon />
                </span>
                <div>
                  <p className="text-[#D4AF37] font-medium text-sm">First-Time Setup</p>
                  <p className="text-white/60 text-xs mt-1">
                    Create your super admin account. This is a one-time setup process that cannot be repeated.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {(error || formError) && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm">{error || formError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={mode === 'setup' ? handleSetup : handleLogin} className="space-y-5">
            {/* Display Name (Setup only) */}
            {mode === 'setup' && (
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Admin"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'setup' ? 'Create a strong password' : 'Enter your password'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {/* Password Strength (Setup only) */}
              {mode === 'setup' && password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          level <= passwordStrength.strength ? passwordStrength.color : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    passwordStrength.strength === 1 ? 'text-red-400' :
                    passwordStrength.strength === 2 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {passwordStrength.label} password
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password (Setup only) */}
            {mode === 'setup' && (
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8963A] text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg hover:shadow-[#D4AF37]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <SpinnerIcon />
                  {mode === 'setup' ? 'Creating Admin Account...' : 'Signing in...'}
                </>
              ) : (
                mode === 'setup' ? 'Create Super Admin Account' : 'Sign In to Admin Panel'
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/40 text-xs text-center">
              {mode === 'setup' ? (
                'This action will create the platform super admin with full access to all systems.'
              ) : (
                'This is a restricted area. Unauthorized access attempts will be logged.'
              )}
            </p>
          </div>
        </div>

        {/* Back to Main App Link */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-white/50 hover:text-white/70 text-sm transition-colors"
          >
            ← Back to RenovateMySite Platform
          </a>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
