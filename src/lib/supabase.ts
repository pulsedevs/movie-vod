'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Database types (must be declared before createClient<Database> — fixes `.from()` inferring as `never`)
export type Database = {
  public: {
    Views: Record<string, never>
    Functions: Record<string, never>
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          id: string
          user_id: string
          media_id: number
          media_type: 'movie' | 'tv'
          title: string
          poster_path: string | null
          overview: string | null
          release_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          media_id: number
          media_type: 'movie' | 'tv'
          title: string
          poster_path?: string | null
          overview?: string | null
          release_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          media_id?: number
          media_type?: 'movie' | 'tv'
          title?: string
          poster_path?: string | null
          overview?: string | null
          release_date?: string | null
        }
        Relationships: []
      }
      watch_history: {
        Row: {
          id: string
          user_id: string
          media_id: number
          media_type: 'movie' | 'tv'
          title: string
          poster_path: string | null
          season_number: number | null
          episode_number: number | null
          progress: number
          watched_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          media_id: number
          media_type: 'movie' | 'tv'
          title?: string
          poster_path?: string | null
          season_number?: number | null
          episode_number?: number | null
          progress?: number
          watched_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          media_id?: number
          media_type?: 'movie' | 'tv'
          title?: string
          poster_path?: string | null
          season_number?: number | null
          episode_number?: number | null
          progress?: number
          watched_at?: string
        }
        Relationships: []
      }
      watch_parties: {
        Row: {
          id: string
          host_id: string
          media_id: number
          media_type: 'movie' | 'tv'
          title: string
          poster_path: string | null
          description: string | null
          invite_code: string
          is_public: boolean
          max_participants: number | null
          status: 'waiting' | 'active' | 'ended'
          is_active: boolean
          video_url: string | null
          selected_source_index: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_id: string
          media_id: number
          media_type: 'movie' | 'tv'
          title: string
          poster_path?: string | null
          description?: string | null
          invite_code: string
          is_public?: boolean
          max_participants?: number | null
          status?: 'waiting' | 'active' | 'ended'
          is_active?: boolean
          video_url?: string | null
          selected_source_index?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          media_id?: number
          media_type?: 'movie' | 'tv'
          title?: string
          poster_path?: string | null
          description?: string | null
          invite_code?: string
          is_public?: boolean
          max_participants?: number | null
          status?: 'waiting' | 'active' | 'ended'
          is_active?: boolean
          video_url?: string | null
          selected_source_index?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      party_participants: {
        Row: {
          id: string
          party_id: string
          user_id: string
          joined_at: string
          last_active: string
          is_host: boolean
          is_active: boolean
        }
        Insert: {
          id?: string
          party_id: string
          user_id: string
          joined_at?: string
          last_active?: string
          is_host?: boolean
          is_active?: boolean
        }
        Update: {
          id?: string
          party_id?: string
          user_id?: string
          joined_at?: string
          last_active?: string
          is_host?: boolean
          is_active?: boolean
        }
        Relationships: []
      }
      party_messages: {
        Row: {
          id: string
          party_id: string
          user_id: string
          message: string
          message_type: 'chat' | 'system'
          created_at: string
        }
        Insert: {
          id?: string
          party_id: string
          user_id: string
          message: string
          message_type?: 'chat' | 'system'
          created_at?: string
        }
        Update: {
          id?: string
          party_id?: string
          user_id?: string
          message?: string
          message_type?: 'chat' | 'system'
        }
        Relationships: []
      }
    }
  }
}

const GLOBAL_KEY = '__bf_supabase_client_v1__' as const

function getOrCreateClient(): SupabaseClient<Database> {
  const g = globalThis as unknown as Record<string, SupabaseClient<Database>>
  if (g[GLOBAL_KEY]) {
    return g[GLOBAL_KEY]
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Supabase Client Configuration:')
    console.log('URL present:', !!supabaseUrl)
    console.log('Key present:', !!supabaseAnonKey)
    console.log('URL value:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING')
  }

  let client: SupabaseClient<Database>

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase environment variables missing - using dummy client')
    client = createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  } else {
    client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storageKey: 'sb-auth-token',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        flowType: 'pkce',
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    })
  }

  g[GLOBAL_KEY] = client
  return client
}

/** Single client; globalThis avoids duplicate instances on Turbopack HMR. */
export const supabase: SupabaseClient<Database> = getOrCreateClient()
