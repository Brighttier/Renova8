import React, { useState, useEffect } from 'react';
import { DnsRecord } from '../types';
import {
  setupCustomDomain,
  checkDomainStatus,
  verifyDomain,
  removeCustomDomain,
} from '../services/publishingService';

interface CustomDomainSetupProps {
  websiteId: string;
  currentDomain?: string;
  currentStatus?: 'pending' | 'verified' | 'active';
  onDomainConfigured?: (domain: string) => void;
  onDomainRemoved?: () => void;
}

export const CustomDomainSetup: React.FC<CustomDomainSetupProps> = ({
  websiteId,
  currentDomain,
  currentStatus,
  onDomainConfigured,
  onDomainRemoved,
}) => {
  const [domain, setDomain] = useState(currentDomain || '');
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'pending' | 'verified' | 'active'>(
    currentStatus || 'idle'
  );
  const [sslStatus, setSslStatus] = useState<'provisioning' | 'active'>('provisioning');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);

  // Check domain status on mount if there's a current domain
  useEffect(() => {
    if (currentDomain && currentStatus === 'pending') {
      handleCheckStatus();
    }
  }, [currentDomain]);

  const handleSetupDomain = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await setupCustomDomain(websiteId, domain.trim());
      setDnsRecords(result.dnsRecords);
      setInstructions(result.instructions);
      setStatus('pending');
      setShowInstructions(true);
      onDomainConfigured?.(domain.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up domain');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await checkDomainStatus(websiteId);
      setStatus(result.status === 'error' ? 'pending' : result.status);
      if (result.sslStatus) {
        setSslStatus(result.sslStatus);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check status');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    setVerifying(true);
    setError(null);

    try {
      const result = await verifyDomain(websiteId);
      setStatus(result.status === 'error' ? 'pending' : result.status);
      if (result.sslStatus) {
        setSslStatus(result.sslStatus);
      }

      if (result.status === 'verified' || result.status === 'active') {
        onDomainConfigured?.(domain);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify domain');
    } finally {
      setVerifying(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!confirm('Are you sure you want to remove this custom domain?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await removeCustomDomain(websiteId);
      setDomain('');
      setDnsRecords([]);
      setInstructions([]);
      setStatus('idle');
      setShowInstructions(false);
      onDomainRemoved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove domain');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, recordId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRecord(recordId);
    setTimeout(() => setCopiedRecord(null), 2000);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Pending DNS Setup
          </span>
        );
      case 'verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified - SSL {sslStatus === 'active' ? 'Active' : 'Provisioning'}
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Active
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Custom Domain</h3>
            <p className="text-sm text-gray-500">Connect your own domain to your website</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {status === 'idle' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter your domain
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="www.example.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button
                onClick={handleSetupDomain}
                disabled={loading || !domain.trim()}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Setting up...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Connect Domain
                  </>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Enter your domain without http:// or https://
            </p>
          </div>
        </div>
      )}

      {status === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{domain || currentDomain}</p>
              <p className="text-xs text-gray-500">Configure DNS records to complete setup</p>
            </div>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              {showInstructions ? 'Hide' : 'Show'} Instructions
              <svg
                className={`w-4 h-4 transform transition-transform ${showInstructions ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {showInstructions && dnsRecords.length > 0 && (
            <div className="mt-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">DNS Records to Add</h4>
                <div className="space-y-3">
                  {dnsRecords.map((record, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg border border-gray-200 p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {record.type}
                        </span>
                        {record.purpose && (
                          <span className="text-xs text-gray-500">{record.purpose}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Name/Host</p>
                          <div className="flex items-center gap-2">
                            <code className="text-gray-900 font-mono">{record.name}</code>
                            <button
                              onClick={() => copyToClipboard(record.name, `name-${index}`)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {copiedRecord === `name-${index}` ? (
                                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Value</p>
                          <div className="flex items-center gap-2">
                            <code className="text-gray-900 font-mono text-xs truncate max-w-[150px]" title={record.value}>
                              {record.value}
                            </code>
                            <button
                              onClick={() => copyToClipboard(record.value, `value-${index}`)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {copiedRecord === `value-${index}` ? (
                                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {instructions.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Setup Instructions</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    {instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleVerifyDomain}
              disabled={verifying}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verify Domain
                </>
              )}
            </button>
            <button
              onClick={handleRemoveDomain}
              disabled={loading}
              className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {(status === 'verified' || status === 'active') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">
                  {domain || currentDomain}
                </p>
                <p className="text-xs text-green-700">
                  {status === 'active'
                    ? 'Custom domain is active with SSL'
                    : 'Domain verified - SSL certificate provisioning'}
                </p>
              </div>
            </div>
            <a
              href={`https://${domain || currentDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <button
            onClick={handleRemoveDomain}
            disabled={loading}
            className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove Custom Domain
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomDomainSetup;
