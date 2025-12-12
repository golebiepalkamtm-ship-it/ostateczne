'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import gsap from 'gsap';
import './AuthFlipCard.css';
import Auth3DForm from './Auth3DForm';

type AuthMode = 'login' | 'register';

interface AuthFlipCardProps {
  initialMode?: AuthMode;
}

// Bazowe wymiary kostki (skorygowano: jeszcze niższa wysokość)
const BASE_WIDTH = 400;
const BASE_HEIGHT = 360; // poprzednio 420
const MIN_HEIGHT = 320;  // poprzednio 380
const MAX_HEIGHT = 520;  // poprzednio 600
const PADDING = 48; // padding wewnętrzny ścian

export function AuthFlipCard({ initialMode }: AuthFlipCardProps) {
  const searchParams = useSearchParams();
  const cubeRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const faceRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);
  const [currentFace, setCurrentFace] = useState(0);
  const [cubeHeight, setCubeHeight] = useState(BASE_HEIGHT);
  
  // Faces: 0 = front (rejestracja), 1 = right (logowanie), 2 = back (rejestracja), 3 = left (logowanie)
  const faces = [
    { type: 'register' as const, title: 'Utwórz konto', subtitle: 'Dołącz do naszej społeczności' },
    { type: 'login' as const, title: 'Zaloguj się', subtitle: 'Witaj z powrotem w świecie gołębi' },
    { type: 'register' as const, title: 'Zarejestruj się', subtitle: 'Rozpocznij swoją przygodę' },
    { type: 'login' as const, title: 'Witaj ponownie', subtitle: 'Zaloguj się do swojego konta' },
  ];

  // Nasłuchuj na weryfikację emaila w innej karcie
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'email-verified') {
        toast.success('🎉 Email został zweryfikowany! Twoje konto jest aktywne.', {
          duration: 5000,
          position: 'top-center',
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Funkcje pomocnicze dla efektu glowing edge (z CodePen)
  const centerOfElement = useCallback((el: HTMLElement) => {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }, []);

  const distanceFromCenter = useCallback((el: HTMLElement, x: number, y: number) => {
    const [cx, cy] = centerOfElement(el);
    return [x - cx, y - cy];
  }, [centerOfElement]);

  const closenessToEdge = useCallback((el: HTMLElement, x: number, y: number) => {
    const [cx, cy] = centerOfElement(el);
    const [dx, dy] = distanceFromCenter(el, x, y);
    let k_x = Infinity;
    let k_y = Infinity;
    if (dx !== 0) {
      k_x = cx / Math.abs(dx);
    }
    if (dy !== 0) {
      k_y = cy / Math.abs(dy);
    }
    return Math.min(Math.max(1 / Math.min(k_x, k_y), 0), 1);
  }, [centerOfElement, distanceFromCenter]);

  const angleFromPosition = useCallback((dx: number, dy: number) => {
    let angleDegrees = 0;
    if (dx !== 0 || dy !== 0) {
      const angleRadians = Math.atan2(dy, dx);
      angleDegrees = angleRadians * (180 / Math.PI) + 90;
      if (angleDegrees < 0) {
        angleDegrees += 360;
      }
    }
    return angleDegrees;
  }, []);

  const getPointerData = useCallback((element: HTMLElement, e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const perx = Math.min(Math.max((100 / rect.width) * px, 0), 100);
    const pery = Math.min(Math.max((100 / rect.height) * py, 0), 100);
    const [dx, dy] = distanceFromCenter(element, px, py);
    const edge = closenessToEdge(element, px, py);
    const angle = angleFromPosition(dx, dy);
    
    return { px, py, perx, pery, dx, dy, edge, angle };
  }, [distanceFromCenter, closenessToEdge, angleFromPosition]);

  // Obsługa ruchu myszy na scenie 3D dla efektu świecących krawędzi
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const handleMouseMove = (e: MouseEvent) => {
      const faces = scene.querySelectorAll('.auth-cube-face');
      faces.forEach((face) => {
        const faceEl = face as HTMLElement;
        const { angle, edge } = getPointerData(faceEl, e);
        faceEl.style.setProperty('--pointer-°', `${angle.toFixed(2)}deg`);
        faceEl.style.setProperty('--pointer-d', `${(edge * 100).toFixed(2)}`);
      });
    };

    const handleMouseLeave = () => {
      const faces = scene.querySelectorAll('.auth-cube-face');
      faces.forEach((face) => {
        const faceEl = face as HTMLElement;
        faceEl.style.setProperty('--pointer-d', '0');
      });
    };

    scene.addEventListener('mousemove', handleMouseMove);
    scene.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      scene.removeEventListener('mousemove', handleMouseMove);
      scene.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [getPointerData]);

  // Funkcja do obliczania wysokości kostki na podstawie zawartości
  const calculateCubeHeight = useCallback(() => {
    // Mierzymy wszystkie ścianki i bierzemy największą wysokość
    let maxHeight = MIN_HEIGHT;
    
    faceRefs.current.forEach((faceRef) => {
      if (!faceRef) return;
      
      // Znajdź zawartość formularza
      const formContent = faceRef.querySelector('.auth-3d-form-content');
      if (!formContent) return;

      // Zmierz rzeczywistą wysokość zawartości
      const contentRect = formContent.getBoundingClientRect();
      const contentScrollHeight = (formContent as HTMLElement).scrollHeight;
      const contentOffsetHeight = (formContent as HTMLElement).offsetHeight;
      
      // Użyj największej wartości
      const actualContentHeight = Math.max(
        contentRect.height,
        contentScrollHeight,
        contentOffsetHeight
      );
      
      const requiredHeight = actualContentHeight + PADDING;
      if (requiredHeight > maxHeight) {
        maxHeight = requiredHeight;
      }
    });

    // Ogranicz do MIN/MAX
    const finalHeight = Math.min(Math.max(maxHeight, MIN_HEIGHT), MAX_HEIGHT);
    
    if (finalHeight !== cubeHeight) {
      setCubeHeight(finalHeight);
    }
  }, [cubeHeight]);

  // Obserwuj zmiany w DOM (komunikaty błędów, sukcesu itp.)
  useEffect(() => {
    // Oblicz wysokość początkową po montażu
    const timeoutId = setTimeout(calculateCubeHeight, 100);
    
    // Utwórz MutationObserver do śledzenia zmian w DOM
    const observers: MutationObserver[] = [];
    const resizeObservers: ResizeObserver[] = [];
    
    faceRefs.current.forEach((faceRef) => {
      if (!faceRef) return;
      
      const observer = new MutationObserver(() => {
        // Daj chwilę na zakończenie renderowania React
        setTimeout(() => {
          requestAnimationFrame(calculateCubeHeight);
        }, 50);
      });

      // Obserwuj całą ściankę i wszystkie zmiany potomków
      observer.observe(faceRef, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });
      observers.push(observer);

      // Dodatkowo użyj ResizeObserver dla dokładniejszego śledzenia
      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(calculateCubeHeight);
      });

      const formContent = faceRef.querySelector('.auth-3d-form-content');
      if (formContent) {
        resizeObserver.observe(formContent);
      }
      resizeObservers.push(resizeObserver);
    });

    return () => {
      clearTimeout(timeoutId);
      observers.forEach(o => o.disconnect());
      resizeObservers.forEach(r => r.disconnect());
    };
  }, [calculateCubeHeight]);

  // Rotacja kostki
  const rotateCube = (direction: 'next' | 'prev') => {
    if (!cubeRef.current) return;

    const newFace = direction === 'next'
      ? (currentFace + 1) % 4
      : (currentFace - 1 + 4) % 4;

    const rotations = [
      { x: 0, y: 0 },      // front
      { x: 0, y: -90 },    // right
      { x: 0, y: -180 },   // back
      { x: 0, y: -270 },   // left
    ];

    gsap.to(cubeRef.current, {
      rotationY: rotations[newFace].y,
      rotationX: rotations[newFace].x,
      duration: 0.8,
      ease: 'power2.inOut',
    });

    setCurrentFace(newFace);
    
    // Po rotacji przelicz wysokość dla nowej ścianki
    setTimeout(calculateCubeHeight, 100);
  };

  // Generuj warstwy tła dla efektu głębi (identyczne jak na stronie osiągnięć)
  const renderStackedLayers = () => {
    return [...Array(11)].map((_, i) => {
      const layer = 11 - i;
      const offset = layer * 1.5;
      const opacity = Math.max(0.2, 0.7 - layer * 0.05);
      
      return (
        <div
          key={i}
          className="auth-cube-layer"
          style={{
            borderColor: `rgba(0, 0, 0, ${opacity})`,
            backgroundColor: `rgba(0, 0, 0, ${opacity * 0.8})`,
            transform: `translateX(${offset}px) translateY(${offset / 2}px) translateZ(-${offset}px)`,
            zIndex: i + 1
          }}
          aria-hidden="true"
        />
      );
    });
  };

  return (
    <>
      <div className="auth-cube-container">
        {/* Dekoracyjne tło */}
        <div className="auth-flip-background">
          <div className="geometric-grid"></div>
        </div>

        {/* Scene 3D - dynamiczne wymiary przez CSS variables */}
        <div
          ref={sceneRef}
          className="auth-cube-scene"
          style={{
            '--cube-width': `${BASE_WIDTH}px`,
            '--cube-height': `${cubeHeight}px`,
            '--cube-depth': `${BASE_WIDTH / 2}px`,
          } as React.CSSProperties}
        >
          <div ref={cubeRef} className="auth-cube">
            {/* Front - Rejestracja */}
            <div className="auth-cube-face-wrapper auth-cube-front-wrapper">
              {renderStackedLayers()}
              <div
                className="auth-cube-face auth-cube-front"
                ref={(el) => { faceRefs.current[0] = el; }}
              >
                {/* Glowing edge layer */}
                <div className="glow" aria-hidden="true"></div>
                <Auth3DForm
                  mode="register"
                  title={faces[0].title}
                  subtitle={faces[0].subtitle}
                  onToggle={() => rotateCube('next')}
                />
              </div>
            </div>

            {/* Right - Logowanie */}
            <div className="auth-cube-face-wrapper auth-cube-right-wrapper">
              {renderStackedLayers()}
              <div
                className="auth-cube-face auth-cube-right"
                ref={(el) => { faceRefs.current[1] = el; }}
              >
                {/* Glowing edge layer */}
                <div className="glow" aria-hidden="true"></div>
                <Auth3DForm
                  mode="login"
                  title={faces[1].title}
                  subtitle={faces[1].subtitle}
                  onToggle={() => rotateCube('next')}
                />
              </div>
            </div>

            {/* Back - Rejestracja */}
            <div className="auth-cube-face-wrapper auth-cube-back-wrapper">
              {renderStackedLayers()}
              <div
                className="auth-cube-face auth-cube-back"
                ref={(el) => { faceRefs.current[2] = el; }}
              >
                {/* Glowing edge layer */}
                <div className="glow" aria-hidden="true"></div>
                <Auth3DForm
                  mode="register"
                  title={faces[2].title}
                  subtitle={faces[2].subtitle}
                  onToggle={() => rotateCube('next')}
                />
              </div>
            </div>

            {/* Left - Logowanie */}
            <div className="auth-cube-face-wrapper auth-cube-left-wrapper">
              {renderStackedLayers()}
              <div
                className="auth-cube-face auth-cube-left"
                ref={(el) => { faceRefs.current[3] = el; }}
              >
                {/* Glowing edge layer */}
                <div className="glow" aria-hidden="true"></div>
                <Auth3DForm
                  mode="login"
                  title={faces[3].title}
                  subtitle={faces[3].subtitle}
                  onToggle={() => rotateCube('next')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AuthFlipCard;
