/**
 * V2 Theme - TypeScript Type Definitions
 * Silne typowanie dla nowego motywu z obsługą mikrointerakcji i 3D
 */

export type ThemeVersion = 'v1' | 'v2';

export interface ThemeConfig {
  version: ThemeVersion;
  animations: {
    enabled: boolean;
    duration: number; // w ms
    easing: string;
  };
  webGPU: {
    enabled: boolean;
    fallbackToWebGL: boolean;
  };
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface CTAButton {
  id: string;
  text: string;
  href: string;
  variant: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export interface ThemeContextValue {
  currentTheme: ThemeVersion;
  switchTheme: (version: ThemeVersion) => void;
  config: ThemeConfig;
}

// WebGPU/WebGL 3D Scene Props
export interface Scene3DProps {
  className?: string;
  intensity?: number;
  particleCount?: number;
  animationSpeed?: number;
  colorScheme?: 'blue' | 'gradient' | 'monochrome';
}
