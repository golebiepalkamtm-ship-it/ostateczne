/**
 * V2 Theme - Public API Exports
 * Centralny punkt eksportu wszystkich komponentów V2
 */

// Main Components
export { ThemeSwitcher } from './ThemeSwitcher';
export { ThemeV2Container } from './ThemeV2Container';

// Layout Components
export { HeaderV2 } from './layout/HeaderV2';
export { NavigationV2 } from './layout/NavigationV2';
export { CallToActionV2 } from './layout/CallToActionV2';
export { FooterV2 } from './layout/FooterV2';

// 3D Components
export { Scene3DPlaceholder } from './3d/Scene3DPlaceholder';

// Context & Hooks
export { ThemeProvider, useTheme } from './context/ThemeContext';

// Types
export type {
  ThemeVersion,
  ThemeConfig,
  NavigationItem,
  CTAButton,
  ThemeContextValue,
  Scene3DProps,
} from './types';
