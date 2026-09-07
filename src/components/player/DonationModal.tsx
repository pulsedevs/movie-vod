'use client';

import React from 'react';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Lightweight donation modal component
const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4 transition-all duration-300">
      {/* Backdrop with touch feedback */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - Adjusted for mobile */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[92%] sm:max-w-md md:max-w-lg max-h-[85vh] overflow-y-auto transform transition-all duration-300 scale-100">
        {/* Larger touch-friendly close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2.5 hover:bg-gray-800/80 active:bg-gray-700 rounded-full transition-colors z-10 touch-manipulation"
          aria-label="Close donation modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 hover:text-white">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        {/* Header - Mobile-optimized spacing */}
        <div className="p-5 sm:p-6 pb-3 sm:pb-4 text-center">
          <div className="mb-3 sm:mb-4">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-7 h-7 sm:w-8 sm:h-8 text-white"
              >
                <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Support Our Project</h2>
            <p className="text-gray-300 text-sm px-2 sm:px-0">
              Help us keep this service free and running! Your donation helps cover server costs and development.
            </p>
          </div>
        </div>
        
        {/* PayPal Donation Form - Mobile-optimized */}
        <div className="px-4 sm:px-6 pb-5 sm:pb-6">
          <div className="bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
            {/* Touch-friendly Donate Button - Mobile optimized */}
            <div className="text-center">
              <a
                href="https://www.paypal.com/ncp/payment/ZLJH6CUF3MWGY"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center w-full py-2.5 sm:py-4 px-3 sm:px-8 bg-gradient-to-r from-blue-600 via-[#0070ba] to-blue-700 hover:from-blue-500 hover:via-[#005ea6] hover:to-blue-600 active:from-blue-700 active:via-[#00457a] active:to-blue-800 text-white font-bold text-sm sm:text-lg rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg touch-manipulation"
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-[#0070ba]/20 to-blue-400/20 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* PayPal Logo - Smaller on mobile */}
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-8 sm:h-8 mr-1.5 sm:mr-3 fill-current relative z-10">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.26-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106h-4.606a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81.394.448.742.959 1.012 1.544.271.585.455 1.245.455 1.943 0 .143-.012.288-.035.437z"/>
                </svg>
                
                {/* Donate Text - Shorter on mobile */}
                <span className="relative z-10 group-hover:scale-105 transition-transform duration-200">
                  <span className="sm:hidden">Donate</span>
                  <span className="hidden sm:inline">Donate via PayPal</span>
                </span>
                
                {/* Arrow Icon - Smaller on mobile */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-6 sm:h-6 ml-1.5 sm:ml-3 relative z-10 group-hover:translate-x-1 transition-transform duration-200">
                  <path fillRule="evenodd" d="M16.72 7.72a.75.75 0 011.06 0l3.75 3.75a.75.75 0 010 1.06l-3.75 3.75a.75.75 0 11-1.06-1.06L19.19 12l-2.47-2.47a.75.75 0 010-1.06zM1.25 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H2a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                </svg>
                
                {/* Sparkle effects - Smaller on mobile */}
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-1 h-1 sm:w-2 sm:h-2 bg-yellow-300 rounded-full animate-ping opacity-75"></div>
                <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 w-0.5 h-0.5 sm:w-1.5 sm:h-1.5 bg-blue-300 rounded-full animate-ping opacity-75" style={{ animationDelay: '700ms' }}></div>
              </a>
            </div>
          </div>
          
          {/* Mobile-friendly info section */}
          <div className="text-center text-xs sm:text-sm text-gray-400 space-y-1.5 px-1">
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              <p>Every contribution helps us improve</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <p>Secure payment via PayPal</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456L18.259 8.715z" />
              </svg>
              <p>Thank you for your support!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;
