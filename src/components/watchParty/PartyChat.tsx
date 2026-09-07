'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, MessageCircle } from 'lucide-react';
import { PartyMessage } from '@/types/watchParty';
import styles from './PartyChat.module.css';

interface PartyChatProps {
  messages: PartyMessage[];
  onSendMessage: (content: string) => void;
  currentUserId: string;
  isMobile?: boolean;
}

export default function PartyChat({ messages, onSendMessage, currentUserId, isMobile = false }: PartyChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      try {
        setIsSending(true);
        setSendError(null);
        await onSendMessage(newMessage.trim());
        setNewMessage('');
        inputRef.current?.focus();
      } catch (error) {
        console.error('Error sending message:', error);
        setSendError('Failed to send message. Please try again.');
      } finally {
        setIsSending(false);
      }
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Messages - Unified Modern Design for All Screens */}
      <div 
        className={`overflow-y-auto p-3 ${styles.chatMessagesContainer}`}
        style={{ 
          height: 'calc(100% - 80px)', // Unified height calculation
          minHeight: 0,
          maxHeight: 'calc(100% - 80px)'
        }}>
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6 opacity-50" />
              </div>
              <h3 className="text-base font-medium text-white mb-2">No messages yet</h3>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isCurrentUser = message.user_id === currentUserId;
              const isSystemMessage = message.message_type === 'system';
              const showAvatar = !isCurrentUser && !isSystemMessage && 
                (index === 0 || messages[index - 1].user_id !== message.user_id);
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${
                    isSystemMessage ? 'justify-center' : ''
                  }`}
                >
                  {!isCurrentUser && !isSystemMessage && (
                    <div className="flex-shrink-0 mr-2">
                      {showAvatar ? (
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {(message.profiles?.full_name || `U${message.user_id.slice(0, 2)}`).charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-7 h-7"></div>
                      )}
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${isSystemMessage ? 'max-w-none' : ''}`}>
                    {!isCurrentUser && !isSystemMessage && showAvatar && (
                      <div className="text-xs text-gray-400 mb-1 ml-1">
                        {message.profiles?.full_name || `User ${message.user_id.slice(0, 8)}`}
                      </div>
                    )}
                    
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isSystemMessage
                          ? 'bg-white/5 text-gray-300 text-sm italic text-center backdrop-blur-sm border border-white/10'
                          : isCurrentUser
                          ? 'bg-gradient-to-r from-blue-500/80 to-blue-600/80 text-white shadow-lg backdrop-blur-sm border border-blue-400/30'
                          : 'bg-white/10 text-white backdrop-blur-sm border border-white/20'
                      }`}
                    >
                      <div className="break-words text-sm">{message.message}</div>
                      <div
                        className={`text-xs mt-1 ${
                          isSystemMessage
                            ? 'text-gray-500'
                            : isCurrentUser
                            ? 'text-blue-200'
                            : 'text-gray-400'
                        }`}
                      >
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Unified Glassmorphism for All Screens */}
      <div 
        className="border-t border-white/20 flex-shrink-0 bg-black/40 backdrop-blur-lg p-3"
        style={{ height: '80px' }}>
        {sendError && (
          <div className="mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span>{sendError}</span>
            </div>
          </div>
        )}

        {/* Unified Modern Input for All Screens */}
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-3 py-2 pr-8 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200 text-sm backdrop-blur-sm shadow-lg"
              maxLength={500}
              disabled={isSending}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              title="Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="w-8 h-8 bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-600/90 hover:to-blue-700/90 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg backdrop-blur-sm border border-blue-400/30 flex items-center justify-center flex-shrink-0"
          >
            {isSending ? (
              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Send className="w-3 h-3" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
