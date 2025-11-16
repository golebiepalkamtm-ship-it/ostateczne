'use client';

import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/register');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <UnifiedLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Ładowanie...</p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  // Uproszczona logika - zawsze pokazuj UserDashboard, który sam sprawdzi warunki
  // Wszystkie komponenty weryfikacyjne są teraz obsługiwane wewnątrz UserDashboard lub wcześniej
  return (
    <UnifiedLayout>
      <div className="container mx-auto px-4 py-8">
        <UserDashboard />
      </div>
    </UnifiedLayout>
  );
}
