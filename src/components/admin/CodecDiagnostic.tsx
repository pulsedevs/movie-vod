'use client';

import React, { useState, useEffect } from 'react';

interface CodecSupport {
  name: string;
  codec: string;
  supported: 'probably' | 'maybe' | 'no';
  canPlay: boolean;
}

const CodecDiagnostic: React.FC = () => {
  const [codecSupport, setCodecSupport] = useState<CodecSupport[]>([]);
  const [browserInfo, setBrowserInfo] = useState<string>('');

  useEffect(() => {
    const video = document.createElement('video');
    
    // Test common codecs used in streaming
    const codecs = [
      { name: 'H.264 (AVC)', codec: 'video/mp4; codecs="avc1.640028"' },
      { name: 'H.265/HEVC Main', codec: 'video/mp4; codecs="hvc1.1.6.L93.B0"' },
      { name: 'H.265/HEVC Main10', codec: 'video/mp4; codecs="hvc1.2.4.L150.B0"' },
      { name: 'AV1', codec: 'video/mp4; codecs="av01.0.05M.08"' },
      { name: 'VP9', codec: 'video/webm; codecs="vp9"' },
      { name: 'VP8', codec: 'video/webm; codecs="vp8"' },
    ];

    const results = codecs.map(({ name, codec }) => {
      const support = video.canPlayType(codec) as 'probably' | 'maybe' | '';
      return {
        name,
        codec,
        supported: support || 'no' as 'probably' | 'maybe' | 'no',
        canPlay: support !== ''
      };
    });

    setCodecSupport(results);
    setBrowserInfo(`${navigator.userAgent}`);
  }, []);

  const getSupportColor = (supported: string) => {
    switch (supported) {
      case 'probably': return 'text-green-600';
      case 'maybe': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const getSupportIcon = (supported: string) => {
    switch (supported) {
      case 'probably': return '✅';
      case 'maybe': return '⚠️';
      default: return '❌';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔧 Video Codec Diagnostic Tool</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Browser Information</h3>
        <div className="bg-gray-100 p-3 rounded text-sm font-mono break-all">
          {browserInfo}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Codec Support Status</h3>
        <div className="space-y-2">
          {codecSupport.map((codec, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{getSupportIcon(codec.supported)}</span>
                <div>
                  <div className="font-medium">{codec.name}</div>
                  <div className="text-sm text-gray-500 font-mono">{codec.codec}</div>
                </div>
              </div>
              <div className={`font-semibold ${getSupportColor(codec.supported)}`}>
                {codec.supported === 'probably' ? 'Full Support' : 
                 codec.supported === 'maybe' ? 'Partial Support' : 'Not Supported'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">📋 Interpretation Guide</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li><strong>✅ Full Support:</strong> Browser can definitely play this codec</li>
          <li><strong>⚠️ Partial Support:</strong> Browser might be able to play this codec</li>
          <li><strong>❌ Not Supported:</strong> Browser cannot play this codec</li>
        </ul>
      </div>

      <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">💡 H.265/HEVC Support Notes</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• <strong>Safari (Mac/iOS):</strong> Generally has the best H.265 support</li>
          <li>• <strong>Chrome/Firefox/Edge:</strong> Limited or no H.265 support due to licensing</li>
          <li>• <strong>Recommendation:</strong> Use H.264 for maximum compatibility</li>
        </ul>
      </div>
    </div>
  );
};

export default CodecDiagnostic;
