'use client';

import React, { useState, useEffect } from 'react';
import { Users, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CreatePartyModal from './CreatePartyModal';
import JoinPartyModal from './JoinPartyModal';
import { MediaItem } from '@/types';
import { useWatchParty } from '@/hooks/useWatchParty';
import { WatchParty } from '@/types/watchParty';

interface WatchPartyButtonProps {
  mediaId: string | number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath?: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  currentVideoUrl?: string;
  selectedSourceIndex?: number;
  /** Compact tile for the v2 right panel — no chevron, click opens menu */
  variant?: 'default' | 'panel';
  className?: string;
}

const WatchPartyButton: React.FC<WatchPartyButtonProps> = ({
  mediaId,
  mediaType,
  title,
  posterPath,
  seasonNumber,
  episodeNumber,
  currentVideoUrl,
  selectedSourceIndex,
  variant = 'default',
  className,
}) => {
  const router = useRouter();
  const { checkExistingPartyForMedia } = useWatchParty();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [existingParty, setExistingParty] = useState<WatchParty | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for existing party when component mounts or media changes
  useEffect(() => {
    const checkExistingParty = async () => {
      setLoading(true);
      try {
        const party = await checkExistingPartyForMedia(Number(mediaId), mediaType);
        setExistingParty(party);
      } catch (error) {
        console.error('Error checking existing party:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingParty();
  }, [mediaId, mediaType, checkExistingPartyForMedia]);

  const handleCreateParty = () => {
    setShowDropdown(false);
    setShowCreateModal(true);
  };

  const handleJoinParty = () => {
    setShowDropdown(false);
    setShowJoinModal(true);
  };

  const handleGoToParty = () => {
    if (existingParty) {
      router.push(`/party/${existingParty.id}`);
    }
  };

  const handleOnPartyCreated = () => {
    // Refresh the existing party check after creating a new party
    const checkExistingParty = async () => {
      try {
        const party = await checkExistingPartyForMedia(Number(mediaId), mediaType);
        setExistingParty(party);
      } catch (error) {
        console.error('Error checking existing party after creation:', error);
      }
    };
    checkExistingParty();
  };
  const isPanel = variant === 'panel';
  const defaultButtonClass =
    'relative inline-flex items-center justify-center gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold shadow-lg hover:bg-white/20 hover:border-white/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out group disabled:opacity-50 disabled:cursor-not-allowed';
  const panelButtonClass =
    className ??
    'flex min-h-[2.75rem] w-full flex-col items-center justify-center gap-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-1 py-1.5 text-zinc-200 transition-colors hover:bg-white/[0.07] disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <>
      <div className={`relative ${isPanel ? 'h-full w-full' : 'flex-shrink-0'}`}>
        {existingParty ? (
          <button
            onClick={handleGoToParty}
            disabled={loading}
            className={
              isPanel
                ? `${panelButtonClass} !border-green-400/30 !bg-green-500/15 !text-green-300`
                : 'relative inline-flex items-center justify-center gap-2 px-2 py-2 sm:px-3 sm:py-3 rounded-lg sm:rounded-xl bg-green-500/20 backdrop-blur-md border border-green-400/30 text-green-300 font-semibold shadow-lg hover:bg-green-500/30 hover:border-green-400/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out group disabled:opacity-50 disabled:cursor-not-allowed'
            }
            title="Go to your existing party"
          >
            <ExternalLink className={isPanel ? 'h-3 w-3 shrink-0' : 'w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0'} />
            {isPanel ? (
              <span className="text-[9px] font-semibold leading-none">Open</span>
            ) : (
              <span className="hidden sm:inline text-xs sm:text-sm font-medium">Go to Party</span>
            )}
          </button>
        ) : (
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={loading}
            className={isPanel ? panelButtonClass : defaultButtonClass}
            title="Watch with Friends"
          >
            <Users className={isPanel ? 'h-3 w-3 shrink-0 text-zinc-300' : 'w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0'} />
            {isPanel ? (
              <span className="text-[9px] font-semibold leading-none">
                {loading ? '…' : 'Party'}
              </span>
            ) : (
              <span className="hidden sm:inline text-xs sm:text-sm font-medium">
                {loading ? 'Loading...' : 'Party'}
              </span>
            )}
            {!isPanel && !loading && (
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        )}
        {showDropdown && !existingParty && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div
              className={`absolute z-50 overflow-hidden rounded-lg border border-white/20 bg-gray-900/95 shadow-xl backdrop-blur-md ${
                isPanel
                  ? 'right-0 top-full mt-1 w-44'
                  : 'left-0 top-full mt-2 w-48'
              }`}
            >
              <button
                onClick={handleCreateParty}
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors duration-200 flex items-center gap-3"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Create Party</div>
                  <div className="text-xs text-gray-400">Start a new watch party</div>
                </div>
              </button>
              
              <div className="border-t border-white/10" />
              
              <button
                onClick={handleJoinParty}
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors duration-200 flex items-center gap-3"
              >
                <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Join Party</div>
                  <div className="text-xs text-gray-400">Enter invite code</div>
                </div>
              </button>
            </div>
          </>
        )}
      </div>      {/* Modals */}      {showCreateModal && (
        <CreatePartyModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          media={{
            id: Number(mediaId),
            media_type: mediaType,
            title: mediaType === 'movie' ? title : '',
            name: mediaType === 'tv' ? title : '',
            poster_path: posterPath || null,
            backdrop_path: null,
            vote_average: 0,
            release_date: '',
            first_air_date: '',
            overview: ''
          }}
          currentVideoUrl={currentVideoUrl}
          selectedSourceIndex={selectedSourceIndex}
          onPartyCreated={handleOnPartyCreated}
        />
      )}

      {showJoinModal && (
        <JoinPartyModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
        />
      )}
    </>
  );
};

export default WatchPartyButton;
