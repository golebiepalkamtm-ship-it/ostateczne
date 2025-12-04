/**
 * V2 Theme Context
 * Zarządza stanem motywu i przełączaniem między V1/V2
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ThemeVersion, ThemeConfig, ThemeContextValue } from '../types';

const defaultConfig: ThemeConfig = {
  version: 'v1',
  animations: {
    enabled: true,
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  webGPU: {
    enabled: true,
    fallbackToWebGL: true,
  },
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: ThemeVersion;
  config?: Partial<ThemeConfig>;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = 'v1',
  config: userConfig,
}) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeVersion>(initialTheme);
  const [config] = useState<ThemeConfig>({ ...defaultConfig, ...userConfig });

  const switchTheme = useCallback((version: ThemeVersion) => {
    setCurrentTheme(version);
    // Opcjonalnie: zapisz preferrencję w localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-version', version);
    }
  }, []);

  const value = useMemo(
    () => ({
      currentTheme,
      switchTheme,
      config,
    }),
    [currentTheme, switchTheme, config]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
