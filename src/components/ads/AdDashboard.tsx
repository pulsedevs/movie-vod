"use client";

import { useState, useEffect } from 'react';
import { getAdTracker } from '@/utils/adTracker';
import { BarChart3, Eye, MousePointer, X, TrendingUp } from 'lucide-react';

interface AdDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdDashboard: React.FC<AdDashboardProps> = ({ isOpen, onClose }) => {
  const [analytics, setAnalytics] = useState<any>({});
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week' | 'month'>('day');

  useEffect(() => {
    if (!isOpen) return;

    const fetchAnalytics = () => {
      const adIds = [
        'surfshark-top',
        'surfshark-bottom', 
        'surfshark-corner',
        'surfshark-modal',
        'surfshark-inline',
        'surfshark-floating',
        'surfshark-promo-overlay'
      ];

      const analyticsData: any = {};
        adIds.forEach(adId => {
        // Get analytics from tracker
        const tracker = getAdTracker();
        const events = tracker.getEventHistory().filter(e => e.adId === adId);
        const impressions = events.filter(e => e.type === 'impression').length;
        const clicks = events.filter(e => e.type === 'click').length;
        const ctr = impressions > 0 ? (clicks / impressions * 100).toFixed(2) : '0.00';
        
        analyticsData[adId] = {
          impressions,
          clicks,
          ctr: parseFloat(ctr),
          revenue: (clicks * 0.05).toFixed(2) // Mock revenue calculation
        };
      });

      setAnalytics(analyticsData);
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  const getTotalMetrics = () => {
    const totals = {
      impressions: 0,
      clicks: 0,
      dismissals: 0,
      ctr: 0,
      revenue: 0 // Estimated based on clicks
    };

    Object.values(analytics).forEach((data: any) => {
      totals.impressions += data.impressions || 0;
      totals.clicks += data.clicks || 0;
      totals.dismissals += data.dismissals || 0;
    });

    totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    totals.revenue = totals.clicks * 2.5; // Estimated $2.50 per click

    return totals;
  };

  if (!isOpen) return null;

  const totals = getTotalMetrics();

  return (
    <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 text-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            Ad Performance Dashboard
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Time Range Selector */}
          <div className="flex gap-2 mb-6">
            {['hour', 'day', 'week', 'month'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          {/* Total Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5" />
                <span className="text-sm font-medium">Total Impressions</span>
              </div>
              <div className="text-2xl font-bold">{totals.impressions.toLocaleString()}</div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <MousePointer className="w-5 h-5" />
                <span className="text-sm font-medium">Total Clicks</span>
              </div>
              <div className="text-2xl font-bold">{totals.clicks.toLocaleString()}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Click Rate</span>
              </div>
              <div className="text-2xl font-bold">{totals.ctr.toFixed(2)}%</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💰</span>
                <span className="text-sm font-medium">Est. Revenue</span>
              </div>
              <div className="text-2xl font-bold">${totals.revenue.toFixed(2)}</div>
            </div>
          </div>

          {/* Individual Ad Performance */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Ad Variant Performance</h3>
            
            {Object.entries(analytics).map(([adId, data]: [string, any]) => (
              <div key={adId} className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-blue-400">{adId.replace('surfshark-', '').toUpperCase()}</h4>
                  <div className="text-sm text-gray-400">
                    Last shown: {data.lastShown ? new Date(data.lastShown).toLocaleDateString() : 'Never'}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Impressions</div>
                    <div className="font-bold text-lg">{data.impressions || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Clicks</div>
                    <div className="font-bold text-lg">{data.clicks || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">CTR</div>
                    <div className="font-bold text-lg">{data.ctr?.toFixed(2) || 0}%</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Dismissals</div>
                    <div className="font-bold text-lg">{data.dismissals || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Revenue</div>
                    <div className="font-bold text-lg">${((data.clicks || 0) * 2.5).toFixed(2)}</div>
                  </div>
                </div>

                {/* Performance Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((data.ctr || 0) * 10, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Performance Score</div>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Tips */}
          <div className="mt-8 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-3">💡 Optimization Tips</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• CTR above 2% is considered excellent for display ads</li>
              <li>• Test different ad positions to find optimal placement</li>
              <li>• Monitor dismissal rates - high dismissals may indicate ad fatigue</li>
              <li>• Best performing times are typically evening hours (7-10 PM)</li>
              <li>• Movie page ads typically perform 3x better than general pages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdDashboard;
