/**
 * V2 Theme - Main Container Component
 * Główny kontener dla całego motywu V2
 */

'use client';

import React from 'react';
import { HeaderV2 } from './layout/HeaderV2';
import { NavigationV2 } from './layout/NavigationV2';
import { CallToActionV2 } from './layout/CallToActionV2';
import { FooterV2 } from './layout/FooterV2';

interface ThemeV2ContainerProps {
  children?: React.ReactNode;
  showHeader?: boolean;
  showNavigation?: boolean;
  showCTA?: boolean;
  showFooter?: boolean;
  onThemeToggle?: () => void;
  className?: string;
}

export const ThemeV2Container: React.FC<ThemeV2ContainerProps> = ({
  children,
  showHeader = true,
  showNavigation = true,
  showCTA = true,
  showFooter = true,
  onThemeToggle,
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-white ${className}`}>
      {/* Nawigacja */}
      {showNavigation && (
        <NavigationV2 onThemeToggle={onThemeToggle} />
      )}

      {/* Header z efektami 3D */}
      {showHeader && (
        <HeaderV2 
          title="Witaj w V2"
          subtitle="Nowoczesny design z efektami 3D i mikrointerakcjami"
          showScene3D={true}
        />
      )}

      {/* Główna zawartość (opcjonalna) */}
      {children && (
        <main className="container mx-auto px-6 py-12">
          {children}
        </main>
      )}

      {/* Sekcja Call To Action */}
      {showCTA && (
        <CallToActionV2 
          title="Gotowy na nowe doświadczenia?"
          description="Dołącz do społeczności hodowców i odkryj najlepsze aukcje gołębi pocztowych."
        />
      )}

      {/* Stopka */}
      {showFooter && (
        <FooterV2 />
      )}
    </div>
  );
};
