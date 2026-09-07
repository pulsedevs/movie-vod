'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextProps {
  toasts: Toast[];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

const noop = () => {};
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) return { toasts: [] as Toast[], showToast: noop as ToastContextProps['showToast'], hideToast: noop };
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      hideToast(id);
    }, 4000);
    
    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>      {children}
      
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between gap-2 rounded-lg p-3 shadow-lg transition-all transform animate-slide-in-top
              ${toast.type === 'success' ? 'bg-green-600/90 text-white' :
                toast.type === 'error' ? 'bg-red-600/90 text-white' : 
                'bg-blue-600/90 text-white'} 
              backdrop-blur-sm border border-white/10 min-w-[300px] max-w-sm`}
          >
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button 
              onClick={() => hideToast(toast.id)}
              className="rounded-full p-1 hover:bg-white/20 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
