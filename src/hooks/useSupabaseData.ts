'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface WatchlistItem {
  id?: string
  media_id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  overview: string | null
  release_date: string | null
  created_at?: string
}

export interface WatchHistoryItem {
  id?: string
  media_id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  season_number?: number | null
  episode_number?: number | null
  progress: number
  watched_at?: string
  created_at?: string
}

export function useSupabaseWatchlist() {
  const { user } = useAuth()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch watchlist from Supabase
  const fetchWatchlist = async () => {
    if (!user) {
      setWatchlist([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setWatchlist((data as unknown as WatchlistItem[]) || [])
    } catch (err) {
      console.error('Error fetching watchlist:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch watchlist')
    } finally {
      setLoading(false)
    }
  }

  // Add item to watchlist
  const addToWatchlist = async (item: Omit<WatchlistItem, 'id' | 'created_at'>) => {
    if (!user) {
      setError('You must be signed in to add items to your watchlist')
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .insert({
          user_id: user.id,
          ...item
        })
        .select()
        .single()

      if (error) throw error

      setWatchlist(prev => [(data as unknown as WatchlistItem), ...prev])
      return { success: true, data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to watchlist'
      setError(errorMessage)
      console.error('Error adding to watchlist:', err)
      return { success: false, error: errorMessage }
    }
  }

  // Remove item from watchlist
  const removeFromWatchlist = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!user) {
      setError('You must be signed in to remove items from your watchlist')
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('media_id', mediaId)
        .eq('media_type', mediaType)

      if (error) throw error

      setWatchlist(prev => prev.filter(item => 
        !(item.media_id === mediaId && item.media_type === mediaType)
      ))
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove from watchlist'
      setError(errorMessage)
      console.error('Error removing from watchlist:', err)
      return { success: false, error: errorMessage }
    }
  }

  // Check if item is in watchlist
  const isInWatchlist = (mediaId: number, mediaType: 'movie' | 'tv') => {
    return watchlist.some(item => item.media_id === mediaId && item.media_type === mediaType)
  }

  // Clear entire watchlist
  const clearWatchlist = async () => {
    if (!user) {
      setError('You must be signed in to clear your watchlist')
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      setWatchlist([])
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear watchlist'
      setError(errorMessage)
      console.error('Error clearing watchlist:', err)
      return { success: false, error: errorMessage }
    }
  }

  // Migrate localStorage watchlist to Supabase
  const migrateLocalWatchlist = async () => {
    if (!user) return { success: false, error: 'Not authenticated' }

    try {
      const localWatchlist = localStorage.getItem('watchlist')
      if (!localWatchlist) return { success: true, migrated: 0 }

      const items = JSON.parse(localWatchlist)
      if (!Array.isArray(items) || items.length === 0) {
        return { success: true, migrated: 0 }
      }

      // Prepare items for insertion
      const watchlistItems = items.map(item => ({
        user_id: user.id,
        media_id: item.id,
        media_type: item.media_type || 'movie',
        title: item.title || item.name || 'Unknown Title',
        poster_path: item.poster_path || null,
        overview: item.overview || null,
        release_date: item.release_date || item.first_air_date || null
      }))

      // Insert items (using upsert to handle duplicates)
      const { data, error } = await supabase
        .from('watchlist')
        .upsert(watchlistItems, { 
          onConflict: 'user_id,media_id,media_type',
          ignoreDuplicates: true 
        })
        .select()

      if (error) throw error

      // Clear localStorage after successful migration
      localStorage.removeItem('watchlist')
      
      // Refresh watchlist
      await fetchWatchlist()

      return { success: true, migrated: data?.length || 0 }
    } catch (err) {
      console.error('Error migrating watchlist:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Migration failed' 
      }
    }
  }

  // Fetch watchlist when user changes
  useEffect(() => {
    fetchWatchlist()
  }, [user])

  // Auto-migrate localStorage watchlist when user signs in
  useEffect(() => {
    if (user && watchlist.length === 0) {
      migrateLocalWatchlist()
    }
  }, [user])

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    clearWatchlist,
    refreshWatchlist: fetchWatchlist,
    migrateLocalWatchlist
  }
}

export function useSupabaseWatchHistory() {
  const { user } = useAuth()
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([])
  const [continueWatching, setContinueWatching] = useState<WatchHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch watch history from Supabase
  const fetchWatchHistory = async () => {
    if (!user) {
      setWatchHistory([])
      setContinueWatching([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', user.id)
        .order('watched_at', { ascending: false })

      if (error) throw error

      const history = (data as unknown as WatchHistoryItem[]) || []
      setWatchHistory(history)
      
      // Separate continue watching (progress < 90%) from completed
      const continuing = history.filter(item => item.progress < 90)
      setContinueWatching(continuing)
    } catch (err) {
      console.error('Error fetching watch history:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch watch history')
    } finally {
      setLoading(false)
    }
  }

  // Add or update watch history
  const addToWatchHistory = async (item: Omit<WatchHistoryItem, 'id' | 'created_at' | 'watched_at'>) => {
    if (!user) {
      setError('You must be signed in to save watch history')
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const { data, error } = await supabase
        .from('watch_history')
        .upsert({
          user_id: user.id,
          watched_at: new Date().toISOString(),
          ...item
        }, {
          onConflict: 'user_id,media_id,media_type,season_number,episode_number'
        })
        .select()
        .single()

      if (error) throw error

      // Refresh history
      await fetchWatchHistory()
      
      return { success: true, data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save watch history'
      setError(errorMessage)
      console.error('Error adding to watch history:', err)
      return { success: false, error: errorMessage }
    }
  }

  // Remove from watch history
  const removeFromWatchHistory = async (id: string) => {
    if (!user) {
      setError('You must be signed in to remove watch history')
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setWatchHistory(prev => prev.filter(item => item.id !== id))
      setContinueWatching(prev => prev.filter(item => item.id !== id))
      
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove from watch history'
      setError(errorMessage)
      console.error('Error removing from watch history:', err)
      return { success: false, error: errorMessage }
    }
  }

  // Clear watch history
  const clearWatchHistory = async () => {
    if (!user) {
      setError('You must be signed in to clear watch history')
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      setWatchHistory([])
      setContinueWatching([])
      
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear watch history'
      setError(errorMessage)
      console.error('Error clearing watch history:', err)
      return { success: false, error: errorMessage }
    }
  }

  // Fetch history when user changes
  useEffect(() => {
    fetchWatchHistory()
  }, [user])

  return {
    watchHistory,
    continueWatching,
    loading,
    error,
    addToWatchHistory,
    removeFromWatchHistory,
    clearWatchHistory,
    refreshWatchHistory: fetchWatchHistory
  }
}
