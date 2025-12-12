'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, X } from 'lucide-react';

export function AuthErrorBanner() {
  const { error, clearError } = useAuth();

  if (!error) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[10000] max-w-md mx-auto">
      <div className="bg-red-500/95 backdrop-blur-sm border border-red-400/50 rounded-lg p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-200 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-100 font-semibold text-sm mb-1">
              Problem z logowaniem
            </h3>
            <p className="text-red-200 text-sm leading-relaxed">
              {error}
            </p>
          </div>
          <button
            onClick={clearError}
            className="text-red-300 hover:text-red-100 transition-colors p-1 hover:bg-red-400/20 rounded"
            aria-label="Zamknij komunikat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
