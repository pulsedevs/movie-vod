// src/components/watchParty/CreatePartyModal.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Users, Globe, Lock } from 'lucide-react';
import { useWatchParty } from '@/hooks/useWatchParty';
import { MediaItem } from '@/types';

interface CreatePartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem;
  currentVideoUrl?: string;
  selectedSourceIndex?: number;
  onPartyCreated?: () => void;
}

export default function CreatePartyModal({ isOpen, onClose, media, currentVideoUrl, selectedSourceIndex, onPartyCreated }: CreatePartyModalProps) {  const router = useRouter();
  const { createParty, loading } = useWatchParty();
  
  // Helper function to get display title
  const getDisplayTitle = (media: MediaItem) => {
    return 'title' in media ? media.title : media.name;
  };
  
  // Helper function to get release year
  const getReleaseYear = (media: MediaItem) => {
    const dateStr = 'release_date' in media ? media.release_date : media.first_air_date;
    return dateStr ? new Date(dateStr).getFullYear() : '';
  };
  
  const [formData, setFormData] = useState({
    title: `${getDisplayTitle(media)} Watch Party`,
    description: '',
    is_public: false,
    max_participants: 10
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();    const partyId = await createParty({
      title: formData.title,
      media_id: media.id,
      media_type: media.media_type || 'movie',
      poster_path: media.poster_path || undefined,
      description: formData.description,
      is_public: formData.is_public,
      max_participants: formData.max_participants,
      video_url: currentVideoUrl,
      selected_source_index: selectedSourceIndex || 0
    });    if (partyId) {
      // Call the callback to notify parent component about party creation
      if (onPartyCreated) {
        onPartyCreated();
      }
      onClose();
      router.push(`/party/${partyId}`);
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
      >        {/* Website-Themed Header with Floating Effect */}
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
              🎬 Create Watch Party
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
        </div>        {/* Website-Themed Form with Glassmorphism Elements */}
        <div className="p-4 sm:p-5 md:p-6">
          {/* Movie Info with Glassmorphism */}
          <div 
            className="flex items-start space-x-3 sm:space-x-4 mb-5 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.7) 100%)',
              backdropFilter: 'blur(20px) saturate(150%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: 'inset 0 1px 0 rgba(99, 102, 241, 0.1), 0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >            <img
              src={media.poster_path ? `https://image.tmdb.org/t/p/w200${media.poster_path}` : '/images/placeholder-poster.png'}
              alt={getDisplayTitle(media)}
              className="w-14 h-20 sm:w-16 sm:h-24 object-cover rounded-lg"
            />
            <div>
              <h3 className="font-semibold text-white text-sm sm:text-base">
                {getDisplayTitle(media)}
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 mt-1">
                {getReleaseYear(media)}
              </p>
              <p className="text-xs sm:text-sm text-gray-400">
                {media.media_type === 'tv' ? 'TV Series' : 'Movie'}
              </p>
            </div>
          </div>          {/* Glassmorphism Form */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Party Title */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">
                🎬 Party Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full text-sm sm:text-base text-white placeholder-gray-400 rounded-xl sm:rounded-2xl transition-all duration-300 focus:scale-[1.02] disabled:opacity-50"
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
                  required
                  disabled={loading}
                  placeholder="Enter party title..."
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">
                📝 Description (Optional)
              </label>
              <div className="relative">
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full text-sm sm:text-base text-white placeholder-gray-400 rounded-xl sm:rounded-2xl transition-all duration-300 focus:scale-[1.02] disabled:opacity-50 resize-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.7) 100%)',
                    backdropFilter: 'blur(20px) saturate(150%)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '16px 20px',
                    boxShadow: `
                      0 8px 32px rgba(99, 102, 241, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                    `,
                    minHeight: '80px'
                  }}
                  rows={3}
                  placeholder="Tell people what this party is about..."
                  disabled={loading}
                />
              </div>
            </div>
            {/* Privacy Toggle */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-3 sm:mb-4">
                🔒 Privacy Settings
              </label>
              <div className="flex space-x-3 sm:space-x-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_public: false }))}
                  className={`flex-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                    !formData.is_public ? 'scale-[1.02]' : ''
                  }`}
                  style={{
                    background: !formData.is_public 
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(147, 51, 234, 0.3) 100%)'
                      : 'linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.5) 100%)',
                    backdropFilter: 'blur(20px) saturate(150%)',
                    border: `1px solid ${!formData.is_public ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.2)'}`,
                    boxShadow: !formData.is_public 
                      ? '0 8px 32px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      : '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  }}
                  disabled={loading}
                >
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 mx-auto mb-2" />
                  <div className="text-xs sm:text-sm font-medium text-white">Private</div>
                  <div className="text-xs text-gray-400">Invite only</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_public: true }))}
                  className={`flex-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                    formData.is_public ? 'scale-[1.02]' : ''
                  }`}
                  style={{
                    background: formData.is_public 
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(147, 51, 234, 0.3) 100%)'
                      : 'linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.5) 100%)',
                    backdropFilter: 'blur(20px) saturate(150%)',
                    border: `1px solid ${formData.is_public ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.2)'}`,
                    boxShadow: formData.is_public 
                      ? '0 8px 32px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      : '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  }}
                  disabled={loading}
                >
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 mx-auto mb-2" />
                  <div className="text-xs sm:text-sm font-medium text-white">Public</div>
                  <div className="text-xs text-gray-400">Anyone can join</div>
                </button>
              </div>
            </div>

           {/* Max Participants */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                👥 Max Participants
              </label>
              <div className="relative">
                <select
                  value={formData.max_participants}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                  className="w-full text-sm sm:text-base text-white rounded-xl sm:rounded-2xl transition-all duration-300 focus:scale-[1.02] disabled:opacity-50 appearance-none cursor-pointer"
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
                  disabled={loading}
                >
                  <option value={5} style={{ background: 'rgba(31, 41, 55, 0.95)', color: 'white' }}>5 people</option>
                  <option value={10} style={{ background: 'rgba(31, 41, 55, 0.95)', color: 'white' }}>10 people</option>
                  <option value={20} style={{ background: 'rgba(31, 41, 55, 0.95)', color: 'white' }}>20 people</option>
                  <option value={50} style={{ background: 'rgba(31, 41, 55, 0.95)', color: 'white' }}>50 people</option>
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>            {/* Epic Glassmorphism Submit Buttons */}
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
                disabled={loading}
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
                      Creating...
                    </>
                  ) : (
                    '🚀 Create Party'
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
