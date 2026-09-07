'use client';

import { useState } from 'react';
import { Play, Pause, Settings, Users, Share, Trash2 } from 'lucide-react';
import { WatchParty } from '@/types/watchParty';
import { useWatchParty } from '@/hooks/useWatchParty';

interface PartyControlsProps {
  party: WatchParty;
  onUpdateParty: () => void;
}

export default function PartyControls({ party, onUpdateParty }: PartyControlsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { updatePartyStatus, deleteParty } = useWatchParty();

  const handleStatusChange = async (newStatus: 'waiting' | 'active' | 'ended') => {
    setIsUpdating(true);
    try {
      await updatePartyStatus(party.id, newStatus);
      onUpdateParty();
    } catch (error) {
      console.error('Failed to update party status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteParty = async () => {
    if (confirm('Are you sure you want to end this party? This cannot be undone.')) {
      setIsUpdating(true);
      try {
        await deleteParty(party.id);
        // Navigation will be handled by the parent component
      } catch (error) {
        console.error('Failed to delete party:', error);
        setIsUpdating(false);
      }
    }
  };

  return (
    <div className="mt-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Host Controls
          </h3>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {showSettings ? 'Hide' : 'Show'} Settings
          </button>        </div>        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(party.status === 'waiting' || (!party.status && !party.is_active)) && (
            <button
              onClick={() => handleStatusChange('active')}
              disabled={isUpdating}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Start Party</span>
            </button>
          )}

          {(party.status === 'active' || (!party.status && party.is_active)) && (
            <button
              onClick={() => handleStatusChange('waiting')}
              disabled={isUpdating}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <Pause className="w-4 h-4" />
              <span>Pause Party</span>
            </button>
          )}

          <button
            onClick={() => navigator.share?.({
              title: party.title,
              text: `Join my watch party: ${party.title}`,
              url: window.location.href
            })}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Share className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>

        {/* Advanced Settings */}
        {showSettings && (
          <div className="border-t border-gray-700 pt-4 space-y-4">
            {/* Party Status */}            <div>              <label className="block text-sm font-medium text-gray-300 mb-2">
                Party Status
              </label>
              <select
                value={party.status || (party.is_active ? "active" : "waiting")}
                onChange={(e) => handleStatusChange(e.target.value as 'waiting' | 'active' | 'ended')}
                disabled={isUpdating}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="waiting">Waiting - Party hasn't started</option>
                <option value="active">Active - Currently watching</option>
                <option value="ended">Ended - Party is over</option>
              </select>
            </div>

            {/* Privacy Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Privacy
              </label>              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={!party.is_public}
                    onChange={() => {/* TODO: Implement privacy change */}}
                    className="w-4 h-4 text-blue-600"
                    disabled
                  />
                  <span className="text-sm text-gray-300">Private (Invite only)</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={party.is_public}
                    onChange={() => {/* TODO: Implement privacy change */}}
                    className="w-4 h-4 text-blue-600"
                    disabled
                  />
                  <span className="text-sm text-gray-300">Public (Anyone can join)</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Privacy settings cannot be changed after creation
              </p>
            </div>

            {/* Max Participants */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Max Participants
              </label>
              <select
                value={party.max_participants || 10}
                onChange={() => {/* TODO: Implement max participants change */}}
                disabled
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white opacity-50"
              >
                <option value={5}>5 people</option>
                <option value={10}>10 people</option>
                <option value={20}>20 people</option>
                <option value={50}>50 people</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Participant limit cannot be changed after creation
              </p>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-red-900/50 pt-4">
              <h4 className="text-red-400 font-medium mb-2">Danger Zone</h4>
              <button
                onClick={handleDeleteParty}
                disabled={isUpdating}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>End Party Forever</span>
              </button>
              <p className="text-xs text-gray-500 mt-1">
                This will permanently end the party and remove all chat history
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
