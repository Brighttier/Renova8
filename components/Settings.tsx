/**
 * Settings Component with Stripe Integration
 *
 * Displays user's credit balance and allows purchasing
 * token packs via Stripe Checkout.
 */

import React, { useState, useEffect } from 'react';
import { useCredits } from '../hooks/useCredits';
import { useAuth } from '../hooks/useAuth';

// Token pack configurations (must match functions/src/config.ts)
const TOKEN_PACKS = [
  {
    id: 'starter',
    name: 'Starter',
    tokens: 5000,
    price: '$4.99',
    priceValue: 4.99,
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    tokens: 25000,
    price: '$19.99',
    priceValue: 19.99,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tokens: 100000,
    price: '$79.99',
    priceValue: 79.99,
    popular: false,
  },
];

interface Props {
  // Legacy props - can be removed once fully migrated
  credits?: number;
  onAddCredits?: (amount: number) => void;
}

export const Settings: React.FC<Props> = ({ credits: legacyCredits, onAddCredits }) => {
  const { user } = useAuth();
  const { credits, transactions, loading, error, purchaseTokens, refreshCredits, clearError, isTrialUser, trialDaysRemaining } = useCredits();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);

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
      const pack = TOKEN_PACKS.find(p => p.id === packId);
      if (pack && onAddCredits) {
        onAddCredits(pack.tokens);
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
                  ? 'Your trial is ending soon! Purchase tokens to continue using all features.'
                  : 'Enjoy your 200 free tokens. Purchase more anytime to unlock unlimited potential.'
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
          <h2 className="text-2xl font-bold mb-1">Current Balance</h2>
          <div className="text-5xl font-bold">
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              displayCredits.toLocaleString()
            )}
            <span className="text-2xl font-medium opacity-80 ml-2">Tokens</span>
          </div>
          <p className="text-white/80 mt-2">
            Use tokens to generate leads, images, videos, and websites.
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

      {/* Top Up Packs */}
      <div id="token-packs">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="bg-green-100 p-2 rounded-lg mr-3 text-2xl">🔋</span>
          Token Top-Ups
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TOKEN_PACKS.map((pack) => (
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
                  BEST VALUE
                </div>
              )}
              <div className="text-gray-500 font-bold uppercase text-xs mb-2">
                {pack.name}
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {pack.tokens.toLocaleString()} Tokens
              </div>
              <div className="text-xl text-[#D4AF37] font-medium mb-4">
                {pack.price}
              </div>
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

      {/* Subscriptions - Coming Soon */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="bg-blue-100 p-2 rounded-lg mr-3 text-2xl">⭐</span>
          Monthly Plans
          <span className="ml-3 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-normal">
            Coming Soon
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
          {/* Free Tier */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 flex flex-col">
            <h4 className="font-bold text-gray-800 text-xl mb-2">Hobbyist</h4>
            <div className="text-4xl font-bold text-gray-800 mb-6">
              $0<span className="text-lg text-gray-400 font-normal">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center text-gray-600 text-sm">
                <span className="text-green-500 mr-2">✓</span> 200 Free Trial Tokens
              </li>
              <li className="flex items-center text-gray-600 text-sm">
                <span className="text-green-500 mr-2">✓</span> Basic Lead Search
              </li>
              <li className="flex items-center text-gray-600 text-sm">
                <span className="text-green-500 mr-2">✓</span> Email Pitches
              </li>
            </ul>
            <button className="w-full py-3 border border-gray-200 rounded-xl font-bold text-gray-500 cursor-not-allowed">
              Current Plan
            </button>
          </div>

          {/* Pro Tier */}
          <div className="bg-white rounded-2xl p-8 border-2 border-[#D4AF37]/30 shadow-xl relative flex flex-col transform md:-translate-y-4">
            <div className="absolute top-0 inset-x-0 bg-[#D4AF37] text-white text-center text-xs font-bold py-1 rounded-t-lg">
              RECOMMENDED
            </div>
            <h4 className="font-bold text-gray-800 text-xl mb-2 mt-2">
              MomPreneur Pro
            </h4>
            <div className="text-4xl font-bold text-gray-800 mb-6">
              $29<span className="text-lg text-gray-400 font-normal">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center text-gray-800 font-medium text-sm">
                <span className="text-green-500 mr-2">✓</span> 50,000 Tokens / month
              </li>
              <li className="flex items-center text-gray-800 font-medium text-sm">
                <span className="text-green-500 mr-2">✓</span> Website Builder Access
              </li>
              <li className="flex items-center text-gray-800 font-medium text-sm">
                <span className="text-green-500 mr-2">✓</span> Image Studio Pro
              </li>
              <li className="flex items-center text-gray-800 font-medium text-sm">
                <span className="text-green-500 mr-2">✓</span> Priority Support
              </li>
            </ul>
            <button className="w-full py-3 bg-gray-200 text-gray-500 rounded-xl font-bold cursor-not-allowed">
              Coming Soon
            </button>
          </div>

          {/* Business Tier */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 flex flex-col">
            <h4 className="font-bold text-gray-800 text-xl mb-2">Agency Elite</h4>
            <div className="text-4xl font-bold text-gray-800 mb-6">
              $99<span className="text-lg text-gray-400 font-normal">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center text-gray-600 text-sm">
                <span className="text-green-500 mr-2">✓</span> 200,000 Tokens / month
              </li>
              <li className="flex items-center text-gray-600 text-sm">
                <span className="text-green-500 mr-2">✓</span> Video Studio Access
              </li>
              <li className="flex items-center text-gray-600 text-sm">
                <span className="text-green-500 mr-2">✓</span> Unlimited Projects
              </li>
              <li className="flex items-center text-gray-600 text-sm">
                <span className="text-green-500 mr-2">✓</span> Whitelabel Invoicing
              </li>
            </ul>
            <button className="w-full py-3 bg-gray-200 text-gray-500 rounded-xl font-bold cursor-not-allowed">
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-gray-400 text-xs pb-8">
        Payments are securely processed via Stripe. You can cancel anytime.
      </div>
    </div>
  );
};
