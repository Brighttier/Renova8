/**
 * StatusBadge Component
 *
 * A small status indicator for the header showing system health.
 * Displays a colored dot with optional tooltip showing component status.
 */

import React, { useState, useEffect } from 'react';

export type SystemStatus = 'operational' | 'degraded' | 'outage' | 'checking';

interface StatusBadgeProps {
  /** Click handler to navigate to status page */
  onClick?: () => void;
  /** Show label text next to the dot */
  showLabel?: boolean;
}

interface ComponentStatus {
  name: string;
  status: SystemStatus;
  lastChecked: Date;
}

// Status color mapping
const statusColors: Record<SystemStatus, { bg: string; pulse: string; text: string }> = {
  operational: {
    bg: 'bg-green-500',
    pulse: 'bg-green-400',
    text: 'text-green-600',
  },
  degraded: {
    bg: 'bg-yellow-500',
    pulse: 'bg-yellow-400',
    text: 'text-yellow-600',
  },
  outage: {
    bg: 'bg-red-500',
    pulse: 'bg-red-400',
    text: 'text-red-600',
  },
  checking: {
    bg: 'bg-gray-400',
    pulse: 'bg-gray-300',
    text: 'text-gray-500',
  },
};

const statusLabels: Record<SystemStatus, string> = {
  operational: 'All Systems Operational',
  degraded: 'Partial Outage',
  outage: 'Major Outage',
  checking: 'Checking...',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  onClick,
  showLabel = false,
}) => {
  const [overallStatus, setOverallStatus] = useState<SystemStatus>('checking');
  const [componentStatuses, setComponentStatuses] = useState<ComponentStatus[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);

  // Check system status on mount and periodically
  useEffect(() => {
    const checkStatus = async () => {
      // In a real app, this would call an API to check system health
      // For now, simulate operational status after a brief check
      setOverallStatus('checking');

      // Simulate status check delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock component statuses - in production, these would come from an API
      const statuses: ComponentStatus[] = [
        { name: 'Web App', status: 'operational', lastChecked: new Date() },
        { name: 'API Services', status: 'operational', lastChecked: new Date() },
        { name: 'AI Generation', status: 'operational', lastChecked: new Date() },
        { name: 'Database', status: 'operational', lastChecked: new Date() },
      ];

      setComponentStatuses(statuses);

      // Calculate overall status
      const hasOutage = statuses.some(s => s.status === 'outage');
      const hasDegraded = statuses.some(s => s.status === 'degraded');

      if (hasOutage) {
        setOverallStatus('outage');
      } else if (hasDegraded) {
        setOverallStatus('degraded');
      } else {
        setOverallStatus('operational');
      }
    };

    checkStatus();

    // Re-check every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const colors = statusColors[overallStatus];
  const label = statusLabels[overallStatus];

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[#F9F6F0] transition-colors"
        aria-label={`System status: ${label}`}
      >
        {/* Status dot with pulse animation for operational */}
        <span className="relative flex h-2.5 w-2.5">
          {overallStatus === 'operational' && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.pulse} opacity-75`} />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors.bg}`} />
        </span>

        {showLabel && (
          <span className={`text-xs font-medium ${colors.text}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {overallStatus === 'operational' ? 'Operational' : label}
          </span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-[#EFEBE4] p-4 z-50">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#EFEBE4]">
            <span className={`flex h-3 w-3 rounded-full ${colors.bg}`} />
            <span className="font-semibold text-[#4A4A4A] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {label}
            </span>
          </div>

          <div className="space-y-2">
            {componentStatuses.map((component) => (
              <div key={component.name} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{component.name}</span>
                <span className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${statusColors[component.status].bg}`} />
                  <span className={statusColors[component.status].text}>
                    {component.status === 'operational' ? 'OK' : component.status}
                  </span>
                </span>
              </div>
            ))}
          </div>

          {onClick && (
            <button
              onClick={onClick}
              className="mt-3 w-full text-center text-xs text-[#D4AF37] hover:text-[#B8962E] font-semibold"
            >
              View Status Page →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusBadge;
