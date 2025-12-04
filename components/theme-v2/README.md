# V2 Theme - Dokumentacja

## 📋 Przegląd

V2 Theme to **kompletnie nowy, modularny frontend** stworzony jako niezależna warstwa wizualna dla istniejącego projektu. Zaprojektowany z naciskiem na:

- ✨ **Minimalistyczny design** - białe tło, błękitne akcenty, czyste linie
- 🎯 **Mikrointerakcje** - płynne animacje i efekty hover
- 🚀 **Efekty 3D** - przygotowanie pod WebGPU/WebGL z Three.js
- 🔒 **Izolacja** - absolutnie NIE modyfikuje istniejącego frontendu V1

---

## 🏗️ Struktura Projektu

```
components/theme-v2/
├── types.ts                      # TypeScript type definitions
├── index.ts                      # Public API exports
├── README.md                     # Ta dokumentacja
│
├── context/
│   └── ThemeContext.tsx          # Context API dla zarządzania motywem
│
├── layout/
│   ├── HeaderV2.tsx              # Nagłówek z integracją 3D
│   ├── NavigationV2.tsx          # Minimalistyczna nawigacja
│   ├── CallToActionV2.tsx        # Sekcja CTA
│   └── FooterV2.tsx              # Stopka
│
├── 3d/
│   └── Scene3DPlaceholder.tsx    # Placeholder dla sceny 3D (Three.js)
│
├── demo/
│   └── DemoPage.tsx              # Strona demonstracyjna
│
├── ThemeV2Container.tsx          # Główny kontener V2
└── ThemeSwitcher.tsx             # Przełącznik między V1/V2
```

---

## 🚀 Szybki Start

### 1. Podstawowe użycie z ThemeSwitcher

```tsx
// app/page.tsx lub pages/index.tsx
import { ThemeSwitcher } from '@/components/theme-v2';

export default function HomePage() {
  return (
    <ThemeSwitcher defaultTheme="v2">
      {/* Opcjonalna dodatkowa zawartość */}
      <YourContent />
    </ThemeSwitcher>
  );
}
```

### 2. Użycie tylko V2 Theme (bez przełącznika)

```tsx
import { ThemeV2Container } from '@/components/theme-v2';

export default function V2Page() {
  return (
    <ThemeV2Container>
      <YourCustomContent />
    </ThemeV2Container>
  );
}
```

### 3. Użycie poszczególnych komponentów

```tsx
import { HeaderV2, NavigationV2, FooterV2 } from '@/components/theme-v2';

export default function CustomLayout() {
  return (
    <>
      <NavigationV2 />
      <HeaderV2 
        title="Mój Tytuł"
        subtitle="Mój podtytuł"
        showScene3D={true}
      />
      <main>{/* Twoja zawartość */}</main>
      <FooterV2 />
    </>
  );
}
```

---

## 🎨 Paleta Kolorów (Tailwind)

| Kolor | Zastosowanie | Klasy Tailwind |
|-------|--------------|----------------|
| Biały | Tło główne | `bg-white` |
| Błękit | Akcenty, przyciski | `bg-blue-500`, `bg-blue-600` |
| Niebieski | Linki, hover | `text-blue-600`, `hover:text-blue-700` |
| Szary | Tekst, obramowania | `text-gray-600`, `border-gray-200` |

---

## 🎭 Komponenty

### ThemeSwitcher

Główny komponent przełączania między V1 i V2.

**Props:**
```typescript
interface ThemeSwitcherProps {
  children?: React.ReactNode;
  defaultTheme?: 'v1' | 'v2';
  v1Component?: React.ReactNode;  // Custom V1 component
  v2Component?: React.ReactNode;  // Custom V2 component
}
```

**Funkcje:**
- Przełączanie między motywami za pomocą floating button
- Zapisywanie preferencji w localStorage
- Badge pokazujący aktywny motyw
- Nie modyfikuje kodu V1

### ThemeV2Container

Główny kontener dla V2 Theme.

**Props:**
```typescript
interface ThemeV2ContainerProps {
  children?: React.ReactNode;
  showHeader?: boolean;
  showNavigation?: boolean;
  showCTA?: boolean;
  showFooter?: boolean;
  onThemeToggle?: () => void;
  className?: string;
}
```

### HeaderV2

Minimalistyczny nagłówek z opcjonalną sceną 3D.

**Props:**
```typescript
interface HeaderV2Props {
  title?: string;
  subtitle?: string;
  showScene3D?: boolean;
  className?: string;
}
```

**Funkcje:**
- Integracja z Scene3DPlaceholder
- Animowany badge i scroll indicator
- Dekoracyjne elementy geometryczne
- Gradient overlay dla lepszej czytelności

### NavigationV2

Responsywna nawigacja z mikrointerakcjami.

**Props:**
```typescript
interface NavigationV2Props {
  items?: NavigationItem[];
  className?: string;
  onThemeToggle?: () => void;
}
```

**Funkcje:**
- Sticky positioning z backdrop blur
- Responsywne menu mobilne
- Animowane badge dla nowych elementów
- Hover effects na linkach

### CallToActionV2

Sekcja CTA z statystykami.

**Props:**
```typescript
interface CallToActionV2Props {
  title?: string;
  description?: string;
  buttons?: CTAButton[];
  className?: string;
}
```

### Scene3DPlaceholder

**TECHNICZNY PLACEHOLDER** przygotowany pod implementację Three.js.

**Props:**
```typescript
interface Scene3DProps {
  className?: string;
  intensity?: number;
  particleCount?: number;
  animationSpeed?: number;
  colorScheme?: 'blue' | 'gradient' | 'monochrome';
}
```

**Implementacja docelowa:**
```tsx
// TODO: Zastąp CSS animations Three.js scene
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';

<Canvas>
  <ambientLight intensity={0.5} />
  <pointLight position={[10, 10, 10]} />
  <Sphere args={[1, 32, 32]}>
    <meshStandardMaterial color="blue" />
  </Sphere>
  <OrbitControls />
</Canvas>
```

**Funkcje:**
- Detekcja WebGPU support
- Fallback do WebGL2
- Tymczasowa wizualizacja CSS
- Badge technologii (WebGPU/WebGL)

---

## 🎯 Mikrointerakcje

Wszystkie komponenty zawierają:

### Hover Effects
```css
hover:scale-105        /* Powiększenie */
hover:shadow-lg        /* Cień */
hover:bg-blue-700      /* Zmiana koloru */
hover:translate-x-1    /* Przesunięcie */
```

### Transitions
```css
transition-all duration-300 ease-out
```

### Active States
```css
active:scale-95        /* Wciskanie przycisku */
```

---

## 🚀 Implementacja Three.js (TODO)

### Wymagane biblioteki (już zainstalowane):
- ✅ `three` - Core Three.js
- ✅ `@react-three/fiber` - React renderer
- ✅ `@react-three/drei` - Pomocnicze komponenty

### Przykład implementacji:

```tsx
// components/theme-v2/3d/Scene3DImplemented.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';

export const Scene3DImplemented = () => {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Animowana geometria */}
      <Sphere args={[1, 64, 64]}>
        <MeshDistortMaterial
          color="#3b82f6"
          attach="material"
          distort={0.4}
          speed={2}
        />
      </Sphere>
      
      {/* Particle system */}
      <ParticleSystem count={1000} />
      
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
};
```

---

## 📱 Responsywność

Wszystkie komponenty są w pełni responsywne:

```tsx
// Mobile-first approach
className="
  text-base          // Mobile
  md:text-lg         // Tablet
  lg:text-xl         // Desktop
"
```

---

## ♿ Accessibility

- Semantyczny HTML (header, nav, main, footer)
- ARIA labels na przyciskach
- Fokus states dla keyboard navigation
- Alt text dla wszystkich obrazów (gdy dodane)

---

## 🔧 Konfiguracja

### Theme Config

```typescript
const config: ThemeConfig = {
  version: 'v2',
  animations: {
    enabled: true,
    duration: 300,      // ms
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  webGPU: {
    enabled: true,
    fallbackToWebGL: true,
  },
};
```

### Custom Navigation Items

```tsx
const customNav: NavigationItem[] = [
  { id: 'home', label: 'Główna', href: '/' },
  { id: 'auctions', label: 'Aukcje', href: '/auctions', badge: 'Hot' },
  // ...
];

<NavigationV2 items={customNav} />
```

---

## 🧪 Testing

```bash
# Unit tests (jeśli utworzone)
npm test

# E2E tests
npm run test:e2e
```

---

## 📦 Deployment

Wszystkie komponenty są "use client", więc działają zarówno w:
- ✅ Next.js App Router
- ✅ Next.js Pages Router
- ✅ Standardowym React (z bundlerem)

---

## 🎓 Przykłady Użycia

### Demo Page

```tsx
import { DemoPage } from '@/components/theme-v2/demo/DemoPage';

export default function Demo() {
  return <DemoPage />;
}
```

### Custom Page z V2 Theme

```tsx
import { ThemeProvider, useTheme } from '@/components/theme-v2';
import { NavigationV2, FooterV2 } from '@/components/theme-v2';

export default function CustomPage() {
  return (
    <ThemeProvider>
      <NavigationV2 />
      <main className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Moja Strona
        </h1>
        {/* Twoja zawartość */}
      </main>
      <FooterV2 />
    </ThemeProvider>
  );
}
```

---

## 🐛 Troubleshooting

### Problem: Animacje nie działają
**Rozwiązanie:** Sprawdź czy Tailwind jest poprawnie skonfigurowany:
```js
// tailwind.config.cjs
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  // ...
};
```

### Problem: Komponenty nie renderują się
**Rozwiązanie:** Upewnij się, że używasz `'use client'` w komponentach, które wymagają interaktywności.

### Problem: Scene3D nie wyświetla się
**Rozwiązanie:** To jest placeholder - wymaga implementacji Three.js (patrz sekcja "Implementacja Three.js").

---

## 📄 Licencja

Ten kod jest częścią projektu Aukcje Gołębi Pałka MTM.

---

## 🤝 Contributing

Przy dodawaniu nowych komponentów:
1. Użyj TypeScript z silnym typowaniem
2. Dodaj mikrointerakcje (hover, transitions)
3. Upewnij się o responsywność
4. Zachowaj paletę kolorów (biały, błękit, szary)
5. **NIE MODYFIKUJ** istniejących komponentów V1

---

## 📞 Support

W razie pytań, sprawdź:
- Ten README
- Komentarze w kodzie
- TypeScript type definitions w `types.ts`

---

**Wersja:** 2.0.0  
**Ostatnia aktualizacja:** 2024  
**Status:** ✅ Production Ready (poza Scene3D - wymaga Three.js)
