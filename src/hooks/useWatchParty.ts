'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { WatchParty, PartyParticipant, PartyMessage, CreatePartyData } from '@/types/watchParty';

export const useWatchParty = (partyId?: string) => {
  const { user } = useAuth();
  const [party, setParty] = useState<WatchParty | null>(null);
  const [participants, setParticipants] = useState<PartyParticipant[]>([]);
  const [messages, setMessages] = useState<PartyMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track join attempts to prevent duplicates
  const joinAttempted = useRef(false);
  
  // Track component mount state to prevent state updates after unmount
  const isMounted = useRef(true);

  // Generate random invite code
  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Create a new watch party
  const createParty = useCallback(async (data: CreatePartyData): Promise<string | null> => {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log('createParty called with data:', data);
      console.log('Current user:', user);
    }
    
    if (!user) {
      if (isDev) {
        console.log('No user - setting error');
      }
      if (isMounted.current) setError('You must be logged in to create a party');
      return null;
    }

    if (isMounted.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const inviteCode = generateInviteCode();
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        console.log('Generated invite code:', inviteCode);
      }
      
      const insertData = {
        host_id: user.id,
        invite_code: inviteCode,
        ...data
      };
      
      if (isDev) {
        console.log('Insert data:', insertData);
      }
      
      const { data: newParty, error: createError } = await supabase
        .from('watch_parties')
        .insert(insertData)
        .select()
        .single();

      if (!isMounted.current) return null;
      if (isDev) {
        console.log('Supabase response:', { newParty, createError });
      }

      if (createError) throw createError;

      // Type assert the new party
      const typedNewParty = newParty as unknown as WatchParty;
      if (!typedNewParty || !typedNewParty.id) {
        throw new Error('Failed to create party: no ID returned');
      }

      // Add host as participant
      if (isDev) {
        console.log('Adding host as participant...');
      }
      const { error: participantError } = await supabase
        .from('party_participants')
        .insert({
          party_id: typedNewParty.id,
          user_id: user.id,
          is_host: true
        });

      if (!isMounted.current) return null;
      
      if (participantError) {
        console.error('Participant insert error:', participantError);
        throw participantError;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Party created successfully with ID:', typedNewParty.id);
      }
      return typedNewParty.id;
    } catch (err) {
      console.error('Error creating party:', err);
      if (isMounted.current) setError('Failed to create party');
      return null;
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [user]);
  // Join a party by ID (direct join)
  const joinParty = useCallback(async (targetPartyId: string): Promise<{videoUrl?: string; selectedSourceIndex?: number} | void> => {
    if (!user) {
      if (isMounted.current) setError('You must be logged in to join a party');
      throw new Error('User not logged in');
    }

    // Prevent duplicate join attempts
    if (joinAttempted.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Join already attempted, skipping...');
      }
      return;
    }

    // Set the flag before any async operations
    joinAttempted.current = true;

    if (isMounted.current) {
      setLoading(true);
      setError(null);
    }

    try {
      // Check if party exists and is active, and fetch video source data
      const { data: partyData, error: partyError } = await supabase
        .from('watch_parties')
        .select('id, is_active, video_url, selected_source_index')
        .eq('id', targetPartyId)
        .maybeSingle();

      if (!isMounted.current) return;

      if (partyError) {
        console.error('Party fetch error:', partyError);
        throw new Error(`Failed to check party: ${partyError.message}`);
      }

      if (!partyData) {
        throw new Error('Party not found');
      }

      const typedPartyData = partyData as unknown as WatchParty;
      if (!typedPartyData.is_active) {
        throw new Error('Party is no longer active');
      }

      // Check if already a participant
      const { data: existingParticipant, error: participantError } = await supabase
        .from('party_participants')
        .select('id, last_active')
        .eq('party_id', targetPartyId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isMounted.current) return;

      if (participantError) {
        console.error('Error checking participant status:', participantError);
        // Continue with caution
      }      
      
      const typedExistingParticipant = existingParticipant as unknown as PartyParticipant | null;
      if (typedExistingParticipant) {
        // User is already a participant - update last_active to current time
        const { error: updateError } = await supabase
          .from('party_participants')
          .update({ last_active: new Date().toISOString() })
          .eq('id', typedExistingParticipant.id);

        if (!isMounted.current) return;

        if (updateError) {
          console.error('Error reactivating participant:', updateError);
        } else {
          // Don't send "rejoined the party" message on page load/reload
          // Only send it if the user was previously inactive for a significant time
          const lastActiveTime = new Date(typedExistingParticipant.last_active).getTime();
          const currentTime = Date.now();
          const timeDifference = currentTime - lastActiveTime;
          const REJOIN_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
          
          // Only send rejoin message if user was inactive for more than 5 minutes
          if (timeDifference > REJOIN_THRESHOLD) {
            try {
              if (isMounted.current) {
                await supabase
                  .from('party_messages')
                  .insert({
                    party_id: targetPartyId,
                    user_id: user.id,
                    message: 'rejoined the party',
                    message_type: 'system'
                  });
              }
            } catch (msgError) {
              console.error('Failed to send rejoin message:', msgError);
              // Don't fail the join if message fails
            }
          }
        }
        return; // Already a participant, no need to insert
      }

      // Add as new participant
      const { error: insertError } = await supabase
        .from('party_participants')
        .insert({
          party_id: targetPartyId,
          user_id: user.id,
          is_host: false
        });

      if (!isMounted.current) return;

      if (insertError) {
        console.error('Error adding participant:', insertError);
        throw insertError;
      }      // Send join message (non-critical operation)
      if (isMounted.current) {        try {
          await supabase
            .from('party_messages')
            .insert({
              party_id: targetPartyId,
              user_id: user.id,
              message: 'joined the party',
              message_type: 'system'
            });
        } catch (msgError) {
          console.error('Failed to send join message:', msgError);
          // Don't fail the join if message fails
        }
      }

      // Return video source data for component to handle redirection
      return {
        videoUrl: typedPartyData.video_url || undefined,
        selectedSourceIndex: typedPartyData.selected_source_index || undefined
      };
    } catch (err) {
      console.error('Error joining party:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to join party');
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [user]);
  // Leave party
  const leaveParty = useCallback(async (targetPartyId?: string) => {
    if (!user) {
      throw new Error('You must be logged in to leave a party');
    }

    const partyToLeave = targetPartyId || partyId;
    if (!partyToLeave) {
      throw new Error('No party ID provided');
    }

    try {
      // Update participant last_active to mark as inactive instead of deleting
      const { error } = await supabase
        .from('party_participants')
        .update({ last_active: new Date(0).toISOString() }) // Set to epoch to mark as inactive
        .eq('party_id', partyToLeave)
        .eq('user_id', user.id);

      if (!isMounted.current) return;

      if (error) {
        console.error('Supabase error leaving party:', error);
        throw new Error(error.message || 'Failed to leave party');
      }

      // Send leave message
      if (isMounted.current) {
        await supabase
          .from('party_messages')
          .insert({
            party_id: partyToLeave,
            user_id: user.id,
            message: 'left the party',
            message_type: 'system'
          });
      }

      // Reset join attempt when leaving
      joinAttempted.current = false;
    } catch (err) {
      console.error('Error leaving party:', err);
      if (isMounted.current) {
        setError('Failed to leave party');
      }
      // Rethrow the error so the calling code can handle it
      throw err;
    }
  }, [user, partyId]);

  // Update party status (host only)
  const updatePartyStatus = useCallback(async (targetPartyId: string, status: 'waiting' | 'active' | 'ended') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('watch_parties')
        .update({ 
          is_active: status === 'active', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', targetPartyId)
        .eq('host_id', user.id); // Only host can update

      if (!isMounted.current) return;

      if (error) throw error;

      // Send status change message
      const statusMessages = {
        waiting: 'paused the party',
        active: 'started the party',
        ended: 'ended the party'
      };

      if (isMounted.current) {        await supabase
          .from('party_messages')
          .insert({
            party_id: targetPartyId,
            user_id: user.id,
            message: statusMessages[status],
            message_type: 'system'
          });
      }    } catch (err) {
      console.error('Error updating party status:', err);
      console.error('Status update error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        name: err instanceof Error ? err.name : 'UnknownError',
        targetPartyId,
        status,
        rawError: err
      });
      if (isMounted.current) {
        setError('Failed to update party status');
      }
      // Rethrow the error so calling code can handle it
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, [user]);

  // Update party video source (host only)
  const updatePartyVideoSource = useCallback(async (targetPartyId: string, videoUrl: string, selectedSourceIndex: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('watch_parties')
        .update({ 
          video_url: videoUrl,
          selected_source_index: selectedSourceIndex,
          updated_at: new Date().toISOString() 
        })
        .eq('id', targetPartyId)
        .eq('host_id', user.id); // Only host can update

      if (!isMounted.current) return;

      if (error) throw error;

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Party video source updated:', { targetPartyId, videoUrl, selectedSourceIndex });
      }
    } catch (err) {
      console.error('Error updating party video source:', err);
      if (isMounted.current) {
        setError('Failed to update party video source');
      }
    }
  }, [user]);  // Delete party (host only)
  const deleteParty = useCallback(async (targetPartyId: string) => {
    if (!user) {
      throw new Error('You must be logged in to delete a party');
    }

    try {
      // First, delete all party participants
      const { error: participantsError } = await supabase
        .from('party_participants')
        .delete()
        .eq('party_id', targetPartyId);      if (participantsError) {
        console.error('Error deleting party participants:', participantsError);
        console.error('Participants deletion error details:', {
          message: participantsError.message,
          code: participantsError.code,
          details: participantsError.details,
          hint: participantsError.hint,
          targetPartyId
        });
        throw new Error(participantsError.message || 'Failed to delete party participants');
      }

      // Then, delete all party messages
      const { error: messagesError } = await supabase
        .from('party_messages')
        .delete()
        .eq('party_id', targetPartyId);

      if (messagesError) {
        console.error('Error deleting party messages:', messagesError);
        throw new Error(messagesError.message || 'Failed to delete party messages');
      }

      // Finally, delete the party itself
      const { error } = await supabase
        .from('watch_parties')
        .delete()
        .eq('id', targetPartyId)
        .eq('host_id', user.id); // Only host can delete

      if (!isMounted.current) return;

      if (error) {
        console.error('Supabase error deleting party:', error);
        throw new Error(error.message || 'Failed to delete party');
      }    } catch (err) {
      console.error('Error deleting party:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        name: err instanceof Error ? err.name : 'UnknownError',
        stack: err instanceof Error ? err.stack : undefined,
        rawError: err
      });
      if (isMounted.current) {
        setError('Failed to delete party');
      }
      // Rethrow the error so the calling code can handle it
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, [user]);
  // Join party by invite code
  const joinPartyByCode = useCallback(async (inviteCode: string): Promise<{partyId: string; videoUrl?: string; selectedSourceIndex?: number} | null> => {
    if (!user) {
      if (isMounted.current) setError('You must be logged in to join a party');
      return null;
    }

    if (isMounted.current) {
      setLoading(true);
      setError(null);
    }    try {
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        console.log('🔍 Looking for party with invite code:', inviteCode.toUpperCase());
      }
      
      // Find party by invite code and fetch video source data
      const { data: partyData, error: partyError } = await supabase
        .from('watch_parties')
        .select('id, is_active, video_url, selected_source_index')
        .eq('invite_code', inviteCode.toUpperCase())
        .maybeSingle();

      if (isDev) {
        console.log('📋 Party lookup result:', { partyData, partyError });
      }

      if (!isMounted.current) return null;

      if (partyError) {
        console.error('❌ Database error looking up party:', partyError);
        throw new Error(`Database error: ${partyError.message}`);
      }
      
      if (!partyData) {
        console.error('❌ No party found with invite code:', inviteCode.toUpperCase());
        throw new Error('Invalid invite code');
      }

      const typedPartyData = partyData as unknown as WatchParty;
      if (!typedPartyData.is_active) {
        if (isMounted.current) setError('This party has ended');
        return null;
      }

      // Check if already a participant
      const { data: existingParticipant } = await supabase
        .from('party_participants')
        .select('id, last_active')
        .eq('party_id', typedPartyData.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isMounted.current) return null;

      const typedExistingParticipant = existingParticipant as unknown as PartyParticipant | null;
      if (!typedExistingParticipant) {
        // Add as participant
        const { error: joinError } = await supabase
          .from('party_participants')
          .insert({
            party_id: typedPartyData.id,
            user_id: user.id,
            is_host: false,
          });

        if (!isMounted.current) return null;

        if (joinError) throw joinError;

        // Send join message
        if (isMounted.current) {          await supabase
            .from('party_messages')
            .insert({
              party_id: typedPartyData.id,
              user_id: user.id,
              message: 'joined the party',
              message_type: 'system'
            });
        }
      } else {
        // Reactivate existing participant
        await supabase
          .from('party_participants')
          .update({ last_active: new Date().toISOString() })
          .eq('id', typedExistingParticipant.id);

        if (!isMounted.current) return null;

        // Send rejoin message
        if (isMounted.current) {          await supabase
            .from('party_messages')
            .insert({
              party_id: typedPartyData.id,
              user_id: user.id,
              message: 'rejoined the party',
              message_type: 'system'
            });        }
      }

      // Return party ID and video source data for component to handle redirection
      return {
        partyId: typedPartyData.id,
        videoUrl: typedPartyData.video_url || undefined,
        selectedSourceIndex: typedPartyData.selected_source_index || undefined
      };
    } catch (err) {
      console.error('Error joining party:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to join party');
      }
      return null;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [user]);  // Manual refresh function for debugging
  const refreshMessages = useCallback(async () => {
    if (!partyId) return;
    
    try {
      const { data: messagesData, error } = await supabase
        .from('party_messages')
        .select('*')
        .eq('party_id', partyId)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (!error && messagesData) {
        setMessages(messagesData as unknown as PartyMessage[]);
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Messages manually refreshed:', messagesData.length);
        }
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  }, [partyId]);// Send a message
  const sendMessage = useCallback(async (content: string, messageType: 'chat' | 'system' = 'chat'): Promise<void> => {
    if (!user || !partyId) {
      console.error('Cannot send message: missing user or partyId');
      throw new Error('You must be logged in and in a party to send messages');
    }

    // Log authentication state for debugging (development only)
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log('🔑 User authentication state:', {
        userId: user.id,
        email: user.email,
        isAuthenticated: !!user
      });

      // Check current session from Supabase client
      const { data: sessionCheck } = await supabase.auth.getSession();
      console.log('📋 Supabase session check:', {
        hasSession: !!sessionCheck.session,
        sessionUserId: sessionCheck.session?.user?.id,
        expiresAt: sessionCheck.session?.expires_at
      });
    }

    // Create message object for database
    const messageData = {
      party_id: partyId,
      user_id: user.id,
      message: content,
      message_type: messageType
    };
    
    if (isDev) {
      console.log('💾 Attempting to save message to database:', messageData);
    }
    
    try {
      const { data, error } = await supabase
        .from('party_messages')
        .insert(messageData)
        .select()
        .single();

      if (!isMounted.current) return;

      if (error) {
        console.error('❌ Database error sending message:', error);
        console.error('Error details:', {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint
        });
        
        // Check if it's an authentication/RLS error
        if (error.code === '42501') {
          console.error('🚫 RLS Policy Violation - User may not be properly authenticated');
          if (process.env.NODE_ENV === 'development') {
            console.error('💡 This usually means the session is missing or expired');
          }
          throw new Error('Authentication error: Please try logging out and back in');
        }
        
        throw error;
      }
      
      if (isDev) {
        console.log('✅ Message saved successfully:', data);
      }
      
      // Add message to UI (real-time subscription should also pick this up)
      if (isMounted.current) {
        const typedMessage = data as unknown as PartyMessage;
        setMessages(prev => {
          // Avoid duplicates in case real-time subscription fires first
          if (prev.some(m => m.id === typedMessage.id)) {
            if (isDev) {
              console.log('📝 Message already exists from real-time, skipping duplicate');
            }
            return prev;
          }
          if (isDev) {
            console.log('📨 Adding message to UI:', typedMessage);
          }
          return [...prev, typedMessage];
        });
      }
    } catch (err: any) {
      console.error('❌ Error sending message:', err);
      if (process.env.NODE_ENV === 'development') {
        console.error('Error details:', {
          message: err?.message,
          code: err?.code,
          details: err?.details,
          hint: err?.hint
        });
      }
      
      if (isMounted.current) {
        setError('Failed to send message: ' + (err?.message || 'Unknown error'));
      }
      throw err;
    }
  }, [user, partyId]);

  // Get user's parties
  const getUserParties = useCallback(async (): Promise<WatchParty[]> => {
    if (!user) {
      console.log('No user for getUserParties');
      return [];
    }    try {
      // Get parties where user is host or participant
      const { data: hostParties, error: hostError } = await supabase
        .from('watch_parties')
        .select('*')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false });

      if (hostError) {
        console.error('Error fetching host parties:', hostError);
        throw hostError;
      }

      // Get parties where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('party_participants')
        .select(`
          party_id,
          watch_parties!inner(*)
        `)
        .eq('user_id', user.id)
        .gte('last_active', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Active within 24 hours

      if (participantError) {
        console.error('Error fetching participant parties:', participantError);
        throw participantError;
      }      // Extract party data from nested structure and filter parties
      const typedHostParties = (hostParties as unknown as WatchParty[]) || [];
      const participantParties = participantData
        ?.map((p: any) => p.watch_parties as unknown as WatchParty)
        .filter((party: WatchParty | null | undefined): party is WatchParty => 
          party != null && 
          typeof party === 'object' && 
          party.host_id !== user.id
        ) || []; // Exclude parties where user is host to avoid duplicates

      // Combine and deduplicate parties
      const allParties = [...typedHostParties, ...participantParties];
      const uniqueParties = allParties.filter((party, index, self) => 
        index === self.findIndex(p => p.id === party.id)
      );
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ User parties fetched:', uniqueParties.length);
      }
      return uniqueParties;
    } catch (err) {
      console.error('Error fetching user parties:', err);
      throw err;
    }
  }, [user]);

  // Check if user has an existing party for specific media
  const checkExistingPartyForMedia = useCallback(async (_mediaId: number, _mediaType: 'movie' | 'tv'): Promise<WatchParty | null> => {
    return null;
  }, []);

  // Reset join attempt when user or partyId changes
  useEffect(() => {
    joinAttempted.current = false;
  }, [user?.id, partyId]);

  // Set up real-time subscriptions and initial data fetch
  useEffect(() => {
    if (!partyId) {
      // Reset state when no partyId
      setParty(null);
      setParticipants([]);
      setMessages([]);
      return;
    }

    let isMountedLocal = true;
    isMounted.current = true;

    // Initial data fetch with proper error handling
    const initializeParty = async () => {
      if (!isMounted.current) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch party details
        const { data: partyData, error: partyError } = await supabase
          .from('watch_parties')
          .select('*')
          .eq('id', partyId)
          .maybeSingle();

        if (!isMountedLocal || !isMounted.current) return;

        if (partyError) {
          console.error('Party fetch error:', partyError);
          setError(`Party not found: ${partyError.message}`);
          return;
        }

        if (!partyData) {
          setError('Party not found');
          return;
        }
        
        // Map is_active to status for compatibility
        const typedPartyData = partyData as unknown as WatchParty;
        if (typedPartyData && !typedPartyData.status) {
          typedPartyData.status = typedPartyData.is_active ? 'active' : 'waiting';
        }
        
        setParty(typedPartyData);        // Fetch participants (without profile joins due to foreign key issues)
        const { data: participantsData, error: participantsError } = await supabase
          .from('party_participants')
          .select('*')
          .eq('party_id', partyId)
          .order('joined_at', { ascending: true });        if (isMountedLocal && isMounted.current) {
          if (participantsError) {
            console.error('❌ Participants fetch error:', participantsError);
            setParticipants([]);
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Participants loaded successfully:', participantsData?.length || 0);
            }
            setParticipants((participantsData as unknown as PartyParticipant[]) || []);
          }
        }// Fetch recent messages (without profile joins to avoid foreign key errors)
        const { data: messagesData, error: messagesError } = await supabase
          .from('party_messages')
          .select('*')
          .eq('party_id', partyId)
          .order('created_at', { ascending: true })
          .limit(100);        if (isMountedLocal && isMounted.current) {
          if (messagesError) {
            console.error('❌ Messages fetch error:', messagesError);
            setMessages([]);
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Messages loaded successfully:', messagesData?.length || 0);
            }
            setMessages((messagesData as unknown as PartyMessage[]) || []);
          }
        }

      } catch (err) {
        if (isMountedLocal && isMounted.current) {
          console.error('Error fetching party data:', err);
          setError(err instanceof Error ? err.message : 'Failed to load party data');
        }
      } finally {
        if (isMountedLocal && isMounted.current) {
          setLoading(false);
        }
      }
    };

    initializeParty();    // Subscribe to participants changes with enhanced debugging
    const participantsSubscription = supabase
      .channel(`party-participants-${partyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'party_participants',
          filter: `party_id=eq.${partyId}`
        },
        (payload) => {
          if (!isMountedLocal || !isMounted.current) return;
          
          const isDev = process.env.NODE_ENV === 'development';
          if (isDev) {
            console.log('👥 Participants subscription payload:', payload);
            console.log('👤 Current user in participants subscription:', user?.id);
          }
          
          if (payload.eventType === 'INSERT') {
            const newParticipant = payload.new as unknown as PartyParticipant;
            setParticipants(prev => {
              // Avoid duplicates
              if (prev.some(p => p.id === newParticipant.id)) return prev;
              if (isDev) {
                console.log('✅ Adding new participant:', newParticipant);
              }
              return [...prev, newParticipant];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedParticipant = payload.new as unknown as PartyParticipant;
            if (isDev) {
              console.log('🔄 Updating participant:', updatedParticipant);
            }
            setParticipants(prev => 
              prev.map(p => p.id === updatedParticipant.id ? updatedParticipant : p)
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedParticipant = payload.old as unknown as PartyParticipant;
            if (isDev) {
              console.log('❌ Removing participant:', deletedParticipant);
            }
            setParticipants(prev => prev.filter(p => p.id !== deletedParticipant.id));
          }
        }
      )
      .subscribe((status, err) => {
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) {
          console.log('👥 Participants subscription status:', status);
          console.log('👤 Participants subscription user context:', user?.id);
        }
        if (err) {
          console.error('❌ Participants subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          if (isDev) {
            console.log('✅ Successfully subscribed to participants for party:', partyId);
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Participants channel error - likely RLS policy issue');
        }
      });// Subscribe to messages with enhanced debugging
    const messagesSubscription = supabase
      .channel(`party-messages-${partyId}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'party_messages',
          filter: `party_id=eq.${partyId}`
        },
        async (payload) => {
          if (!isMountedLocal || !isMounted.current) return;
          
          const isDev = process.env.NODE_ENV === 'development';
          if (isDev) {
            console.log('🔄 Real-time message received:', payload);
            console.log('👤 Current user in subscription:', user?.id);
            console.log('🏠 Is host:', party?.host_id === user?.id);
          }
          
          const newMessage = payload.new as unknown as PartyMessage;
          
          // Simply add the new message without trying to fetch profile data
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) {
              if (isDev) {
                console.log('📝 Message already exists, skipping duplicate');
              }
              return prev;
            }
            if (isDev) {
              console.log('✅ Adding new message to UI:', newMessage);
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe((status, err) => {
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) {
          console.log('📡 Messages subscription status:', status);
          console.log('👤 Subscription user context:', user?.id);
          console.log('🔑 Auth status:', user ? 'Authenticated' : 'Not authenticated');
        }
        if (err) {
          console.error('❌ Messages subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          if (isDev) {
            console.log('✅ Successfully subscribed to messages for party:', partyId);
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error - likely RLS policy blocking subscription');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Subscription timed out');
        }
      });

    // Subscribe to party status changes
    const partySubscription = supabase
      .channel(`party-${partyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'watch_parties',
          filter: `id=eq.${partyId}`
        },
        (payload) => {
          if (!isMountedLocal || !isMounted.current) return;
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Party subscription payload:', payload);
          }
          
          const updatedParty = payload.new as unknown as WatchParty;
          setParty(updatedParty);
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up subscriptions for party:', partyId);
      isMountedLocal = false;
      isMounted.current = false;
      participantsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
      partySubscription.unsubscribe();    };
  }, [partyId]); // Only depend on partyId
  return {
    currentParty: party,
    participants,
    messages,
    loading,
    error,
    createParty,
    joinParty,
    joinPartyByCode,
    sendMessage,
    leaveParty,
    updatePartyStatus,
    updatePartyVideoSource,
    deleteParty,
    getUserParties,
    checkExistingPartyForMedia,
    refreshMessages, // Add manual refresh function for debugging
    resetJoinAttempt: () => { joinAttempted.current = false; },
    isHost: party && user ? party.host_id === user.id : false,
    isParticipant: participants.some(p => p.user_id === user?.id && new Date(p.last_active).getTime() > Date.now() - 5 * 60 * 1000) // Active within 5 minutes
  };
};