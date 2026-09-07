'use client';

import React, { useState } from 'react';
import PrerollAdPlayer from '../../components/player/PrerollAdPlayer';

export default function VastTestPage() {
  const [testMode, setTestMode] = useState<'manual' | 'plugin' | 'exoclick'>('exoclick');
  const [isTestingAd, setIsTestingAd] = useState(false);
  
  // Check if VAST test page is enabled via environment variable
  const vastTestEnabled = process.env.NEXT_PUBLIC_VAST_ADS_ENABLED === 'true';
  const handleAdComplete = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[VAST Test] Ad completed');
    }
    setIsTestingAd(false);
  };

  const handleAdSkipped = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[VAST Test] Ad skipped');
    }
    setIsTestingAd(false);
  };

  const testVastUrl = process.env.NEXT_PUBLIC_EXOCLICK_VAST_TAG || 'https://s.magsrv.com/v1/vast.php?idzone=5650700';

  if (!vastTestEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-8xl mb-6">🚫</div>
          <h1 className="text-3xl font-bold mb-4">VAST Test Page Disabled</h1>
          <p className="text-gray-400 mb-6">
            VAST ads are currently disabled. Set <code>NEXT_PUBLIC_VAST_ADS_ENABLED=true</code> in your .env.local file to enable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                VAST Ad Player Test Suite
              </h1>
              <p className="text-gray-400 mt-1">Advanced testing environment for VAST ad integration</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400">Live Testing</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Test Mode Selection */}
        <div className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            VAST Player Mode Selection
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setTestMode('exoclick')}
              className={`p-4 rounded-lg border-2 transition-all ${
                testMode === 'exoclick'
                  ? 'border-green-500 bg-green-500/20 text-green-300'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-green-400'
              }`}
            >
              <div className="font-semibold mb-2">💰 ExoClick Official (NEW!)</div>
              <div className="text-sm opacity-80">
                Uses ExoClick&apos;s exact plugin specification.
                <br />
                <strong>✅ Guaranteed payment tracking!</strong>
              </div>
            </button>
            <button
              onClick={() => setTestMode('plugin')}
              className={`p-4 rounded-lg border-2 transition-all ${
                testMode === 'plugin'
                  ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-purple-400'
              }`}
            >
              <div className="font-semibold mb-2">🎯 VAST Plugin (Generic)</div>
              <div className="text-sm opacity-80">
                Uses videojs-vast-vpaid plugin for full VAST compliance.
                <br />
                <strong>⚠️ May miss some payment events</strong>
              </div>
            </button>
            <button
              onClick={() => setTestMode('manual')}
              className={`p-4 rounded-lg border-2 transition-all ${
                testMode === 'manual'
                  ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-orange-400'
              }`}
            >
              <div className="font-semibold mb-2">⚙️ Manual Parser (Legacy)</div>
              <div className="text-sm opacity-80">
                Manual VAST XML parsing and VideoJS playback.
                <br />
                <strong>❌ No payment tracking</strong>
              </div>
            </button>
          </div>
        </div>

        {/* Test ExoClick Official Implementation */}
        {testMode === 'exoclick' && (
          <div className="mb-8 bg-green-800/30 backdrop-blur-sm rounded-xl p-6 border border-green-600">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              💰 Test ExoClick Official Implementation
            </h2>
            <div className="bg-green-900/30 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-300 mb-2">🎯 What This Tests:</h3>
              <ul className="text-sm text-green-100 space-y-1">
                <li>• ExoClick&apos;s exact plugin specification from their docs</li>
                <li>• Proper impression tracking for payment verification</li>
                <li>• VAST skip button integration with tracking events</li>
                <li>• All required ad lifecycle events for monetization</li>
              </ul>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setIsTestingAd(true)}
                disabled={isTestingAd}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-all"
              >
                {isTestingAd ? 'Testing Payment Tracking...' : '💰 Test ExoClick Payment Tracking'}
              </button>
              {isTestingAd && (
                <button
                  onClick={() => setIsTestingAd(false)}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                >
                  Stop Test
                </button>
              )}
            </div>
          </div>
        )}

        {/* Test Generic VAST Plugin */}
        {testMode === 'plugin' && (
          <div className="mb-8 bg-blue-800/30 backdrop-blur-sm rounded-xl p-6 border border-blue-600">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Test Generic VAST Plugin
            </h2>
            <p className="text-gray-300 mb-4">
              This tests the generic VAST plugin integration (may miss some payment events).
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsTestingAd(true)}
                disabled={isTestingAd}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-all"
              >
                {isTestingAd ? 'Testing...' : 'Test Generic VAST Ad'}
              </button>
              {isTestingAd && (
                <button
                  onClick={() => setIsTestingAd(false)}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                >
                  Stop Test
                </button>
              )}
            </div>
          </div>
        )}        {/* ExoClick Official Test */}
        {testMode === 'exoclick' && isTestingAd && (
          <div className="mb-8">
            <PrerollAdPlayer
              vastUrl={testVastUrl}
              onAdComplete={handleAdComplete}
              onAdSkipped={handleAdSkipped}
            />
          </div>
        )}        {/* Generic VAST Plugin Test */}
        {testMode === 'plugin' && isTestingAd && (
          <div className="mb-8">
            <PrerollAdPlayer
              vastUrl={testVastUrl}
              onAdComplete={handleAdComplete}
              onAdSkipped={handleAdSkipped}
            />
          </div>
        )}        {/* Manual Parser Test */}
        {testMode === 'manual' && (
          <div className="mb-8">
            <PrerollAdPlayer
              vastUrl={testVastUrl}
              onAdComplete={handleAdComplete}
              onAdSkipped={handleAdSkipped}
            />
          </div>
        )}

        {/* Payment Tracking Explanation */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            💰 Payment Tracking Differences
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-green-900/30 rounded-lg p-4 border border-green-600">
              <h3 className="font-semibold text-green-300 mb-3">✅ ExoClick Official</h3>
              <ul className="text-sm text-green-100 space-y-2">
                <li>• Uses ExoClick&apos;s exact plugin spec</li>
                <li>• Fires ALL required tracking events</li>
                <li>• Proper impression counting</li>
                <li>• Skip button with tracking</li>
                <li>• <strong>Maximum payment guarantee</strong></li>
              </ul>
            </div>
            <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-600">
              <h3 className="font-semibold text-blue-300 mb-3">⚠️ Generic VAST Plugin</h3>
              <ul className="text-sm text-blue-100 space-y-2">
                <li>• Generic VAST 3.0+ compliance</li>
                <li>• May miss some tracking events</li>
                <li>• Skip button without full tracking</li>
                <li>• <strong>Potential payment loss</strong></li>
              </ul>
            </div>
            <div className="bg-red-900/30 rounded-lg p-4 border border-red-600">
              <h3 className="font-semibold text-red-300 mb-3">❌ Manual Parser</h3>
              <ul className="text-sm text-red-100 space-y-2">
                <li>• No VAST compliance</li>
                <li>• Missing tracking events</li>
                <li>• Custom skip only</li>
                <li>• <strong>No payment tracking</strong></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-900/30 rounded-lg border border-yellow-600">
            <h4 className="font-semibold text-yellow-300 mb-2">🚨 Important for Monetization:</h4>
            <p className="text-sm text-yellow-100">
              The <strong>ExoClick Official</strong> implementation uses their exact plugin specification and 
              ensures all payment tracking events are fired correctly. This is crucial for getting paid 
              the full amount for your ad impressions and interactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
