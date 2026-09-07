// src/components/watchParty/JoinPartyModal.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Users } from 'lucide-react';
import { useWatchParty } from '@/hooks/useWatchParty';
import { getRedirectUrlFromVideoUrl } from '@/utils/videoUrlParser';

interface JoinPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinPartyModal({ isOpen, onClose }: JoinPartyModalProps) {
  const router = useRouter();
  const { joinPartyByCode, loading, error } = useWatchParty();
  const [inviteCode, setInviteCode] = useState('');  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) return;

    const result = await joinPartyByCode(inviteCode.trim());
    
    if (result) {
      onClose();
      setInviteCode('');
      
      // If party has a specific video source, redirect to the appropriate page
      if (result.videoUrl) {
        console.log('🎬 Redirecting to party video source:', result.videoUrl);
        const redirectUrl = getRedirectUrlFromVideoUrl(result.videoUrl, result.selectedSourceIndex);
        
        if (redirectUrl) {
          console.log('📍 Redirecting to app page:', redirectUrl);
          router.push(redirectUrl);
        } else {
          console.warn('Could not parse video URL, redirecting to party page');
          router.push(`/party/${result.partyId}`);
        }
      } else {
        // No specific video source, go to party page
        router.push(`/party/${result.partyId}`);
      }
    }
  };
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw'
      }}
    >
      {/* Website-Themed Glassmorphism Backdrop */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-black/98 backdrop-blur-3xl"
        onClick={onClose}
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.90) 35%, rgba(55, 65, 81, 0.85) 70%, rgba(0, 0, 0, 0.98) 100%)',
          backdropFilter: 'blur(50px) saturate(200%)'
        }}
      />

      {/* Website-Themed Glassmorphism Modal */}
      <div 
        className="relative w-full max-w-[320px] sm:max-w-sm md:max-w-md overflow-hidden mx-auto"
        style={{ 
          background: 'linear-gradient(145deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.9) 100%)',
          backdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '20px',
          margin: '0 auto',
          transform: 'translateY(0)',
          minHeight: 'auto',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: `
            0 32px 64px rgba(0, 0, 0, 0.9),
            0 16px 32px rgba(99, 102, 241, 0.4),
            0 8px 16px rgba(147, 51, 234, 0.3),
            inset 0 1px 0 rgba(99, 102, 241, 0.2),
            inset 0 -1px 0 rgba(0, 0, 0, 0.8)
          `
        }}
      >
        {/* Website-Themed Header with Floating Effect */}
        <div 
          className="relative p-4 sm:p-6 border-b border-gray-700/50"
          style={{
            background: 'linear-gradient(135deg, rgba(55, 65, 81, 0.7) 0%, rgba(31, 41, 55, 0.8) 100%)',
            backdropFilter: 'blur(30px)',
            borderRadius: '20px 20px 0 0'
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">
              🎮 Join Watch Party
            </h2>
            <button
              onClick={onClose}
              className="group relative p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(147, 51, 234, 0.2) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(99, 102, 241, 0.4)'
              }}
              disabled={loading}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 group-hover:text-white transition-colors duration-300" />
            </button>
          </div>
        </div>

        {/* Website-Themed Form with Glassmorphism Elements */}
        <div className="p-4 sm:p-5 md:p-6">
          {/* Glassmorphism Icon Section */}
          <div 
            className="text-center mb-5 sm:mb-6 p-4 sm:p-6 rounded-xl sm:rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.7) 100%)',
              backdropFilter: 'blur(20px) saturate(150%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: 'inset 0 1px 0 rgba(99, 102, 241, 0.1), 0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(147, 51, 234, 0.3) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(99, 102, 241, 0.5)',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
              }}
            >
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-300" />
            </div>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Enter the invite code shared by your friend to join their watch party
            </p>
          </div>

          {/* Glassmorphism Form */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Invite Code Input */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">
                🔑 Invite Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full text-lg sm:text-xl text-white placeholder-gray-400 text-center font-mono tracking-wider rounded-xl sm:rounded-2xl transition-all duration-300 focus:scale-[1.02] disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.7) 100%)',
                    backdropFilter: 'blur(20px) saturate(150%)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '16px 20px',
                    boxShadow: `
                      0 8px 32px rgba(99, 102, 241, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                    `
                  }}
                  placeholder="ABC123"
                  required
                  disabled={loading}
                  maxLength={6}
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-2 text-center">
                Invite codes are 6 characters long
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="p-3 sm:p-4 rounded-xl border text-red-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(153, 27, 27, 0.3) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(220, 38, 38, 0.4)',
                  boxShadow: '0 8px 32px rgba(220, 38, 38, 0.2)'
                }}
              >
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Epic Glassmorphism Submit Buttons */}
            <div className="flex space-x-3 sm:space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 sm:py-4 md:py-5 text-xs sm:text-sm font-medium text-gray-300 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:text-white disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.7) 100%)',
                  backdropFilter: 'blur(20px) saturate(150%)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                  `
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 sm:py-4 md:py-5 text-xs sm:text-sm font-bold text-white rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(99, 102, 241, 0.8) 0%, 
                      rgba(147, 51, 234, 0.8) 35%, 
                      rgba(59, 130, 246, 0.8) 100%
                    )
                  `,
                  backdropFilter: 'blur(20px) saturate(200%)',
                  border: '1px solid rgba(99, 102, 241, 0.5)',
                  boxShadow: `
                    0 16px 64px rgba(99, 102, 241, 0.4),
                    0 8px 32px rgba(147, 51, 234, 0.3),
                    0 4px 16px rgba(59, 130, 246, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                  `
                }}
                disabled={loading || !inviteCode.trim()}
              >
                {/* Animated background gradient */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `
                      linear-gradient(135deg, 
                        rgba(139, 69, 255, 0.9) 0%, 
                        rgba(59, 130, 246, 0.9) 50%, 
                        rgba(16, 185, 129, 0.9) 100%
                      )
                    `
                  }}
                />
                <span className="relative z-10 flex items-center justify-center">
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Joining...
                    </>
                  ) : (
                    '🚀 Join Party'
                  )}
                </span>
              </button>
            </div>
          </form>

          {/* Glassmorphism Instructions */}
          <div 
            className="mt-6 p-4 sm:p-5 rounded-xl sm:rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(55, 65, 81, 0.5) 0%, rgba(31, 41, 55, 0.6) 100%)',
              backdropFilter: 'blur(20px) saturate(150%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: 'inset 0 1px 0 rgba(99, 102, 241, 0.1), 0 8px 32px rgba(0, 0, 0, 0.2)'
            }}
          >
            <h3 className="text-sm sm:text-base font-medium text-white mb-3 flex items-center">
              💡 How to get an invite code:
            </h3>
            <ul className="text-xs sm:text-sm text-gray-300 space-y-2">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></div>
                <span>Ask a friend to share their party's invite code</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0"></div>
                <span>Look for party links shared on social media</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"></div>
                <span>Browse public parties (coming soon)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
