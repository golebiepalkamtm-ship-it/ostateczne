/**
 * Theme Switcher Demo Page
 * Demonstracja przełączania między V1 i V2
 */

'use client';

import { ThemeSwitcher } from '@/components/theme-v2';

export default function ThemeSwitcherDemoPage() {
  return (
    <ThemeSwitcher defaultTheme="v2">
      {/* Opcjonalna dodatkowa zawartość dla obu motywów */}
      <div className="py-12">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Dodatkowa Zawartość
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Ta sekcja jest widoczna w obu motywach (V1 i V2). Możesz tutaj umieścić
              uniwersalną zawartość, która będzie wyświetlana niezależnie od wybranego motywu.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-blue-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">
                  🎨 Design System
                </h3>
                <p className="text-sm text-gray-600">
                  Spójny design w obu wersjach
                </p>
              </div>
              <div className="p-6 bg-blue-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">
                  ⚡ Performance
                </h3>
                <p className="text-sm text-gray-600">
                  Zoptymalizowane komponenty React
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeSwitcher>
  );
}
