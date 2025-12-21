/**
 * StatusPage Component
 *
 * System status dashboard showing the health of all platform components.
 * Displays current status, historical incidents, and uptime metrics.
 */

import React, { useState, useEffect } from 'react';

export type ComponentStatus = 'operational' | 'degraded' | 'outage' | 'maintenance';

interface SystemComponent {
  id: string;
  name: string;
  description: string;
  status: ComponentStatus;
  lastChecked: Date;
  uptime: number; // Percentage over last 30 days
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  affectedComponents: string[];
  createdAt: Date;
  updatedAt: Date;
  updates: {
    message: string;
    status: string;
    timestamp: Date;
  }[];
}

interface StatusPageProps {
  /** Callback to navigate back */
  onBack?: () => void;
}

// Status styling
const statusConfig: Record<ComponentStatus, { color: string; bg: string; label: string }> = {
  operational: { color: 'text-green-600', bg: 'bg-green-500', label: 'Operational' },
  degraded: { color: 'text-yellow-600', bg: 'bg-yellow-500', label: 'Degraded Performance' },
  outage: { color: 'text-red-600', bg: 'bg-red-500', label: 'Major Outage' },
  maintenance: { color: 'text-blue-600', bg: 'bg-blue-500', label: 'Under Maintenance' },
};

const incidentStatusConfig: Record<string, { color: string; label: string }> = {
  investigating: { color: 'text-red-600', label: 'Investigating' },
  identified: { color: 'text-yellow-600', label: 'Identified' },
  monitoring: { color: 'text-blue-600', label: 'Monitoring' },
  resolved: { color: 'text-green-600', label: 'Resolved' },
};

export const StatusPage: React.FC<StatusPageProps> = ({ onBack }) => {
  const [components, setComponents] = useState<SystemComponent[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock data - in production, this would come from an API
  useEffect(() => {
    const loadStatus = async () => {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock components
      const mockComponents: SystemComponent[] = [
        {
          id: 'webapp',
          name: 'Web Application',
          description: 'Main RenovateMySite web interface',
          status: 'operational',
          lastChecked: new Date(),
          uptime: 99.9,
        },
        {
          id: 'api',
          name: 'API Services',
          description: 'Backend API and Cloud Functions',
          status: 'operational',
          lastChecked: new Date(),
          uptime: 99.8,
        },
        {
          id: 'ai',
          name: 'AI Generation',
          description: 'Gemini AI-powered content generation',
          status: 'operational',
          lastChecked: new Date(),
          uptime: 99.5,
        },
        {
          id: 'database',
          name: 'Database',
          description: 'Firestore data storage',
          status: 'operational',
          lastChecked: new Date(),
          uptime: 99.99,
        },
        {
          id: 'hosting',
          name: 'Website Hosting',
          description: 'Firebase Hosting for published sites',
          status: 'operational',
          lastChecked: new Date(),
          uptime: 99.95,
        },
        {
          id: 'auth',
          name: 'Authentication',
          description: 'User login and account services',
          status: 'operational',
          lastChecked: new Date(),
          uptime: 99.9,
        },
      ];

      // Mock incidents (empty = no recent incidents)
      const mockIncidents: Incident[] = [];

      setComponents(mockComponents);
      setIncidents(mockIncidents);
      setLastUpdated(new Date());
      setLoading(false);
    };

    loadStatus();

    // Refresh every 60 seconds
    const interval = setInterval(loadStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate overall status
  const overallStatus = components.reduce<ComponentStatus>((worst, component) => {
    if (component.status === 'outage') return 'outage';
    if (component.status === 'degraded' && worst !== 'outage') return 'degraded';
    if (component.status === 'maintenance' && worst === 'operational') return 'maintenance';
    return worst;
  }, 'operational');

  // Generate uptime bars (last 30 days simulation)
  const generateUptimeBars = (uptime: number) => {
    const days = 30;
    const bars = [];
    for (let i = 0; i < days; i++) {
      // Simulate some variance based on uptime percentage
      const dayStatus = Math.random() * 100 < uptime ? 'operational' : 'degraded';
      bars.push(
        <div
          key={i}
          className={`w-1.5 h-8 rounded-sm ${statusConfig[dayStatus].bg}`}
          title={`${days - i} days ago: ${statusConfig[dayStatus].label}`}
        />
      );
    }
    return bars;
  };

  return (
    <div className="min-h-full bg-[#F9F6F0]">
      {/* Header */}
      <div className="bg-white border-b border-[#EFEBE4]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#D4AF37] hover:text-[#B8962E] mb-4 text-sm font-semibold"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}

          <h1 className="text-3xl font-bold text-[#4A4A4A]" style={{ fontFamily: 'Playfair Display, serif' }}>
            System Status
          </h1>
          <p className="text-gray-500 mt-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Current status and historical uptime for RenovateMySite services
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          // Loading state
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]" />
            <p className="mt-4 text-gray-500">Checking system status...</p>
          </div>
        ) : (
          <>
            {/* Overall Status Banner */}
            <div className={`rounded-2xl p-6 mb-8 ${
              overallStatus === 'operational' ? 'bg-green-50 border border-green-200' :
              overallStatus === 'degraded' ? 'bg-yellow-50 border border-yellow-200' :
              overallStatus === 'maintenance' ? 'bg-blue-50 border border-blue-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${statusConfig[overallStatus].bg}`} />
                <div>
                  <h2 className={`text-xl font-bold ${statusConfig[overallStatus].color}`} style={{ fontFamily: 'Playfair Display, serif' }}>
                    {overallStatus === 'operational' ? 'All Systems Operational' :
                     overallStatus === 'degraded' ? 'Some Systems Experiencing Issues' :
                     overallStatus === 'maintenance' ? 'Scheduled Maintenance in Progress' :
                     'Major System Outage'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Incidents */}
            {incidents.filter(i => i.status !== 'resolved').length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-[#4A4A4A] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Active Incidents
                </h3>
                <div className="space-y-4">
                  {incidents.filter(i => i.status !== 'resolved').map(incident => (
                    <div key={incident.id} className="bg-white rounded-xl border border-[#EFEBE4] p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-[#4A4A4A]">{incident.title}</h4>
                          <span className={`text-sm font-semibold ${incidentStatusConfig[incident.status].color}`}>
                            {incidentStatusConfig[incident.status].label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {incident.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      {incident.updates.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#EFEBE4]">
                          <p className="text-sm text-gray-600">{incident.updates[0].message}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Component Status */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#4A4A4A] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Component Status
              </h3>
              <div className="bg-white rounded-2xl border border-[#EFEBE4] divide-y divide-[#EFEBE4]">
                {components.map(component => (
                  <div key={component.id} className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-[#4A4A4A]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {component.name}
                        </h4>
                        <p className="text-xs text-gray-400">{component.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${statusConfig[component.status].bg}`} />
                        <span className={`text-sm font-medium ${statusConfig[component.status].color}`}>
                          {statusConfig[component.status].label}
                        </span>
                      </div>
                    </div>

                    {/* Uptime bars */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>30 days ago</span>
                        <span>Today</span>
                      </div>
                      <div className="flex gap-0.5">
                        {generateUptimeBars(component.uptime)}
                      </div>
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {component.uptime}% uptime
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Incident History */}
            <div>
              <h3 className="text-lg font-bold text-[#4A4A4A] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Incident History
              </h3>
              {incidents.length > 0 ? (
                <div className="space-y-4">
                  {incidents.map(incident => (
                    <div key={incident.id} className="bg-white rounded-xl border border-[#EFEBE4] p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-[#4A4A4A]">{incident.title}</h4>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          incident.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {incidentStatusConfig[incident.status].label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {incident.createdAt.toLocaleDateString()} - {incident.updatedAt.toLocaleDateString()}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {incident.affectedComponents.map(comp => (
                          <span key={comp} className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#EFEBE4] p-8 text-center">
                  <div className="text-4xl mb-3">✓</div>
                  <h4 className="font-semibold text-[#4A4A4A] mb-1">No Recent Incidents</h4>
                  <p className="text-sm text-gray-500">
                    There have been no incidents in the past 7 days.
                  </p>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-8 pt-6 border-t border-[#EFEBE4]">
              <h4 className="text-sm font-semibold text-gray-500 mb-3">Status Legend</h4>
              <div className="flex flex-wrap gap-6">
                {Object.entries(statusConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${config.bg}`} />
                    <span className="text-sm text-gray-600">{config.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatusPage;
