# V2 Theme - Przewodnik Implementacji

## 🎯 Cel

Ten dokument zawiera szczegółowe instrukcje dotyczące implementacji Three.js i WebGPU w komponentach V2 Theme.

---

## 📦 Biblioteki (już zainstalowane)

W `package.json` znajdują się już wszystkie wymagane zależności:

```json
{
  "dependencies": {
    "three": "^0.181.1",
    "@react-three/fiber": "^8.17.10",
    "@react-three/drei": "^9.117.0",
    "@react-spring/three": "^10.0.3",
    "gsap": "^3.13.0"
  }
}
```

---

## 🚀 Implementacja Three.js w Scene3DPlaceholder

### Krok 1: Zastąp Scene3DPlaceholder

Stwórz nowy plik `components/theme-v2/3d/Scene3D.tsx`:

```tsx
'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  MeshDistortMaterial, 
  Sphere,
  Float,
  Stars,
  Environment
} from '@react-three/drei';
import * as THREE from 'three';
import type { Scene3DProps } from '../types';

/**
 * Animowana geometria 3D
 */
function AnimatedGeometry({ colorScheme }: { colorScheme: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Kolor bazujący na schemacie
  const color = useMemo(() => {
    switch (colorScheme) {
      case 'blue': return '#3b82f6';
      case 'gradient': return '#8b5cf6';
      default: return '#6b7280';
    }
  }, [colorScheme]);
  
  // Animacja rotacji
  useFrame((state) => {
    if (!meshRef.current) return;
    
    meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.3;
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
  });
  
  return (
    <Float
      speed={2}
      rotationIntensity={0.5}
      floatIntensity={0.5}
    >
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

/**
 * System cząsteczek
 */
function ParticleSystem({ count = 500 }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Generuj pozycje cząsteczek
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    
    return positions;
  }, [count]);
  
  // Animacja cząsteczek
  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#3b82f6"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * Główny komponent Scene3D
 */
export const Scene3D: React.FC<Scene3DProps> = ({
  className = '',
  intensity = 0.8,
  particleCount = 500,
  animationSpeed = 1.0,
  colorScheme = 'blue',
}) => {
  const [webGPUSupported, setWebGPUSupported] = React.useState(false);
  
  React.useEffect(() => {
    // Sprawdź wsparcie WebGPU
    if ('gpu' in navigator) {
      (async () => {
        try {
          const adapter = await (navigator as any).gpu.requestAdapter();
          setWebGPUSupported(!!adapter);
        } catch {
          setWebGPUSupported(false);
        }
      })();
    }
  }, []);
  
  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: webGPUSupported ? 'high-performance' : 'default'
        }}
        dpr={[1, 2]}
      >
        {/* Oświetlenie */}
        <ambientLight intensity={0.5 * intensity} />
        <directionalLight position={[10, 10, 5]} intensity={intensity} />
        <pointLight position={[-10, -10, -5]} intensity={0.5 * intensity} />
        
        {/* Gwiazdki w tle */}
        <Stars 
          radius={100} 
          depth={50} 
          count={2000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={animationSpeed}
        />
        
        {/* Animowana geometria */}
        <AnimatedGeometry colorScheme={colorScheme} />
        
        {/* System cząsteczek */}
        <ParticleSystem count={particleCount} />
        
        {/* Środowisko (HDR) */}
        <Environment preset="city" />
        
        {/* Kontrolki orbit */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5 * animationSpeed}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
      
      {/* Badge technologii */}
      <div className="absolute bottom-4 right-4 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs text-white/70 font-mono">
        {webGPUSupported ? '🚀 WebGPU' : '⚡ WebGL2'}
      </div>
    </div>
  );
};
```

### Krok 2: Aktualizuj HeaderV2

Zmień import w `components/theme-v2/layout/HeaderV2.tsx`:

```tsx
// Stara linia (usuń):
// import { Scene3DPlaceholder } from '../3d/Scene3DPlaceholder';

// Nowa linia (dodaj):
import { Scene3D } from '../3d/Scene3D';

// Następnie w komponencie zamień:
<Scene3DPlaceholder ... />
// na:
<Scene3D ... />
```

### Krok 3: Zaktualizuj Exports

W `components/theme-v2/index.ts` dodaj:

```tsx
// 3D Components
export { Scene3D } from './3d/Scene3D';
export { Scene3DPlaceholder } from './3d/Scene3DPlaceholder'; // Zachowaj dla wstecznej kompatybilności
```

---

## 🎨 Zaawansowane Efekty 3D

### 1. Post-Processing Effects

Zainstaluj (opcjonalnie):
```bash
npm install @react-three/postprocessing
```

Dodaj do Scene3D:

```tsx
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';

// W Canvas:
<EffectComposer>
  <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.9} height={300} />
  <ChromaticAberration offset={[0.002, 0.002]} />
</EffectComposer>
```

### 2. Shader Materials (Custom)

```tsx
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const CustomMaterial = shaderMaterial(
  { time: 0, color: new THREE.Color(0.2, 0.0, 0.1) },
  // Vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    
    void main() {
      gl_FragColor.rgba = vec4(0.5 + 0.3 * sin(vUv.yxx + time) + color, 1.0);
    }
  `
);

extend({ CustomMaterial });

// Użycie:
<mesh>
  <boxGeometry />
  <customMaterial time={time} />
</mesh>
```

### 3. Interaktywny Model 3D

```tsx
function InteractiveModel() {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.scale.x = clicked ? 1.5 : hovered ? 1.2 : 1;
      meshRef.current.scale.y = clicked ? 1.5 : hovered ? 1.2 : 1;
      meshRef.current.scale.z = clicked ? 1.5 : hovered ? 1.2 : 1;
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => setClicked(!clicked)}
    >
      <boxGeometry />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'blue'} />
    </mesh>
  );
}
```

---

## 🔧 Optymalizacja Wydajności

### 1. Lazy Loading dla 3D

```tsx
// components/theme-v2/3d/Scene3DLazy.tsx
'use client';

import dynamic from 'next/dynamic';

const Scene3D = dynamic(() => import('./Scene3D').then(mod => mod.Scene3D), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 animate-pulse" />
  ),
});

export default Scene3D;
```

### 2. Conditional Loading

```tsx
'use client';

import { useState, useEffect } from 'react';

export function Scene3DConditional(props: Scene3DProps) {
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    // Renderuj tylko na urządzeniach z dobrą grafiką
    const isHighPerformance = 
      window.navigator.hardwareConcurrency >= 4 &&
      window.matchMedia('(min-width: 768px)').matches;
    
    setShouldRender(isHighPerformance);
  }, []);
  
  if (!shouldRender) {
    return <Scene3DPlaceholder {...props} />;
  }
  
  return <Scene3D {...props} />;
}
```

### 3. LOD (Level of Detail)

```tsx
import { Detailed } from '@react-three/drei';

<Detailed distances={[0, 10, 20]}>
  {/* High detail (blisko) */}
  <mesh geometry={highPolyGeometry} />
  
  {/* Medium detail (średnio) */}
  <mesh geometry={mediumPolyGeometry} />
  
  {/* Low detail (daleko) */}
  <mesh geometry={lowPolyGeometry} />
</Detailed>
```

---

## 🧪 Testing 3D Components

### Vitest Test

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Scene3D } from './Scene3D';

// Mock Three.js
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: any) => <div data-testid="canvas">{children}</div>,
  useFrame: vi.fn(),
}));

describe('Scene3D', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(
      <Scene3D colorScheme="blue" particleCount={100} />
    );
    expect(getByTestId('canvas')).toBeInTheDocument();
  });
  
  it('shows WebGPU badge when supported', async () => {
    // Mock WebGPU support
    (global.navigator as any).gpu = {
      requestAdapter: vi.fn().mockResolvedValue({}),
    };
    
    const { findByText } = render(<Scene3D />);
    expect(await findByText(/WebGPU/)).toBeInTheDocument();
  });
});
```

---

## 📊 Performance Monitoring

### Dodaj Stats Panel

```tsx
import { Stats } from '@react-three/drei';

<Canvas>
  <Stats />
  {/* Reszta sceny */}
</Canvas>
```

### Custom Performance Hook

```tsx
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

export function usePerformanceMonitor(threshold = 60) {
  const fpsRef = useRef<number[]>([]);
  
  useFrame((state) => {
    const fps = 1 / state.clock.getDelta();
    fpsRef.current.push(fps);
    
    if (fpsRef.current.length > 60) {
      fpsRef.current.shift();
    }
    
    const avgFps = fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length;
    
    if (avgFps < threshold) {
      console.warn(`Low FPS detected: ${avgFps.toFixed(2)}`);
    }
  });
}
```

---

## 🎓 Przydatne Zasoby

### Dokumentacja
- [Three.js Docs](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Drei (helpers)](https://github.com/pmndrs/drei)
- [WebGPU Spec](https://gpuweb.github.io/gpuweb/)

### Narzędzia
- [gltf.pmnd.rs](https://gltf.pmnd.rs/) - Konwersja modeli 3D
- [Poly Pizza](https://poly.pizza/) - Darmowe modele 3D
- [Shadertoy](https://www.shadertoy.com/) - Shader playground

### Przykłady
- [pmnd.rs](https://pmnd.rs/) - Portfolio projektów PMNDRS
- [threejs.org/examples](https://threejs.org/examples/) - Oficjalne przykłady

---

## ✅ Checklist Implementacji

- [ ] Sprawdź czy Three.js działa poprawnie
- [ ] Zaimplementuj Scene3D z podstawową geometrią
- [ ] Dodaj system cząsteczek
- [ ] Zaimplementuj oświetlenie
- [ ] Dodaj kontrolki orbity
- [ ] Sprawdź wsparcie WebGPU
- [ ] Dodaj lazy loading dla wydajności
- [ ] Zoptymalizuj dla mobile
- [ ] Dodaj testy jednostkowe
- [ ] Przetestuj w różnych przeglądarkach
- [ ] Dodaj fallback dla starych przeglądarek
- [ ] Dokumentuj customowe shadery

---

**Status:** 🚀 Ready for implementation  
**Difficulty:** ⭐⭐⭐ (Intermediate to Advanced)  
**Estimated time:** 4-8 hours
