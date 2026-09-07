'use client';

import { Crown, User, Circle } from 'lucide-react';
import { PartyParticipant } from '@/types/watchParty';

interface PartyParticipantsProps {
  participants: PartyParticipant[];
  hostId: string;
  currentUserId?: string;
  isMobile?: boolean;
}

export default function PartyParticipants({ participants, hostId, currentUserId, isMobile = false }: PartyParticipantsProps) {
  // Consider participants active if they were active within the last 5 minutes
  const activeParticipants = participants.filter(p => {
    const lastActiveTime = new Date(p.last_active).getTime();
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return lastActiveTime > fiveMinutesAgo;
  });
  
  const formatJoinTime = (timestamp: string) => {
    const joinTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - joinTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just joined';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return joinTime.toLocaleDateString();
  };
  return (
    <div className={isMobile ? "p-3" : "p-4"}>
      <div className={isMobile ? "mb-3" : "mb-4"}>
        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-white mb-2`}>
          Participants ({activeParticipants.length})
        </h3>
        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-400`}>
          People currently in this party
        </p>
      </div>

      <div className={isMobile ? "space-y-2" : "space-y-3"}>        {activeParticipants.length === 0 ? (
          <div className={`text-center text-gray-500 ${isMobile ? 'py-4' : 'py-8'}`}>
            <User className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} mx-auto mb-3 opacity-50`} />
            <p className={isMobile ? 'text-sm' : ''}>No one else here yet</p>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Invite friends to join!</p>
          </div>
        ) : (
          activeParticipants.map((participant) => {
            const isHost = participant.user_id === hostId;
            const isCurrentUser = participant.user_id === currentUserId;
            
            return (              <div
                key={participant.id}
                className={`flex items-center space-x-3 ${isMobile ? 'p-2' : 'p-3'} rounded-lg ${
                  isCurrentUser ? 'bg-blue-600/20 border border-blue-600/30' : 'bg-gray-700/50'
                }`}
              >
                {/* Avatar */}
                <div className="relative">                  {participant.profiles?.avatar_url ? (
                    <img
                      src={participant.profiles.avatar_url}
                      alt={participant.profiles?.full_name || 'User'}
                      className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover`}
                    />
                  ) : (
                    <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-gray-600 flex items-center justify-center`}>
                      <User className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-300`} />
                    </div>
                  )}
                  
                  {/* Online status */}
                  <div className="absolute -bottom-1 -right-1">
                    <Circle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-green-500 fill-current`} />
                  </div>
                  
                  {/* Host crown */}
                  {isHost && (
                    <div className="absolute -top-1 -right-1">
                      <Crown className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-yellow-500 fill-current`} />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className={`${isMobile ? 'text-sm' : ''} font-medium truncate ${isCurrentUser ? 'text-blue-400' : 'text-white'}`}>
                      {participant.profiles?.full_name || `User ${participant.user_id.slice(0, 8)}`}
                      {isCurrentUser && ' (You)'}
                    </h4>
                    {isHost && (
                      <span className={`${isMobile ? 'text-xs' : 'text-xs'} bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full`}>
                        Host
                      </span>
                    )}
                  </div>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400`}>
                    Joined {formatJoinTime(participant.joined_at)}
                  </p>
                </div>

                {/* Status indicator */}
                <div className="text-right">
                  <div className={`${isMobile ? 'w-2 h-2' : 'w-2 h-2'} bg-green-500 rounded-full`}></div>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 mt-1`}>Online</p>
                </div>
              </div>
            );
          })
        )}
      </div>      {/* Party Stats */}
      <div className={`${isMobile ? 'mt-4 pt-3' : 'mt-6 pt-4'} border-t border-gray-700`}>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white`}>{activeParticipants.length}</p>
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400`}>Active</p>
          </div>
          <div>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-400`}>{participants.length - activeParticipants.length}</p>
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400`}>Left</p>
          </div>
        </div>
      </div>
    </div>
  );
}
