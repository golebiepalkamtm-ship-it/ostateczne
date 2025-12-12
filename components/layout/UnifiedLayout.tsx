'use client';

import { UserStatus } from '@/components/auth/UserStatus';
import { Footer } from '@/components/layout/Footer';
import { LogoGlow } from '@/components/layout/LogoGlow';

import Link from 'next/link';
import { ReactNode, useEffect } from 'react';
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
  useEffect(() => {
    const removeBisAttributes = () => {
      const elements = document.querySelectorAll('[bis_skin_checked]');
      elements.forEach(el => el.removeAttribute('bis_skin_checked'));
    };
    removeBisAttributes();
    const observer = new MutationObserver(removeBisAttributes);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`relative min-h-screen flex flex-col ${className}`} suppressHydrationWarning={true}>
      {/* Tło strony */}
      {showBackground && (
        <>
          <div className="fixed inset-0 w-full h-full -z-10" suppressHydrationWarning={true}>
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
        <div className="absolute z-[1001] pointer-events-auto top-5 left-12 right-6" suppressHydrationWarning={true}>
          <div className="flex items-center justify-between w-full" suppressHydrationWarning={true}>
            {/* Logo i Navigation Menu po lewej */}
            <div className="flex items-center gap-6" suppressHydrationWarning={true}>
              {/* Logo */}
              <div className="flex items-center scale-110" suppressHydrationWarning={true}>
                <LogoGlow />
              </div>

              {/* Navigation Menu */}
              <nav className="flex items-center" suppressHydrationWarning={true}>
                <div className="flex items-center gap-4" suppressHydrationWarning={true}>
                  {navItems.map((item, index) => (
                    <div
                      key={item.href}
                      className="flex items-center magictime boingInUp"
                      style={{ animationDelay: `${index * 0.08}s`, animationDuration: '0.8s', animationFillMode: 'both' }}
                      suppressHydrationWarning={true}
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
                  ))}
                </div>
              </nav>
            </div>

            {/* User Status po prawej */}
            <div
              className="flex items-center gap-4 scale-105 magictime spaceInRight"
              style={{ animationDuration: '0.9s', animationDelay: `${navItems.length * 0.08}s`, animationFillMode: 'both' }}
              suppressHydrationWarning={true}
            >
              <UserStatus />
            </div>
          </div>
        </div>
      )}

      {/* Main Content - dodany padding-top aby nie nachodziło na navigation tiles */}
      <div className="relative z-20 flex-1 pt-40" suppressHydrationWarning={true}>
        {children}
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="relative z-20 mt-32 pt-16" suppressHydrationWarning={true}>
          <Footer />
        </div>
      )}
    </div>
  );
}
