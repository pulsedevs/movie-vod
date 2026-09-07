'use client';

import { useState } from 'react';
import RemoteConfigDashboard from '@/components/admin/RemoteConfigDashboard';
import CodecDiagnostic from '@/components/admin/CodecDiagnostic';

export default function AdminPage() {
  const [showRemoteConfig, setShowRemoteConfig] = useState(false);
  const [showCodecDiagnostic, setShowCodecDiagnostic] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Admin panel is only available in development mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Development Admin Panel</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Firebase Remote Config</h2>
            <p className="text-gray-300 mb-4">
              Manage source overrides, defaults, and emergency controls from Firebase Console.
            </p>
            <button
              onClick={() => setShowRemoteConfig(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Open Remote Config Dashboard
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Codec Diagnostic</h2>
            <p className="text-gray-300 mb-4">
              Test browser support for various video codecs including H.265/HEVC.
            </p>
            <button
              onClick={() => setShowCodecDiagnostic(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Run Codec Test
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Firebase Console</h2>
            <p className="text-gray-300 mb-4">
              Access the Firebase Console to edit remote config parameters.
            </p>
            <a
              href={`https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/config`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
            >
              Open Firebase Console
            </a>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="font-medium text-white mb-2">1. Firebase Project Setup</h3>
              <p>Create a Firebase project at console.firebase.google.com</p>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-2">2. Environment Variables</h3>
              <p>Copy the Firebase config from your project settings to .env.local</p>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-2">3. Remote Config Parameters</h3>
              <p>Add these parameters in Firebase Console → Remote Config:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li><code>movie_source_overrides</code> (JSON)</li>
                <li><code>tv_source_overrides</code> (JSON)</li>
                <li><code>default_movie_source</code> (Number)</li>
                <li><code>default_tv_source</code> (Number)</li>
                <li><code>emergency_source_disable</code> (JSON Array)</li>
                <li><code>source_health_check_enabled</code> (Boolean)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-white mb-2">4. Example Configuration</h3>
              <div className="bg-gray-900 rounded p-3 text-sm">
                <pre>{`movie_source_overrides: {"574475": 3, "123456": 1}
tv_source_overrides: {"67890": 2}
default_movie_source: 0
default_tv_source: 0
emergency_source_disable: []
source_health_check_enabled: true`}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RemoteConfigDashboard
        isOpen={showRemoteConfig}
        onClose={() => setShowRemoteConfig(false)}
      />

      {/* Codec Diagnostic Modal */}
      {showCodecDiagnostic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Video Codec Diagnostic</h3>
              <button
                onClick={() => setShowCodecDiagnostic(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <CodecDiagnostic />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
