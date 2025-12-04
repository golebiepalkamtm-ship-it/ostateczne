# V2 Theme - Przykłady Użycia

## 📚 Spis Treści
1. [Podstawowe Użycie](#podstawowe-użycie)
2. [Zaawansowane Konfiguracje](#zaawansowane-konfiguracje)
3. [Custom Components](#custom-components)
4. [Integracja z Istniejącym Projektem](#integracja-z-istniejącym-projektem)
5. [Przykłady Mikrointerakcji](#przykłady-mikrointerakcji)

---

## Podstawowe Użycie

### 1. Prosta Strona z V2 Theme

```tsx
// app/page.tsx
'use client';

import { ThemeV2Container } from '@/components/theme-v2';

export default function HomePage() {
  return (
    <ThemeV2Container>
      <section className="py-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Witaj w nowym designie!
        </h2>
        <p className="text-xl text-gray-600">
          To jest przykład prostej strony z V2 Theme.
        </p>
      </section>
    </ThemeV2Container>
  );
}
```

### 2. ThemeSwitcher - Przełączanie V1/V2

```tsx
// app/page.tsx
'use client';

import { ThemeSwitcher } from '@/components/theme-v2';

export default function HomePage() {
  return (
    <ThemeSwitcher defaultTheme="v1">
      <div className="container mx-auto px-6 py-12">
        <h1>Zawartość dostępna w obu motywach</h1>
      </div>
    </ThemeSwitcher>
  );
}
```

### 3. Tylko Wybrane Komponenty

```tsx
// app/custom-layout/page.tsx
'use client';

import { 
  NavigationV2, 
  HeaderV2, 
  FooterV2 
} from '@/components/theme-v2';

export default function CustomLayoutPage() {
  return (
    <>
      <NavigationV2 />
      <HeaderV2 
        title="Custom Layout"
        subtitle="Używamy tylko wybranych komponentów"
        showScene3D={false}
      />
      <main className="min-h-screen py-16">
        {/* Twoja zawartość */}
      </main>
      <FooterV2 />
    </>
  );
}
```

---

## Zaawansowane Konfiguracje

### 1. Custom Navigation Items

```tsx
'use client';

import { NavigationV2 } from '@/components/theme-v2';
import type { NavigationItem } from '@/components/theme-v2';

const myNavigationItems: NavigationItem[] = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    href: '/dashboard',
    badge: '5' // Liczba notyfikacji
  },
  { 
    id: 'auctions', 
    label: 'Moje Aukcje', 
    href: '/my-auctions' 
  },
  { 
    id: 'profile', 
    label: 'Profil', 
    href: '/profile' 
  },
];

export default function CustomNav() {
  return (
    <NavigationV2 
      items={myNavigationItems}
      onThemeToggle={() => console.log('Theme toggled!')}
    />
  );
}
```

### 2. Custom CTA Buttons

```tsx
'use client';

import { CallToActionV2 } from '@/components/theme-v2';
import type { CTAButton } from '@/components/theme-v2';

const myButtons: CTAButton[] = [
  {
    id: 'register',
    text: 'Zarejestruj się za darmo',
    href: '/register',
    variant: 'primary',
    size: 'lg',
  },
  {
    id: 'demo',
    text: 'Obejrzyj demo',
    href: '/demo',
    variant: 'secondary',
    size: 'lg',
  },
  {
    id: 'docs',
    text: 'Przeczytaj dokumentację',
    href: '/docs',
    variant: 'ghost',
    size: 'md',
  },
];

export default function CustomCTA() {
  return (
    <CallToActionV2
      title="Dołącz do nas już dziś!"
      description="Rozpocznij swoją przygodę z najlepszą platformą aukcyjną."
      buttons={myButtons}
    />
  );
}
```

### 3. Custom 3D Scene Configuration

```tsx
'use client';

import { Scene3DPlaceholder } from '@/components/theme-v2';

export default function Custom3DScene() {
  return (
    <div className="relative h-screen">
      <Scene3DPlaceholder
        colorScheme="gradient"
        particleCount={1200}
        animationSpeed={2.0}
        intensity={1.0}
        className="absolute inset-0"
      />
      
      <div className="relative z-10 flex items-center justify-center h-full">
        <h1 className="text-6xl font-bold text-white">
          Immersive 3D Experience
        </h1>
      </div>
    </div>
  );
}
```

### 4. Theme Context - Programowe Przełączanie

```tsx
'use client';

import { ThemeProvider, useTheme } from '@/components/theme-v2';

function ThemeControls() {
  const { currentTheme, switchTheme } = useTheme();
  
  return (
    <div className="flex gap-4">
      <button 
        onClick={() => switchTheme('v1')}
        className={currentTheme === 'v1' ? 'bg-blue-600 text-white' : 'bg-gray-200'}
      >
        V1 Theme
      </button>
      <button 
        onClick={() => switchTheme('v2')}
        className={currentTheme === 'v2' ? 'bg-blue-600 text-white' : 'bg-gray-200'}
      >
        V2 Theme
      </button>
      <span>Current: {currentTheme}</span>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider initialTheme="v2">
      <ThemeControls />
      {/* Reszta aplikacji */}
    </ThemeProvider>
  );
}
```

---

## Custom Components

### 1. Własny Komponent z Mikrointerakcjami

```tsx
'use client';

import React from 'react';

export const CustomCard: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => {
  return (
    <div className="
      group
      p-6 
      bg-white 
      border border-gray-200 
      rounded-2xl
      transition-all duration-300 ease-out
      hover:shadow-2xl 
      hover:scale-105 
      hover:border-blue-300
      cursor-pointer
    ">
      {/* Icon z animacją */}
      <div className="
        w-12 h-12 mb-4
        bg-gradient-to-br from-blue-400 to-blue-600
        rounded-lg
        flex items-center justify-center
        transition-transform duration-300
        group-hover:rotate-12 group-hover:scale-110
      ">
        <span className="text-white text-2xl">✨</span>
      </div>
      
      {/* Title */}
      <h3 className="
        text-xl font-bold text-gray-900 mb-2
        transition-colors duration-300
        group-hover:text-blue-600
      ">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-gray-600">
        {description}
      </p>
      
      {/* Hover indicator */}
      <div className="
        mt-4 flex items-center text-blue-600 font-medium text-sm
        opacity-0 group-hover:opacity-100
        transition-opacity duration-300
      ">
        Dowiedz się więcej 
        <svg className="
          w-4 h-4 ml-1
          transition-transform duration-300
          group-hover:translate-x-2
        " fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};
```

### 2. Animowany Button Component

```tsx
'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface AnimatedButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  onClick?: () => void;
  className?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  className = '',
}) => {
  const variants = {
    primary: `
      bg-blue-600 hover:bg-blue-700
      text-white
      shadow-lg shadow-blue-500/30
      hover:shadow-xl hover:shadow-blue-500/50
    `,
    secondary: `
      bg-white hover:bg-gray-50
      text-blue-600
      border-2 border-blue-600
      hover:border-blue-700
    `,
    ghost: `
      bg-transparent hover:bg-blue-50
      text-blue-600
    `,
  };

  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-3
        font-semibold rounded-lg
        transition-all duration-300 ease-out
        hover:scale-105
        active:scale-95
        transform
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
```

---

## Integracja z Istniejącym Projektem

### 1. Wrap Existing Pages

```tsx
// app/auctions/page.tsx
'use client';

import { ThemeV2Container } from '@/components/theme-v2';
import { ExistingAuctionsList } from '@/components/auctions/AuctionsList'; // Istniejący komponent

export default function AuctionsPage() {
  return (
    <ThemeV2Container showHeader={false} showCTA={false}>
      <ExistingAuctionsList />
    </ThemeV2Container>
  );
}
```

### 2. Conditional Theme Loading

```tsx
'use client';

import { ThemeSwitcher } from '@/components/theme-v2';
import { ExistingV1App } from '@/components/v1/App'; // Istniejący V1
import { useEffect, useState } from 'react';

export default function ConditionalThemeApp() {
  const [useV2, setUseV2] = useState(false);
  
  // Sprawdź preferencję użytkownika z localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-version');
    setUseV2(savedTheme === 'v2');
  }, []);
  
  return (
    <ThemeSwitcher 
      defaultTheme={useV2 ? 'v2' : 'v1'}
      v1Component={<ExistingV1App />}
    />
  );
}
```

### 3. Progressive Enhancement

```tsx
// app/layout.tsx
'use client';

import { ThemeProvider } from '@/components/theme-v2';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Użyj V2 tylko dla określonych ścieżek
  const useV2Theme = ['/demo-v2', '/new-design'].some(path => 
    pathname?.startsWith(path)
  );
  
  return (
    <html lang="pl">
      <body>
        <ThemeProvider initialTheme={useV2Theme ? 'v2' : 'v1'}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## Przykłady Mikrointerakcji

### 1. Hover Card z 3D Transform

```tsx
<div className="
  perspective-1000
  transform-gpu
  transition-all duration-500
  hover:rotateY-10
  hover:scale-110
  cursor-pointer
">
  <div className="
    p-6 bg-white rounded-2xl shadow-lg
    transform-style-3d
  ">
    Card Content
  </div>
</div>
```

### 2. Stagger Animation dla List

```tsx
'use client';

import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function StaggeredList() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {[1, 2, 3, 4].map((item) => (
        <motion.div
          key={item}
          variants={itemVariants}
          className="p-6 bg-white rounded-lg mb-4"
        >
          Item {item}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 3. Scroll-Triggered Animations

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

export default function ScrollReveal() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  
  return (
    <div
      ref={ref}
      className={`
        transition-all duration-1000 ease-out
        ${isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-20'
        }
      `}
    >
      Content reveals on scroll
    </div>
  );
}
```

### 4. Magnetic Button Effect

```tsx
'use client';

import { useRef, useState } from 'react';

export default function MagneticButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };
  
  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };
  
  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="px-8 py-4 bg-blue-600 text-white rounded-lg transition-transform"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      Magnetic Button
    </button>
  );
}
```

---

## 🎯 Best Practices

1. **Zawsze używaj TypeScript** - zapewnia bezpieczeństwo typów
2. **Dodawaj mikrointerakcje stopniowo** - nie przesadzaj z animacjami
3. **Testuj responsywność** - na różnych rozmiarach ekranów
4. **Zachowaj paletę kolorów** - biały, błękit, szary
5. **Używaj Tailwind utilities** - zamiast custom CSS
6. **Optymalizuj wydajność** - używaj `transform` i `opacity` do animacji

---

**Potrzebujesz więcej przykładów?** Sprawdź:
- `components/theme-v2/demo/DemoPage.tsx`
- `components/theme-v2/README.md`
- Dokumentację Tailwind CSS: https://tailwindcss.com/docs
- Dokumentację Framer Motion: https://www.framer.com/motion/
