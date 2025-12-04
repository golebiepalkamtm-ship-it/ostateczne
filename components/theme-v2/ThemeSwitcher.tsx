/**
 * Theme Switcher - Główny komponent przełączania między V1 i V2
 * BEZWZGLĘDNIE NIE MODYFIKUJE kodu V1
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ThemeV2Container } from './ThemeV2Container';
import type { ThemeVersion } from './types';

interface ThemeSwitcherProps {
  children?: React.ReactNode;
  defaultTheme?: ThemeVersion;
  v1Component?: React.ReactNode;
  v2Component?: React.ReactNode;
}

/**
 * Wewnętrzny komponent obsługujący logikę przełączania
 */
const ThemeSwitcherContent: React.FC<{
  children?: React.ReactNode;
  v1Component?: React.ReactNode;
  v2Component?: React.ReactNode;
}> = ({ children, v1Component, v2Component }) => {
  const { currentTheme, switchTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Zapobiega hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleThemeToggle = () => {
    switchTheme(currentTheme === 'v1' ? 'v2' : 'v1');
  };

  return (
    <div className="relative min-h-screen">
      {/* Renderowanie odpowiedniego motywu */}
      {currentTheme === 'v2' ? (
        <>
          {/* V2 Theme - nowy, modularny design */}
          {v2Component || (
            <ThemeV2Container onThemeToggle={handleThemeToggle}>
              {children}
            </ThemeV2Container>
          )}
        </>
      ) : (
        <>
          {/* V1 Theme - istniejący frontend (NIE MODYFIKOWANY) */}
          {v1Component || (
            <div className="min-h-screen bg-gray-100 p-8">
              <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">
                    V1 Theme (Istniejący Frontend)
                  </h1>
                  <button
                    onClick={handleThemeToggle}
                    className="
                      px-6 py-3
                      bg-blue-600 hover:bg-blue-700
                      text-white font-medium
                      rounded-lg
                      transition-colors duration-200
                    "
                  >
                    Przełącz na V2 →
                  </button>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-600 leading-relaxed">
                    To jest placeholder dla istniejącego frontendu V1. 
                    Ten kod <strong>nie jest modyfikowany</strong> przez implementację V2.
                  </p>
                  {children}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating Theme Toggle (zawsze widoczny) */}
      <button
        onClick={handleThemeToggle}
        className="
          fixed bottom-8 right-8 z-[9999]
          w-14 h-14
          bg-gradient-to-br from-blue-500 to-blue-600
          hover:from-blue-600 hover:to-blue-700
          text-white
          rounded-full
          shadow-lg hover:shadow-xl
          transition-all duration-300
          hover:scale-110
          active:scale-95
          flex items-center justify-center
          group
        "
        title={`Przełącz na ${currentTheme === 'v1' ? 'V2' : 'V1'}`}
      >
        <span className="text-xl font-bold">
          {currentTheme === 'v1' ? '2' : '1'}
        </span>
        <div className="
          absolute inset-0 
          rounded-full 
          bg-blue-400 
          opacity-0 group-hover:opacity-20
          animate-ping
        " />
      </button>

      {/* Theme indicator badge */}
      <div className="
        fixed top-4 right-4 z-[9998]
        px-4 py-2
        bg-white/90 backdrop-blur-sm
        border border-gray-200
        rounded-full
        text-sm font-medium text-gray-700
        shadow-md
      ">
        Aktywny motyw: <span className="font-bold text-blue-600">{currentTheme.toUpperCase()}</span>
      </div>
    </div>
  );
};

/**
 * Główny komponent eksportowany
 */
export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  children,
  defaultTheme = 'v1',
  v1Component,
  v2Component,
}) => {
  return (
    <ThemeProvider initialTheme={defaultTheme}>
      <ThemeSwitcherContent v1Component={v1Component} v2Component={v2Component}>
        {children}
      </ThemeSwitcherContent>
    </ThemeProvider>
  );
};
