'use client';

import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Phone, Shield, User, XCircle } from 'lucide-react';
import Link from 'next/link';

interface VerificationStatus {
  emailVerified: boolean;
  profileComplete: boolean;
  phoneVerified: boolean;
  isLoading: boolean;
}

export function VerificationIndicator() {
  const { user, dbUser, loading } = useAuth();

  // Administratorzy nie potrzebują weryfikacji
  if (dbUser?.role === 'ADMIN') return null;

  // Użyj danych z AuthContext zamiast osobnego wywołania API
  const status: VerificationStatus = {
    emailVerified: !!user?.emailVerified,
    profileComplete: !!(dbUser?.firstName && dbUser?.lastName && dbUser?.address),
    phoneVerified: !!dbUser?.isPhoneVerified,
    isLoading: loading,
  };

  if (loading || status.isLoading) {
    return (
      <div className="flex items-center space-x-2 text-white/70">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span className="text-sm">Sprawdzanie statusu...</span>
      </div>
    );
  }

  if (!user) return null;

  const allVerified = status.emailVerified && status.profileComplete && status.phoneVerified;

  if (allVerified) {
    return (
      <div className="flex items-center space-x-2 text-green-400">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Pełna weryfikacja</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {/* Email Verification */}
        <div className="flex items-center space-x-1">
          {status.emailVerified ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-xs text-white/70">Email</span>
        </div>

        {/* Profile Completion */}
        <div className="flex items-center space-x-1">
          {status.profileComplete ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-xs text-white/70">Profil</span>
        </div>

        {/* Phone Verification */}
        <div className="flex items-center space-x-1">
          {status.phoneVerified ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-xs text-white/70">Telefon</span>
        </div>
      </div>

      {/* Action Button */}
      <Link
        href={!status.profileComplete ? '/auth/complete-profile' : '/auth/verify-phone'}
        className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs rounded transition-colors"
      >
        {!status.profileComplete ? 'Uzupełnij profil' : 'Zweryfikuj telefon'}
      </Link>
    </div>
  );
}

export function VerificationBanner() {
  const { user, dbUser, loading } = useAuth();

  // Administratorzy nie potrzebują weryfikacji - automatyczny dostęp do wszystkich funkcji
  if (dbUser?.role === 'ADMIN') return null;

  // Użyj danych z AuthContext zamiast osobnego wywołania API
  const status: VerificationStatus = {
    emailVerified: !!user?.emailVerified,
    profileComplete: !!(dbUser?.firstName && dbUser?.lastName && dbUser?.address),
    phoneVerified: !!dbUser?.isPhoneVerified,
    isLoading: loading,
  };

  if (loading || status.isLoading || !user) return null;

  const allVerified = status.emailVerified && status.profileComplete && status.phoneVerified;

  if (allVerified) return null;

  const getNextStep = () => {
    if (!status.emailVerified) {
      return {
        title: '📧 Poziom 1: Zweryfikuj email',
        description: 'Kliknij link w emailu, aby uzyskać dostęp do Panelu Użytkownika (Poziom 2)',
        link: '/profile',
        icon: Shield,
      };
    }
    if (!status.profileComplete) {
      return {
        title: '👤 Poziom 2: Uzupełnij profil',
        description: 'Dodaj dane osobowe i adres, aby przejść do weryfikacji telefonu (Poziom 3)',
        link: '/profile?tab=profile&edit=true',
        icon: User,
      };
    }
    if (!status.phoneVerified) {
      return {
        title: '📱 Poziom 3: Zweryfikuj telefon',
        description: 'Potwierdź numer telefonu przez SMS, aby uzyskać pełny dostęp do aukcji i licytacji',
        link: '/profile?tab=profile',
        icon: Phone,
      };
    }
    return null;
  };

  const nextStep = getNextStep();
  if (!nextStep) return null;

  const Icon = nextStep.icon;

  return (
    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white mb-1">{nextStep.title}</h3>
          <p className="text-sm text-white/70 mb-2">{nextStep.description}</p>
          <div className="text-xs text-white/50 mb-3">
            <p>💡 System 3-poziomowej weryfikacji:</p>
            <p>• Poziom 1: Rejestracja → Poziom 2: Email + Panel → Poziom 3: Telefon + Pełny dostęp</p>
          </div>
          <Link
            href={nextStep.link}
            className="inline-flex items-center px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm rounded-lg transition-colors"
          >
            <Shield className="w-4 h-4 mr-2" />
            Kontynuuj weryfikację
          </Link>
        </div>
      </div>
    </div>
  );
}
