// src/types/watchParty.ts
export interface WatchParty {
  id: string;
  host_id: string;
  title: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  poster_path?: string;
  invite_code: string;
  description?: string;
  is_public: boolean;
  max_participants: number | null;
  status?: 'waiting' | 'active' | 'ended'; // Mark as optional since it might not exist in DB
  is_active?: boolean; // Add is_active field from database
  video_url?: string;
  selected_source_index?: number;
  created_at: string;
  updated_at: string;
  participant_count?: number;
  host?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface PartyParticipant {
  id: string;
  party_id: string;
  user_id: string;
  joined_at: string;
  last_active: string; // Changed from is_active boolean to last_active timestamp
  is_host?: boolean; // Add is_host field that's used in the database
  profiles?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface PartyMessage {
  id: string;
  party_id: string;
  user_id: string;
  message: string; // Changed from 'content' to 'message' to match database schema
  message_type: 'chat' | 'system';
  created_at: string;
  profiles?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface CreatePartyData {
  title: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  poster_path?: string;
  description?: string;
  is_public: boolean;
  max_participants: number;
  video_url?: string;
  selected_source_index?: number;
}
