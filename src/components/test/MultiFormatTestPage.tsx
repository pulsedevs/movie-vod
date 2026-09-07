/**
 * Multi-Format Video Player Test Page
 * 
 * This component demonstrates the FourKPlayer's support for multiple video formats
 */

'use client';

import React, { useState } from 'react';
import FourKPlayer from '@/components/player/FourKPlayer';

const testVideos = [
  {
    name: 'HLS Stream (Adaptive)',
    url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    format: 'HLS',
    description: 'Adaptive bitrate streaming with multiple qualities'
  },
  {
    name: 'MP4 Direct (Most Compatible)',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    format: 'MP4',
    description: 'Direct MP4 file, works in all browsers'
  },
  {
    name: 'WebM (Modern)',
    url: 'https://sample-videos.com/zip/10/webm/SampleVideo_1280x720_1mb.webm',
    format: 'WebM',
    description: 'Efficient WebM format, Chrome/Firefox'
  },
  {
    name: 'Big Buck Bunny (MP4)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    format: 'MP4',
    description: 'High quality test video'
  }
];

export default function MultiFormatTestPage() {
  const [selectedVideo, setSelectedVideo] = useState(testVideos[0]);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVideoSelect = (video: typeof testVideos[0]) => {
    setSelectedVideo(video);
    setPlayerError(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🎬 Multi-Format Video Player Test
        </h1>
        
        {/* Video Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Test Video:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {testVideos.map((video, index) => (
              <button
                key={index}
                onClick={() => handleVideoSelect(video)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedVideo.url === video.url
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                }`}
              >
                <div className="text-sm font-medium">{video.name}</div>
                <div className="text-xs text-gray-400 mt-1">{video.format}</div>
                <div className="text-xs text-gray-500 mt-2">{video.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Player */}
        <div className="mb-8">
          <div className="bg-black rounded-lg overflow-hidden">
            <FourKPlayer
              streamUrl={selectedVideo.url}
              title={selectedVideo.name}
              mediaId={`test-${selectedVideo.format.toLowerCase()}`}
              mediaType="movie"
              onError={(error) => {
                console.error('Player Error:', error);
                setPlayerError(error);
              }}
              onLoadStart={() => {
                setIsLoading(true);
                setPlayerError(null);
              }}
              onLoadComplete={() => {
                setIsLoading(false);
              }}
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Current Video:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Name:</span> {selectedVideo.name}
              </div>
              <div>
                <span className="text-gray-400">Format:</span> {selectedVideo.format}
              </div>
              <div className="md:col-span-2">
                <span className="text-gray-400">URL:</span> 
                <code className="ml-2 text-xs bg-gray-700 px-2 py-1 rounded">
                  {selectedVideo.url}
                </code>
              </div>
            </div>
          </div>

          {/* Loading Status */}
          {isLoading && (
            <div className="bg-blue-900/50 border border-blue-600 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                <span>Loading {selectedVideo.format} video...</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {playerError && (
            <div className="bg-red-900/50 border border-red-600 rounded-lg p-4">
              <h4 className="font-semibold text-red-300 mb-2">Player Error:</h4>
              <pre className="text-sm text-red-200 whitespace-pre-wrap">{playerError}</pre>
            </div>
          )}

          {/* Format Support Info */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Format Support Info:</h3>
            <div className="text-sm space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="text-green-400">✅ HLS (.m3u8)</div>
                <div className="text-green-400">✅ MP4 (.mp4)</div>
                <div className="text-green-400">✅ WebM (.webm)</div>
                <div className="text-yellow-400">⚠️ MOV (.mov)</div>
                <div className="text-red-400">❌ AVI (.avi)</div>
                <div className="text-yellow-400">⚠️ MKV (.mkv)</div>
                <div className="text-yellow-400">⚠️ OGG (.ogg)</div>
                <div className="text-blue-400">🔧 Auto-detect</div>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                ✅ Excellent support | ⚠️ Limited support | ❌ No support | 🔧 Automatic detection
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
