'use client';

import { useState } from 'react';
import useRemoteSourceOverrides from '@/hooks/useRemoteSourceOverrides';
import { RefreshCw, Settings, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';

interface RemoteConfigDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const RemoteConfigDashboard: React.FC<RemoteConfigDashboardProps> = ({ isOpen, onClose }) => {
  const {
    config,
    loading,
    error,
    lastFetchTime,
    refreshConfig,
    getSourceForMovie,
    getSourceForTv,
    isSourceDisabled
  } = useRemoteSourceOverrides();
  
  const [testMovieId, setTestMovieId] = useState('574475');
  const [testTvId, setTestTvId] = useState('');

  if (!isOpen) return null;

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Firebase Remote Config Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Status Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Configuration Status</h3>
              <button
                onClick={refreshConfig}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Refreshing...' : 'Refresh Config'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {error ? (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                  <span className="font-medium text-white">Status</span>
                </div>
                <p className={`text-sm ${error ? 'text-red-400' : 'text-green-400'}`}>
                  {error || 'Connected'}
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="font-medium text-white">Last Fetch</span>
                </div>
                <p className="text-sm text-gray-300">{formatTime(lastFetchTime)}</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  <span className="font-medium text-white">Health Check</span>
                </div>
                <p className={`text-sm ${config?.sourceHealthCheckEnabled ? 'text-green-400' : 'text-yellow-400'}`}>
                  {config?.sourceHealthCheckEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>

          {/* Configuration Values */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Movie Overrides */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3">Movie Source Overrides</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {!config?.movieOverrides || Object.keys(config.movieOverrides).length === 0 ? (
                  <p className="text-gray-400 text-sm">No movie overrides configured</p>
                ) : (
                  Object.entries(config.movieOverrides).map(([movieId, sourceIndex]) => (
                    <div key={movieId} className="flex justify-between text-sm">
                      <span className="text-gray-300">Movie {movieId}:</span>
                      <span className={`${isSourceDisabled(sourceIndex) ? 'text-red-400 line-through' : 'text-blue-400'}`}>
                        Source {sourceIndex + 1}
                      </span>
                    </div>
                  ))
                )}              </div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Default:</span>
                  <span className="text-green-400">Source 1 (always)</span>
                </div>
              </div>
            </div>

            {/* TV Overrides */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3">TV Source Overrides</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {!config?.tvOverrides || Object.keys(config.tvOverrides).length === 0 ? (
                  <p className="text-gray-400 text-sm">No TV overrides configured</p>
                ) : (
                  Object.entries(config.tvOverrides).map(([tvId, sourceIndex]) => (
                    <div key={tvId} className="flex justify-between text-sm">
                      <span className="text-gray-300">TV {tvId}:</span>
                      <span className={`${isSourceDisabled(sourceIndex) ? 'text-red-400 line-through' : 'text-blue-400'}`}>
                        Source {sourceIndex + 1}
                      </span>
                    </div>
                  ))
                )}              </div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Default:</span>
                  <span className="text-green-400">Source 1 (always)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Disabled Sources */}
          {config?.emergencyDisabledSources && config.emergencyDisabledSources.length > 0 && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-red-400 mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Emergency Disabled Sources
              </h4>
              <div className="flex flex-wrap gap-2">
                {config.emergencyDisabledSources.map(sourceIndex => (
                  <span
                    key={sourceIndex}
                    className="px-2 py-1 bg-red-800 text-red-200 rounded text-sm"
                  >
                    Source {sourceIndex + 1}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Testing Section */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-4">Test Source Resolution</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Movie Test */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Test Movie ID
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={testMovieId}
                    onChange={(e) => setTestMovieId(e.target.value)}
                    placeholder="Enter TMDB Movie ID"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {testMovieId && (
                  <div className="mt-2 p-2 bg-gray-700 rounded text-sm">
                    <span className="text-gray-300">Result: </span>
                    <span className="text-blue-400">Source {getSourceForMovie(testMovieId) + 1}</span>
                  </div>
                )}
              </div>

              {/* TV Test */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Test TV ID
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={testTvId}
                    onChange={(e) => setTestTvId(e.target.value)}
                    placeholder="Enter TMDB TV ID"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {testTvId && (
                  <div className="mt-2 p-2 bg-gray-700 rounded text-sm">
                    <span className="text-gray-300">Result: </span>
                    <span className="text-blue-400">Source {getSourceForTv(testTvId) + 1}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Firebase Console Link */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-400 mb-1">Firebase Console</h4>
                <p className="text-sm text-gray-300">
                  Manage your remote config values in the Firebase Console
                </p>
              </div>
              <a
                href={`https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/config`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Console</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoteConfigDashboard;
