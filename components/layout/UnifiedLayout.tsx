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
  children?: ReactNode;
  showNavigation?: boolean;
  showFooter?: boolean;
  showBackground?: boolean;
  className?: string;
  isHomePage?: boolean;
}

export function UnifiedLayout({
  children,
  showNavigation = true,
  showFooter = true,
  showBackground = true,
  className = '',
  isHomePage = false,
}: UnifiedLayoutProps) {
  return (
    <div className={`relative min-h-screen flex flex-col ${className}`}>
      {/* Tło strony */}
      {showBackground && (
        <>
          <div className="fixed inset-0 w-full h-full -z-10">
            <Image
              src="/pigeon-lofts-background-sharp.jpg"
              alt="Tło gołębnika Pałka MTM"
              fill
              priority
              className="object-cover object-top"
              sizes="100vw"
              quality={90}
            />
          </div>
          {/* Nakładka tła usunięta - obraz tła będzie wyświetlany bez przyciemnienia */}
        </>
      )}

      {/* Logo, Navigation Menu i User Status - IDENTYCZNE NA WSZYSTKICH STRONACH */}
      {showNavigation && (
        <div className="absolute z-[1001] pointer-events-auto fade-in-fwd top-5 left-12 right-6" style={{ animationDelay: '0s' }}>
          <div className="flex items-center justify-between w-full" style={{ perspective: '1500px' }}>
            {/* Logo i Navigation Menu po lewej */}
            <div className="flex items-center gap-6">
              {/* Logo */}
              <div className="flex items-center scale-110 animate__animated animate__slow animate__backInDown" style={{ animationDelay: '0s' }}>
                <LogoGlow />
              </div>

              {/* Navigation Menu */}
              <nav className="flex items-center">
                <div className="flex items-center gap-4">
                  {navItems.map((item, index) => {
                    const directionClass = index % 2 === 0 ? 'animate__backInRight' : 'animate__backInLeft'
                    // Zwiększone opóźnienia i wolniejsza prędkość animacji
                    const baseDelay = 0.18
                    const stagger = 0.08
                    const delay = baseDelay + index * stagger
                    return (
                      <div
                        key={item.href}
                        className={`animate__animated animate__slow ${directionClass} flex items-center`}
                        style={{
                          animationDelay: `${delay.toFixed(2)}s`,
                          transformStyle: 'preserve-3d'
                        }}
                      >
                        <Link
                          href={item.href as `/${string}`}
                          className="glass-nav-button flex items-center justify-center scale-105"
                          title={item.title}
                          onClick={() => {
                            /* console.log('Clicked:', item.href) */
                          }}
                        >
                          <i className={`${item.icon} relative z-10 text-3xl`}></i>
                          <span className="relative z-10 text-sm ml-2 font-medium">{item.label}</span>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </nav>
            </div>

            {/* User Status po prawej */}
            <div className="flex items-center gap-4 scale-105 animate__animated animate__slow animate__backInUp" style={{ animationDelay: '1.00s' }}>
              <UserStatus />
            </div>
          </div>
        </div>
      )}

      {/* Main Content - dodany padding-top aby nie nachodziło na navigation tiles */}
      <div className="relative z-20 flex-1 pt-40">
        {children}
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="relative z-20 mt-32 pt-16">
          <Footer />
        </div>
      )}
    </div>
  );
}
