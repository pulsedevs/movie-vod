'use client';

import React, { useState } from 'react';
import PrerollAdPlayer from './PrerollAdPlayer';
import { StreamIframe } from './StreamIframe';

interface AdToIframePlayerProps {
  vastUrl: string;
  iframeUrl: string;
  title?: string;
}

const AdToIframePlayer: React.FC<AdToIframePlayerProps> = ({
  vastUrl,
  iframeUrl,
  title = 'Movie Player'
}) => {
  const [showAd, setShowAd] = useState(true);
  const [showIframe, setShowIframe] = useState(false);
  const handleAdComplete = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Ad completed - showing movie');
    }
    setShowAd(false);
    setShowIframe(true);
  };

  const handleAdSkipped = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Ad skipped - showing movie');
    }
    setShowAd(false);
    setShowIframe(true);
  };

  return (
    <div className="w-full h-full relative">      {showAd && (
        <div className="w-full h-full">
          {/* Use PrerollAdPlayer for clean UI and payment tracking */}
          <PrerollAdPlayer
            vastUrl={vastUrl}
            onAdComplete={handleAdComplete}
            onAdSkipped={handleAdSkipped}
          />
        </div>
      )}
        {showIframe && (
        <div className="w-full h-full">
          <StreamIframe
            src={iframeUrl}
            title={title}
            className="w-full h-full border-0"
          />
        </div>
      )}
      
      {/* Loading state */}
      {!showAd && !showIframe && (
        <div className="w-full h-full flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading movie...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdToIframePlayer;
