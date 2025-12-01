'use client';

import { UserStatus } from '@/components/auth/UserStatus';
import { Footer } from '@/components/layout/Footer';
import { LogoGlow } from '@/components/layout/LogoGlow';
import { VerificationBanner, VerificationIndicator } from '@/components/ui/VerificationIndicator';
import Link from 'next/link';
import { ReactNode } from 'react';
import Image from 'next/image';

const navItems = [
  { href: '/', icon: 'fas fa-home', title: 'Strona Główna', label: 'Strona Główna' },
  { href: '/auctions', icon: 'fas fa-gavel', title: 'Aukcje', label: 'Aukcje' },
  { href: '/achievements', icon: 'fas fa-crown', title: 'Nasze Osiągnięcia', label: 'Osiągnięcia' },
  { href: '/champions', icon: 'fas fa-trophy', title: 'Championy', label: 'Championy' },
  { href: '/breeder-meetings', icon: 'fas fa-users', title: 'Spotkania', label: 'Spotkania' },
  { href: '/references', icon: 'fas fa-star', title: 'Referencje', label: 'Referencje' },
  { href: '/press', icon: 'fas fa-newspaper', title: 'Prasa', label: 'Prasa' },
  { href: '/about', icon: 'fas fa-info-circle', title: 'O nas', label: 'O Nas' },
  { href: '/contact', icon: 'fas fa-envelope', title: 'Kontakt', label: 'Kontakt' },
];

interface UnifiedLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
  showFooter?: boolean;
  showBackground?: boolean;
  className?: string;
}

export function UnifiedLayout({
  children,
  showNavigation = true,
  showFooter = true,
  showBackground = true,
  className = '',
}: UnifiedLayoutProps) {
  return (
    <div className={`min-h-screen flex flex-col ${className} relative overflow-x-hidden`}>
      {/* Tło strony - ukryte na stronie głównej, bo Liquid Background je zastępuje */}
      {showBackground && (
        <>
          <div className="fixed inset-0 w-full h-full -z-10">
            <Image
              src="/pigeon-lofts-background.jpg"
              alt="Tło gołębnika Pałka MTM"
              fill
              priority
              className="object-cover object-top"
              sizes="100vw"
              quality={90}
            />
          </div>
          {/* Szara nakładka na tło */}
          <div className="fixed inset-0 bg-black/55 pointer-events-none z-0"></div>
        </>
      )}

      {/* Główna zawartość, która się rozciąga */}
      <main className="flex-grow relative">
        {/* overlay usunięty na prośbę użytkownika */}
        {/* Logo w lewym górnym rogu */}
        <div className="fade-in-fwd w-fit origin-center" style={{ animationDelay: '0.1s' }}>
          <LogoGlow />
        </div>

        {/* Navigation Menu */}
        {showNavigation && (
          <>
            <nav className="absolute top-8 left-[360px] z-[1001] pointer-events-auto">
              <div className="flex items-center gap-3">
                {navItems.map((item) => (
                  <div 
                    key={item.href} 
                    className="fade-in-fwd"
                    style={{ animationDelay: '0.1s' }}
                  >
                    <Link
                      href={item.href as `/${string}`}
                      className="glass-nav-button"
                      title={item.title}
                      onClick={() => {
                        /* console.log('Clicked:', item.href) */
                      }}
                    >
                      <i className={`${item.icon} relative z-10 text-3xl`}></i>
                      <span className="relative z-10 text-sm">{item.label}</span>
                    </Link>
                  </div>
                ))}
              </div>
            </nav>

            {/* User Status w prawym górnym rogu */}
            <div className="absolute top-8 right-6 z-[1001] pointer-events-auto fade-in-fwd" style={{ animationDelay: '0.1s' }}>
              <div className="flex flex-col items-end space-y-2">
                <UserStatus />
                <VerificationIndicator />
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="relative z-20">
          {/* Globalny baner weryfikacji - widoczny na każdej podstronie jeśli użytkownik wymaga akcji */}
          <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 pt-32 pb-0">
            <VerificationBanner />
          </div>
          {children}
        </div>
      </main>

      {/* Stopka */}
      {showFooter && <Footer />}
    </div>
  );
}
