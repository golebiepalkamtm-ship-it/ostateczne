'use client';

import { useEffect, useRef } from 'react';

// Typy dla biblioteki LiquidBackground
interface LiquidApp {
  loadImage: (url: string) => void;
  liquidPlane: {
    material: {
      metalness: number;
      roughness: number;
    };
    uniforms: {
      displacementScale: {
        value: number;
      };
    };
  };
  setRain: (enabled: boolean) => void;
}

declare global {
  interface Window {
    LiquidBackground?: (canvas: HTMLCanvasElement) => LiquidApp;
    liquidBackgroundInitialized?: boolean;
  }
}

// Global flag aby uniknąć podwójnej inicjalizacji
let scriptLoaded = false;

/**
 * LiquidBackground - Efekt płynnego tła 3D z Three.js
 * Wykorzystuje bibliotekę threejs-components z CDN
 */
export function LiquidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<LiquidApp | null>(null);

  useEffect(() => {
    if (!canvasRef.current || scriptLoaded) return;

    scriptLoaded = true;

    // Dodaj script do head - tylko raz
    const script = document.createElement('script');
    script.type = 'module';
    script.id = 'liquid-background-script';
    script.innerHTML = `
      import LiquidBackground from 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.22/build/backgrounds/liquid1.min.js';
      
      const canvas = document.getElementById('liquid-canvas');
      if (canvas && !window.liquidBackgroundInitialized) {
        window.liquidBackgroundInitialized = true;
        const app = LiquidBackground(canvas);
        app.loadImage('/pigeon-lofts-background.jpg');
        
        // Zwiększony kontrast i kolory - więcej metallic, mniej roughness
        app.liquidPlane.material.metalness = 0.6;
        app.liquidPlane.material.roughness = 0.4;
        
        // Dodaj emissive light - bardzo przygaszone
        if (app.liquidPlane.material.emissive) {
          app.liquidPlane.material.emissive.setRGB(0.0, 0.0, 0.0);
          app.liquidPlane.material.emissiveIntensity = 0.0;
        }
        
        app.liquidPlane.uniforms.displacementScale.value = 2.5;
        app.setRain(false);
        
        // Dopasuj kamerę - oddal i przesuń mocno w dół aby pokazać cały dach
        if (app.camera) {
          app.camera.position.z = 2.2;
          app.camera.position.y = -0.6;
          app.camera.updateProjectionMatrix();
        }
        
        // Zwiększ skalę płaszczyzny i przesuń mocno w dół
        if (app.liquidPlane) {
          app.liquidPlane.scale.set(2.4, 2.4, 1);
          app.liquidPlane.position.y = -0.5;
        }
      }
    `;

    document.head.appendChild(script);

    return () => {
      // Cleanup przy unmount całego komponentu
      const existingScript = document.getElementById('liquid-background-script');
      if (existingScript?.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
      scriptLoaded = false;
      window.liquidBackgroundInitialized = false;
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      <canvas
        ref={canvasRef}
        id="liquid-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          filter: 'contrast(1.3) saturate(1.4) brightness(0.5)',
        }}
      />
    </div>
  );
}

