'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export interface WatchlistItem {
  id: string
  media_id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  overview: string | null
  release_date: string | null
  created_at: string
}

export interface WatchHistoryItem {
  id: string
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

export function useUserData() {
  const { user } = useAuth()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([])
  const [loading, setLoading] = useState(false)

  // Load user data when user changes
  useEffect(() => {
    if (user) {
      loadUserData()
    } else {
      // Clear data when user logs out
      setWatchlist([])
      setWatchHistory([])
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Load watchlist
      const { data: watchlistData, error: watchlistError } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (watchlistError) {
        console.error('Error loading watchlist:', watchlistError)
      } else {
        setWatchlist((watchlistData as unknown as WatchlistItem[]) || [])
      }

      // Load watch history
      const { data: historyData, error: historyError } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', user.id)
        .order('watched_at', { ascending: false })
        .limit(50) // Limit to recent 50 items

      if (historyError) {
        console.error('Error loading watch history:', historyError)
      } else {
        setWatchHistory((historyData as unknown as WatchHistoryItem[]) || [])
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToWatchlist = async (item: {
    media_id: number
    media_type: 'movie' | 'tv'
    title: string
    poster_path?: string | null
    overview?: string | null
    release_date?: string | null
  }) => {
    if (!user) return { error: 'User not authenticated' }

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .insert({
          user_id: user.id,
          media_id: item.media_id,
          media_type: item.media_type,
          title: item.title,
          poster_path: item.poster_path,
          overview: item.overview,
          release_date: item.release_date,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return { error: 'Item already in watchlist' }
        }
        console.error('Error adding to watchlist:', error)
        return { error: error.message }
      }

      // Update local state
      setWatchlist(prev => [(data as unknown as WatchlistItem), ...prev])
      return { data }
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      return { error: 'Failed to add to watchlist' }
    }
  }

  const removeFromWatchlist = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!user) return { error: 'User not authenticated' }

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('media_id', mediaId)
        .eq('media_type', mediaType)

      if (error) {
        console.error('Error removing from watchlist:', error)
        return { error: error.message }
      }

      // Update local state
      setWatchlist(prev => 
        prev.filter(item => !(item.media_id === mediaId && item.media_type === mediaType))
      )
      return { success: true }
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      return { error: 'Failed to remove from watchlist' }
    }
  }

  const addToWatchHistory = async (item: {
    media_id: number
    media_type: 'movie' | 'tv'
    title: string
    poster_path?: string | null
    season_number?: number | null
    episode_number?: number | null
    progress?: number
  }) => {
    if (!user) return { error: 'User not authenticated' }

    try {
      const { data, error } = await supabase
        .from('watch_history')
        .insert({
          user_id: user.id,
          media_id: item.media_id,
          media_type: item.media_type,
          title: item.title,
          poster_path: item.poster_path,
          season_number: item.season_number,
          episode_number: item.episode_number,
          progress: item.progress || 0,
          watched_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding to watch history:', error)
        return { error: error.message }
      }

      // Update local state (add to beginning and limit to 50 items)
      setWatchHistory(prev => [(data as unknown as WatchHistoryItem), ...prev].slice(0, 50))
      return { data }
    } catch (error) {
      console.error('Error adding to watch history:', error)
      return { error: 'Failed to add to watch history' }
    }
  }

  const clearWatchlist = async () => {
    if (!user) return { error: 'User not authenticated' }

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error('Error clearing watchlist:', error)
        return { error: error.message }
      }

      setWatchlist([])
      return { success: true }
    } catch (error) {
      console.error('Error clearing watchlist:', error)
      return { error: 'Failed to clear watchlist' }
    }
  }

  const clearWatchHistory = async () => {
    if (!user) return { error: 'User not authenticated' }

    try {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error('Error clearing watch history:', error)
        return { error: error.message }
      }

      setWatchHistory([])
      return { success: true }
    } catch (error) {
      console.error('Error clearing watch history:', error)
      return { error: 'Failed to clear watch history' }
    }
  }

  const isInWatchlist = (mediaId: number, mediaType: 'movie' | 'tv') => {
    return watchlist.some(item => item.media_id === mediaId && item.media_type === mediaType)
  }

  return {
    // Data
    watchlist,
    watchHistory,
    loading,
    
    // Actions
    addToWatchlist,
    removeFromWatchlist,
    addToWatchHistory,
    clearWatchlist,
    clearWatchHistory,
    isInWatchlist,
    loadUserData,
  }
}
