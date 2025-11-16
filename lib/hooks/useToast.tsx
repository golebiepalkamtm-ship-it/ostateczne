'use client';

/**
 * Toast Hook and Context Provider
 * Filepath: lib/hooks/useToast.tsx
 *
 * Purpose: Global toast notification system
 * Usage: useToast() hook to show success/error messages
 */

import { createContext, useContext, useState, ReactNode, FC } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>): void => {
    const id = `toast-${Date.now()}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 4000,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    if (newToast.duration) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  };

  const removeToast = (id: string): void => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

ToastProvider.displayName = 'ToastProvider';

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to use toast notifications
 * Usage:
 *   const { addToast } = useToast();
 *   addToast({
 *     type: 'success',
 *     title: 'Success!',
 *     description: 'Operation completed',
 *   });
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return {
    addToast: context.addToast,
    removeToast: context.removeToast,
    success: (title: string, description?: string): void =>
      context.addToast({ type: 'success', title, description }),
    error: (title: string, description?: string): void =>
      context.addToast({ type: 'error', title, description }),
    info: (title: string, description?: string): void =>
      context.addToast({ type: 'info', title, description }),
    warning: (title: string, description?: string): void =>
      context.addToast({ type: 'warning', title, description }),
  };
}

// ============================================================================
// TOAST DISPLAY COMPONENT (Client-side rendering)
// ============================================================================

export const ToastContainer: FC = () => {
  const context = useContext(ToastContext);

  if (!context) {
    return null;
  }

  const getColor = (type: ToastType): string => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getIcon = (type: ToastType): string => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      default:
        return '📢';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {context.toasts.map(toast => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg border ${getColor(
            toast.type
          )} shadow-md animate-in fade-in slide-in-from-top-2`}
        >
          <div className="flex items-start">
            <span className="text-lg mr-3">{getIcon(toast.type)}</span>
            <div className="flex-1">
              <p className="font-bold">{toast.title}</p>
              {toast.description && <p className="text-sm opacity-90">{toast.description}</p>}
            </div>
            <button
              onClick={() => context.removeToast(toast.id)}
              className="ml-4 text-lg opacity-70 hover:opacity-100"
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

ToastContainer.displayName = 'ToastContainer';
