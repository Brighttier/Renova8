/**
 * Settings Component with Stripe Integration
 *
 * Displays user's credit balance and allows purchasing
 * token packs via Stripe Checkout.
 */

import React, { useState, useEffect } from 'react';
import { useCredits } from '../hooks/useCredits';
import { useAuth } from '../hooks/useAuth';
import { HelpTooltip } from './HelpTooltip';
import { exportUserData, deleteUserAccount } from '../lib/firebase';

// Credit pack configurations (must match functions/src/config.ts)
const CREDIT_PACKS = [
  {
    id: 'beginner',
    name: 'Beginner Pack',
    credits: 1000,
    price: '$20',
    priceValue: 20.00,
    popular: false,
    description: '1,000 Credits + 1-3 Static Sites',
    hosting: 3,
    type: 'one-time',
  },
  {
    id: 'topup_1000',
    name: 'Credit Top-up',
    credits: 1000,
    price: '$20',
    priceValue: 20.00,
    popular: true,
    description: 'Quick credit refill',
    hosting: 0,
    type: 'one-time',
  },
];

// Subscription plans
const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free Trial',
    price: '$0',
    period: '',
    features: [
      '100 Free Trial Credits',
      'Basic Lead Search',
      'Email Pitches',
      '14-day trial period',
    ],
    isCurrent: true,
  },
  {
    id: 'beginner',
    name: 'Beginner',
    price: '$20',
    period: 'one-time',
    features: [
      '1,000 Credits',
      '1-3 Static Site Hosting',
      'All AI Features',
      'Self-Service Maintenance',
    ],
    popular: true,
  },
  {
    id: 'agency50',
    name: 'Agency 50',
    price: '$199',
    period: '/month',
    features: [
      '5,000 Credits/month',
      'Up to 50 Static Sites',
      'Dynamic Hosting Available',
      'Priority Support',
    ],
  },
];

// Credit usage costs for reference
const CREDIT_COSTS = [
  { action: 'Lead Discovery', credits: 10 },
  { action: 'Brand Analysis', credits: 5 },
  { action: 'Visual Pitch', credits: 75 },
  { action: 'Site Build', credits: 125 },
  { action: 'Site Edit', credits: 10 },
  { action: 'Email Pitch', credits: 3 },
];

interface Props {
  // Legacy props - can be removed once fully migrated
  credits?: number;
  onAddCredits?: (amount: number) => void;
}

export const Settings: React.FC<Props> = ({ credits: legacyCredits, onAddCredits }) => {
  const { user } = useAuth();
  const {
    credits,
    transactions,
    loading,
    error,
    purchaseTokens,
    refreshCredits,
    clearError,
    isTrialUser,
    trialDaysRemaining,
    currentPlan,
    subscriptionStatus,
    hostingSlots,
    hostingSlotsUsed,
  } = useCredits();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);

  // GDPR states
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [gdprError, setGdprError] = useState<string | null>(null);
  const [gdprSuccess, setGdprSuccess] = useState<string | null>(null);

  // Check for checkout result in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutResult = params.get('checkout');

    if (checkoutResult === 'success') {
      // Refresh credits after successful purchase
      refreshCredits();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (checkoutResult === 'canceled') {
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refreshCredits]);

  // Use Firebase credits if available, otherwise fall back to legacy
  const displayCredits = user ? credits : (legacyCredits ?? 0);

  const handlePurchase = async (packId: string) => {
    if (!user) {
      // Fall back to legacy behavior if not logged in
      const pack = CREDIT_PACKS.find(p => p.id === packId);
      if (pack && onAddCredits) {
        onAddCredits(pack.credits);
      }
      return;
    }

    setPurchasing(packId);
    clearError();

    try {
      await purchaseTokens(packId);
      // User will be redirected to Stripe Checkout
    } catch (err: any) {
      console.error('Purchase failed:', err);
    } finally {
      setPurchasing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'INITIAL_GRANT':
        return '🎁';
      case 'PURCHASE_TOP_UP':
        return '💳';
      case 'USAGE_DEBIT':
        return '⚡';
      case 'MANUAL_ADJUSTMENT':
        return '🔧';
      default:
        return '📝';
    }
  };

  // GDPR: Export user data
  const handleExportData = async () => {
    if (!user) return;

    setExporting(true);
    setGdprError(null);
    setGdprSuccess(null);

    try {
      const result = await exportUserData();
      const data = result.data;

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `renovatemysite-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setGdprSuccess('Your data has been exported and downloaded successfully.');
    } catch (err: any) {
      console.error('Export failed:', err);
      setGdprError(err.message || 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // GDPR: Delete account
  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== 'DELETE MY ACCOUNT') return;

    setDeleting(true);
    setGdprError(null);

    try {
      await deleteUserAccount({ confirmPhrase: 'DELETE MY ACCOUNT' });
      // User will be logged out automatically when auth account is deleted
      // Redirect to landing page
      window.location.href = '/';
    } catch (err: any) {
      console.error('Delete failed:', err);
      setGdprError(err.message || 'Failed to delete account. Please contact support.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-800 font-serif">Account & Billing</h1>
        <p className="text-gray-500">Manage your subscription and credit balance.</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-500 hover:text-red-700">
            ✕
          </button>
        </div>
      )}

      {/* Trial Banner */}
      {isTrialUser && trialDaysRemaining !== undefined && (
        <div className={`rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 ${
          trialDaysRemaining <= 3
            ? 'bg-red-50 border border-red-200'
            : trialDaysRemaining <= 7
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`text-4xl ${trialDaysRemaining <= 3 ? 'animate-pulse' : ''}`}>
              {trialDaysRemaining <= 3 ? '⚠️' : '🎉'}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${
                trialDaysRemaining <= 3 ? 'text-red-800' : 'text-gray-800'
              }`}>
                {trialDaysRemaining === 0
                  ? 'Trial Expiring Today!'
                  : `Free Trial: ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} remaining`
                }
              </h3>
              <p className={`text-sm ${
                trialDaysRemaining <= 3 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trialDaysRemaining <= 3
                  ? 'Your trial is ending soon! Purchase credits to continue using all features.'
                  : 'Enjoy your 100 free credits. Purchase more anytime to unlock unlimited potential.'
                }
              </p>
            </div>
          </div>
          <a
            href="#token-packs"
            className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-colors ${
              trialDaysRemaining <= 3
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-[#D4AF37] text-white hover:bg-[#B8963A]'
            }`}
          >
            Upgrade Now
          </a>
        </div>
      )}

      {/* Credit Balance */}
      <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8963A] rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
            Current Balance
            <HelpTooltip featureId="credit-system" size="sm" />
          </h2>
          <div className="text-5xl font-bold">
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              displayCredits.toLocaleString()
            )}
            <span className="text-2xl font-medium opacity-80 ml-2">Credits</span>
          </div>
          <p className="text-white/80 mt-2">
            Use credits to generate leads, images, videos, and websites.
          </p>
        </div>
        <button
          onClick={() => setShowTransactions(!showTransactions)}
          className="bg-white/20 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/30 transition-all whitespace-nowrap backdrop-blur-sm"
        >
          {showTransactions ? 'Hide History' : 'View History'}
        </button>
      </div>

      {/* Transaction History */}
      {showTransactions && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Transaction History</h3>
            <button
              onClick={() => refreshCredits()}
              className="text-sm text-[#D4AF37] hover:underline"
            >
              Refresh
            </button>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No transactions yet
              </div>
            ) : (
              transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getTransactionIcon(txn.type)}</span>
                    <div>
                      <div className="font-medium text-gray-800">
                        {txn.description || txn.type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(txn.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-bold ${
                      txn.tokens > 0 ? 'text-green-600' : 'text-gray-600'
                    }`}
                  >
                    {txn.tokens > 0 ? '+' : ''}
                    {txn.tokens.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Current Plan Badge */}
      {currentPlan !== 'free' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{currentPlan === 'beginner' ? '🚀' : '⭐'}</span>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  {currentPlan === 'beginner' ? 'Beginner Pack' : 'Agency 50'}
                </h3>
                <p className="text-gray-500 text-sm">
                  {currentPlan === 'beginner' ? 'One-time purchase' : 'Monthly subscription'}
                </p>
              </div>
            </div>
            {subscriptionStatus === 'active' && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                Active
              </span>
            )}
          </div>
        </div>
      )}

      {/* Hosting Slots - Only show if user has hosting */}
      {hostingSlots > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">🌐</span>
            Website Hosting
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800">
                {hostingSlotsUsed} / {hostingSlots}
              </div>
              <p className="text-gray-500 text-sm">Sites Published</p>
            </div>
            <div className="w-24 h-24">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="3"
                  strokeDasharray={`${hostingSlots > 0 ? (hostingSlotsUsed / hostingSlots) * 100 : 0}, 100`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Credit Top-Ups */}
      <div id="token-packs">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="bg-green-100 p-2 rounded-lg mr-3 text-2xl">🔋</span>
          Credit Top-Ups
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`bg-white rounded-2xl p-6 border ${
                pack.popular
                  ? 'border-[#D4AF37] shadow-md ring-1 ring-[#D4AF37]/20'
                  : 'border-gray-200'
              } relative`}
            >
              {pack.popular && (
                <div className="absolute top-0 right-0 bg-[#D4AF37] text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                  QUICK REFILL
                </div>
              )}
              <div className="text-gray-500 font-bold uppercase text-xs mb-2">
                {pack.name}
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {pack.credits.toLocaleString()} Credits
              </div>
              <div className="text-xl text-[#D4AF37] font-medium mb-2">
                {pack.price}
              </div>
              <p className="text-gray-500 text-sm mb-4">{pack.description}</p>
              {pack.hosting > 0 && (
                <p className="text-green-600 text-sm mb-4 flex items-center">
                  <span className="mr-1">🌐</span> +{pack.hosting} hosting slots
                </p>
              )}
              <button
                onClick={() => handlePurchase(pack.id)}
                disabled={purchasing === pack.id}
                className={`w-full py-3 rounded-xl font-bold transition-colors ${
                  pack.popular
                    ? 'bg-[#D4AF37] text-white hover:bg-[#B8963A]'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {purchasing === pack.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Buy Now'
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Plans */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="bg-blue-100 p-2 rounded-lg mr-3 text-2xl">⭐</span>
          Plans
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Trial */}
          <div className={`bg-white rounded-2xl p-8 border flex flex-col ${
            currentPlan === 'free' ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/20' : 'border-gray-200'
          }`}>
            <h4 className="font-bold text-gray-800 text-xl mb-2">Free Trial</h4>
            <div className="text-4xl font-bold text-gray-800 mb-6">
              $0
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center text-gray-600 text-sm">
                <span className="text-green-500 mr-2">✓</span> 100 Free Trial Credits
              </li>
              <li className="flex items-center text-gray-600 text-sm">
                <span className="text-green-500 mr-2">✓</span> Basic Lead Search
              </li>
              <li className="flex items-center text-gray-600 text-sm">
                <span className="text-green-500 mr-2">✓</span> Email Pitches
              </li>
              <li className="flex items-center text-gray-600 text-sm">
                <span className="text-green-500 mr-2">✓</span> 14-day trial period
              </li>
            </ul>
            {currentPlan === 'free' ? (
              <button className="w-full py-3 border border-[#D4AF37] text-[#D4AF37] rounded-xl font-bold cursor-default">
                Current Plan
              </button>
            ) : (
              <button className="w-full py-3 border border-gray-200 rounded-xl font-bold text-gray-400 cursor-not-allowed">
                Trial Used
              </button>
            )}
          </div>

          {/* Beginner Pack */}
          <div className={`bg-white rounded-2xl p-8 border-2 shadow-xl relative flex flex-col transform md:-translate-y-4 ${
            currentPlan === 'beginner' ? 'border-[#D4AF37]' : 'border-[#D4AF37]/30'
          }`}>
            <div className="absolute top-0 inset-x-0 bg-[#D4AF37] text-white text-center text-xs font-bold py-1 rounded-t-lg">
              {currentPlan === 'beginner' ? 'YOUR PLAN' : 'RECOMMENDED'}
            </div>
            <h4 className="font-bold text-gray-800 text-xl mb-2 mt-2">
              Beginner Pack
            </h4>
            <div className="text-4xl font-bold text-gray-800 mb-2">
              $20<span className="text-lg text-gray-400 font-normal"> one-time</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center text-gray-800 font-medium text-sm">
                <span className="text-green-500 mr-2">✓</span> 1,000 Credits
              </li>
              <li className="flex items-center text-gray-800 font-medium text-sm">
                <span className="text-green-500 mr-2">✓</span> 1-3 Static Site Hosting
              </li>
              <li className="flex items-center text-gray-800 font-medium text-sm">
                <span className="text-green-500 mr-2">✓</span> All AI Features
              </li>
              <li className="flex items-center text-gray-800 font-medium text-sm">
                <span className="text-green-500 mr-2">✓</span> Self-Service Maintenance
              </li>
            </ul>
            {currentPlan === 'beginner' ? (
              <button className="w-full py-3 bg-[#D4AF37]/20 text-[#D4AF37] rounded-xl font-bold cursor-default">
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => handlePurchase('beginner')}
                disabled={purchasing === 'beginner'}
                className="w-full py-3 bg-[#D4AF37] text-white rounded-xl font-bold hover:bg-[#B8963A] transition-colors disabled:opacity-50"
              >
                {purchasing === 'beginner' ? 'Processing...' : 'Buy Now'}
              </button>
            )}
          </div>

          {/* Agency 50 */}
          <div className={`bg-white rounded-2xl p-8 border flex flex-col ${
            currentPlan === 'agency50' ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/20' : 'border-gray-200'
          }`}>
            <h4 className="font-bold text-gray-800 text-xl mb-2">Agency 50</h4>
            <div className="text-4xl font-bold text-gray-800 mb-2">
              $199<span className="text-lg text-gray-400 font-normal">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center text-gray-600 text-sm">
                <span className="text-green-500 mr-2">✓</span> 5,000 Credits / month
              </li>
              <li className="flex items-center text-gray-600 text-sm">
                <span className="text-green-500 mr-2">✓</span> Up to 50 Static Sites
              </li>
              <li className="flex items-center text-gray-600 text-sm">
                <span className="text-green-500 mr-2">✓</span> Dynamic Hosting Available
              </li>
              <li className="flex items-center text-gray-600 text-sm">
                <span className="text-green-500 mr-2">✓</span> Priority Support
              </li>
            </ul>
            {currentPlan === 'agency50' ? (
              <button className="w-full py-3 bg-[#D4AF37]/20 text-[#D4AF37] rounded-xl font-bold cursor-default">
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => handlePurchase('agency50')}
                disabled={purchasing === 'agency50'}
                className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {purchasing === 'agency50' ? 'Processing...' : 'Subscribe'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Credit Usage Guide */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-xl mr-2">📊</span>
          Credit Usage Guide
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {CREDIT_COSTS.map((item) => (
            <div key={item.action} className="flex justify-between items-center bg-white rounded-lg px-3 py-2">
              <span className="text-gray-600">{item.action}</span>
              <span className="font-bold text-gray-800">{item.credits} credits</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-gray-400 text-xs pb-8">
        Payments are securely processed via Stripe. You can cancel anytime.
      </div>

      {/* Data Privacy Section (GDPR) */}
      {user && (
        <>
          <hr className="border-gray-100" />

          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="bg-purple-100 p-2 rounded-lg mr-3 text-2xl">🔒</span>
              Data Privacy
            </h3>

            {/* Success/Error Messages */}
            {gdprSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
                <span>{gdprSuccess}</span>
                <button onClick={() => setGdprSuccess(null)} className="text-green-500 hover:text-green-700">
                  ✕
                </button>
              </div>
            )}
            {gdprError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
                <span>{gdprError}</span>
                <button onClick={() => setGdprError(null)} className="text-red-500 hover:text-red-700">
                  ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Data */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">📥</span>
                  <h4 className="font-bold text-gray-800">Export Your Data</h4>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  Download a copy of all your data including profile, transactions, websites, and CRM customers.
                </p>
                <button
                  onClick={handleExportData}
                  disabled={exporting}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {exporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    'Download My Data'
                  )}
                </button>
              </div>

              {/* Delete Account */}
              <div className="bg-white rounded-2xl p-6 border border-red-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">⚠️</span>
                  <h4 className="font-bold text-red-600">Delete Account</h4>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors border border-red-200"
                >
                  Delete My Account
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center mb-6">
              <span className="text-5xl">⚠️</span>
              <h3 className="text-xl font-bold text-red-600 mt-4">Delete Your Account?</h3>
              <p className="text-gray-500 text-sm mt-2">
                This will permanently delete all your data including:
              </p>
              <ul className="text-left text-gray-600 text-sm mt-4 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✕</span> Your profile and settings
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✕</span> All published websites
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✕</span> Transaction history
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✕</span> CRM customers and communications
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✕</span> Support tickets
                </li>
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold text-red-600">DELETE MY ACCOUNT</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE MY ACCOUNT' || deleting}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Forever'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
