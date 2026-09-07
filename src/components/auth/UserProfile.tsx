'use client'

import { useState, useRef } from 'react'
import { User, LogOut, Settings, Library, X, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface UserProfileProps {
  isOpen: boolean
  onClose: () => void
}

export function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    setLoading(true)
    const { error } = await signOut()
    if (!error) {
      onClose()
    }
    setLoading(false)
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }
  
  if (!isOpen || !user) return null

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8"
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
        ref={modalRef}
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
      >
        {/* Website-Themed Header with Floating Effect */}
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
              👤 Profile
            </h2>
            <button
              onClick={onClose}
              className="group relative p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(147, 51, 234, 0.2) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(99, 102, 241, 0.4)'
              }}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 group-hover:text-white transition-colors duration-300" />
            </button>
          </div>
        </div>

        {/* Website-Themed Content with Glassmorphism Elements */}
        <div className="p-4 sm:p-5 md:p-6">
          {/* Glassmorphism User Info Section */}
          <div 
            className="flex items-center space-x-4 mb-6 p-4 sm:p-5 rounded-xl sm:rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.7) 100%)',
              backdropFilter: 'blur(20px) saturate(150%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: 'inset 0 1px 0 rgba(99, 102, 241, 0.1), 0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-semibold text-lg sm:text-xl relative"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(147, 51, 234, 0.8) 50%, rgba(59, 130, 246, 0.8) 100%)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(99, 102, 241, 0.5)',
                boxShadow: `
                  0 8px 32px rgba(99, 102, 241, 0.4),
                  0 4px 16px rgba(147, 51, 234, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `
              }}
            >
              {getInitials(user.displayName, user.email)}
              {/* Online indicator */}
              <div 
                className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-gray-800"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                }}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                {user.displayName || 'User'}
              </h3>
              <p className="text-gray-300 text-sm mb-1">{user.email}</p>
              {user.createdAt && (
                <p className="text-gray-400 text-xs">
                  ✨ Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Glassmorphism Menu Items */}
          <div className="space-y-3">
            <button
              onClick={() => {
                onClose()
                // Navigate to library
                window.location.href = '/library'
              }}
              className="w-full flex items-center space-x-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] text-left group"
              style={{
                background: 'linear-gradient(135deg, rgba(55, 65, 81, 0.5) 0%, rgba(31, 41, 55, 0.6) 100%)',
                backdropFilter: 'blur(20px) saturate(150%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
            >
              <div 
                className="p-2 rounded-lg group-hover:scale-110 transition-transform duration-200"
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(147, 51, 234, 0.2) 100%)'
                }}
              >
                <Library className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
              </div>
              <span className="text-white font-medium">My Library</span>
            </button>

            <button
              onClick={() => {
                onClose()
                // Navigate to parties
                window.location.href = '/parties'
              }}
              className="w-full flex items-center space-x-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] text-left group"
              style={{
                background: 'linear-gradient(135deg, rgba(55, 65, 81, 0.5) 0%, rgba(31, 41, 55, 0.6) 100%)',
                backdropFilter: 'blur(20px) saturate(150%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
            >
              <div 
                className="p-2 rounded-lg group-hover:scale-110 transition-transform duration-200"
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(147, 51, 234, 0.2) 100%)'
                }}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />
              </div>
              <span className="text-white font-medium">My Parties</span>
            </button>

            

            {/* Sign Out Button with Special Styling */}
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full flex items-center space-x-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading 
                  ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.5) 0%, rgba(31, 41, 55, 0.6) 100%)'
                  : 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(153, 27, 27, 0.3) 100%)',
                backdropFilter: 'blur(20px) saturate(150%)',
                border: `1px solid ${loading ? 'rgba(99, 102, 241, 0.2)' : 'rgba(220, 38, 38, 0.4)'}`,
                boxShadow: loading 
                  ? '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  : '0 8px 32px rgba(220, 38, 38, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
            >
              <div 
                className="p-2 rounded-lg group-hover:scale-110 transition-transform duration-200"
                style={{
                  background: loading 
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(147, 51, 234, 0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(220, 38, 38, 0.4) 0%, rgba(153, 27, 27, 0.3) 100%)'
                }}
              >
                {loading ? (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-red-300" />
                )}
              </div>
              <span className={`font-medium ${loading ? 'text-white' : 'text-red-300'}`}>
                {loading ? '🔄 Signing out...' : 'Sign Out'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
