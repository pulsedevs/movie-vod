'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Lock body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    } else {
      // Add a small delay to allow for animation
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, 200);

      // Unlock body scroll when dialog is closed
      document.body.style.overflow = '';
      
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) {
    return null;
  }

  // Color schemes based on dialog type
  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-600/20',
          border: 'border-red-500/40',
          button: 'bg-red-600 hover:bg-red-700',
          icon: 'text-red-400'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-600/20',
          border: 'border-yellow-500/40',
          button: 'bg-yellow-600 hover:bg-yellow-700',
          icon: 'text-yellow-400'
        };
      case 'info':
        return {
          bg: 'bg-blue-600/20',
          border: 'border-blue-500/40',
          button: 'bg-blue-600 hover:bg-blue-700',
          icon: 'text-blue-400'
        };
      default:
        return {
          bg: 'bg-red-600/20',
          border: 'border-red-500/40',
          button: 'bg-red-600 hover:bg-red-700',
          icon: 'text-red-400'
        };
    }
  };  const colors = getColors();
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[150]"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        padding: '0',
        margin: '0'
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        style={{ opacity: isOpen ? 1 : 0 }}
      />
      
      {/* Dialog */}
      <div 
        className={`relative w-full max-w-md ${colors.bg} border ${colors.border} rounded-xl shadow-xl overflow-hidden transition-all duration-300`}
        style={{ 
          transform: isOpen ? 'scale(1)' : 'scale(0.95)', 
          opacity: isOpen ? 1 : 0,
          margin: '0 16px',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
        
        <div className="p-5">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-300 text-sm mb-6">{message}</p>
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 ${colors.button} text-white text-sm rounded-md transition-colors`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
