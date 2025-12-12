'use client';

import { motion, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { MouseEventHandler, useEffect, useState, useRef, useMemo } from 'react';
import { debug, isDev } from '@/lib/logger';

interface ImageItem {
  id: string;
  src: string;
  alt: string;
}

interface ImageModalProps {
  image: ImageItem;
  onClose: () => void; // Valid in 'use client' components
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalImages?: number;
  sourceElement?: HTMLElement | null;
}

export default function ImageModal({
  image,
  // @ts-ignore - TS71007: Functions are valid props in Client Components
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  currentIndex,
  totalImages,
  sourceElement,
}: ImageModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isBrowser, setIsBrowser] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'flying' | 'modal' | 'complete'>('flying');
  const [showBackground, setShowBackground] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const prevIndexRef = useRef<number | undefined>(currentIndex);
  const flightDoneRef = useRef(false);
  // Compute sourceRect from the provided `sourceElement` in a stable way
  const sourceRect = useMemo(() => {
    if (typeof window === 'undefined' || !sourceElement) return null;
    try {
      return sourceElement.getBoundingClientRect();
    } catch {
      return null;
    }
  }, [sourceElement]);
  
  // Detect navigation direction based on index change
  useEffect(() => {
    if (currentIndex !== undefined && prevIndexRef.current !== undefined) {
      if (currentIndex > prevIndexRef.current) {
        setSlideDirection('left'); // Going to next (slide from right)
      } else if (currentIndex < prevIndexRef.current) {
        setSlideDirection('right'); // Going to previous (slide from left)
      }
    }
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);
  
  // Initialize `isBrowser` on mount
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Initialize component and set up animations
  useEffect(() => {
    // Compute sourceRect here to avoid referencing non-stable values in deps
    const sourceRect = sourceElement ? sourceElement.getBoundingClientRect() : null;
    
    console.log('ImageModal: ===== INITIALIZING =====');
    console.log('ImageModal: Image data:', { id: image.id, src: image.src, alt: image.alt });
    console.log('ImageModal: Props:', { 
      sourceElement: !!sourceElement, 
      hasOnPrevious: !!onPrevious,
      hasOnNext: !!onNext,
      sourceRect: !!sourceRect,
      sourceRectDetails: sourceRect ? {
        width: sourceRect.width,
        height: sourceRect.height,
        left: sourceRect.left,
        top: sourceRect.top,
      } : null,
    });
    console.log('ImageModal: Starting initialization process...');

    // Skip animation if no source element OR invalid sourceRect - go directly to modal
    if (!sourceElement || !sourceRect || sourceRect.width === 0) {
      console.log('ImageModal: No source element or invalid rect, showing modal immediately');
      setAnimationPhase('complete');
      setShowBackground(true);
      return;
    }

    // Sterowanie przejściem do modala po zakończeniu animacji lotu
    // zostało przeniesione do onAnimationComplete na obrazie (bez setTimeout)

    // Lock scroll
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    // ESC key handler
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isDev) debug('ESC key pressed');
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);

    // Focus close button for accessibility
    setTimeout(() => {
      try {
        closeButtonRef.current?.focus();
      } catch {
        /* ignore */
      }
    }, 4500);

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
      window.removeEventListener('keydown', handleEscapeKey);
    };
  // We intentionally depend on props that affect the animation lifecycle. Avoid
  // including internal `isBrowser` state here to prevent a double-run.
  }, [onClose, sourceElement, image, onPrevious, onNext]);

  // Focus trap for accessibility
  useEffect(() => {
    if (!isBrowser) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const container = modalRef.current;
      if (!container) return;
      const focusable = container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBrowser]);

  // Keyboard navigation (arrows)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && onPrevious && hasPrevious) {
        onPrevious();
      } else if (event.key === 'ArrowRight' && onNext && hasNext) {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrevious, onNext, hasPrevious, hasNext]);

  // Ustaw focus na przycisku zamknięcia po pełnym pokazaniu modala
  useEffect(() => {
    if (animationPhase === 'complete') {
      setTimeout(() => {
        try { closeButtonRef.current?.focus(); } catch {}
      }, 100);
    }
  }, [animationPhase]);

  const handleZoomIn = () => {
    setZoomLevel((prev: number) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev: number) => Math.max(prev - 0.5, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.cancelable) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleBackdropClick: MouseEventHandler<HTMLDivElement> = e => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getInitialImagePosition = () => {
    if (sourceRect) {
      return {
        x: sourceRect.left + sourceRect.width / 2,
        y: sourceRect.top + sourceRect.height / 2,
        width: sourceRect.width,
        height: sourceRect.height,
      };
    }
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      width: 100,
      height: 100,
    };
  };

  const initialPos = getInitialImagePosition();

  if (!isBrowser) return null;

  const isFlying = (animationPhase === 'flying' || animationPhase === 'modal') && sourceRect && sourceRect.width > 0;
  const showModal = animationPhase === 'modal' || animationPhase === 'complete';
  const animationComplete = animationPhase === 'complete';
  
  console.log('ImageModal render:', { 
    animationPhase, 
    isFlying, 
    showModal, 
    animationComplete,
    sourceRectExists: !!sourceRect,
    sourceRectWidth: sourceRect?.width,
    isBrowser: isBrowser, 
  });

  return ReactDOM.createPortal(
    <>
      {/* Latające zdjęcie BEZ modala/tła - pokazuje się tylko gdy mamy sourceRect i jesteśmy w fazie 'flying' */}
      {isFlying && sourceRect && (() => {
        // PODEJŚCIE OD KOŃCA:
        // 1. Pozycja KOŃCOWA = środek ekranu (tam gdzie zdjęcie jest w modalu)
        // 2. Pozycja POCZĄTKOWA = sourceRect (karuzela)
        // 3. Animujemy WSTECZ: od offsetu (karuzela) do 0 (centrum)
        
        // Rozmiar końcowy (taki jak w modalu)
        const finalWidth = Math.min(window.innerWidth * 0.85, 1200);
        const finalHeight = Math.min(window.innerHeight * 0.85, 900);
        
        // Środek ekranu (pozycja końcowa - gdzie zdjęcie będzie w modalu)
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;
        
        // Środek źródłowego obrazka w karuzeli (pozycja początkowa)
        const sourceCenterX = sourceRect.left + sourceRect.width / 2;
        const sourceCenterY = sourceRect.top + sourceRect.height / 2;
        
        // Offset początkowy = różnica między źródłem a centrum ekranu
        // To jest przesunięcie od końcowej pozycji do początkowej
        const startOffsetX = sourceCenterX - screenCenterX;
        const startOffsetY = sourceCenterY - screenCenterY;
        
        // Skala początkowa (jak mały jest obrazek w karuzeli vs końcowy rozmiar)
        const startScale = sourceRect.width / finalWidth;
        
        return (
          <motion.div
            className="fixed inset-0 z-[99998] pointer-events-none flex items-center justify-center"
          >
            <motion.img
              src={image.src}
              alt={image.alt}
              className="object-contain"
              style={{
                width: finalWidth,
                height: finalHeight,
                maxWidth: '85vw',
                maxHeight: '85vh',
              }}
              initial={{
                // Zaczynamy z offsetem (pozycja karuzeli względem centrum)
                x: startOffsetX,
                y: startOffsetY,
                scale: startScale,
                opacity: 0,
              }}
              animate={{
                // Kończymy w centrum (offset = 0)
                x: 0,
                y: 0,
                scale: 1,
                opacity: 1,
              }}
              transition={{
                duration: 4,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              onAnimationStart={() => {
                // Start modal background after 2 seconds
                setTimeout(() => {
                  setAnimationPhase('modal');
                  setShowBackground(true);
                }, 2000);
              }}
              onAnimationComplete={() => {
                if (flightDoneRef.current) return;
                flightDoneRef.current = true;
                setAnimationPhase('complete');
              }}
            />
          </motion.div>
        );
      })()}

      {/* Modal z tłem - pokazuje się DOPIERO po zakończeniu lotu zdjęcia */}
      {showModal && (
        <motion.div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: showModal || animationPhase === 'complete' ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          onClick={handleBackdropClick}
          style={{
            pointerEvents: 'auto',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-modal-title"
          aria-describedby="image-modal-description"
        >
            {/* Accessibility labels */}
            <h2 id="image-modal-title" className="sr-only">
              {image.alt || 'Podgląd zdjęcia'}
              {currentIndex !== undefined && totalImages && totalImages > 1
                ? ` - Zdjęcie ${currentIndex + 1} z ${totalImages}`
                : ''}
            </h2>
            <p id="image-modal-description" className="sr-only">
              Modal do przeglądania zdjęć. Użyj przycisków nawigacji, aby przejść do poprzedniego
              lub następnego zdjęcia. Naciśnij Escape lub kliknij przycisk zamknij, aby zamknąć.
            </p>

            <motion.div
              ref={modalRef}
              className="relative w-full h-full max-w-none max-h-none overflow-hidden"
            >
              {/* Image Container with zoom and drag */}
              <div
                className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none overflow-hidden"
                style={{ backgroundColor: 'transparent' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={image.id}
                    src={image.src}
                    alt={image.alt}
                    className="max-w-full max-h-full object-contain"
                    initial={{
                      x: slideDirection === 'left' ? 300 : slideDirection === 'right' ? -300 : 0,
                      opacity: slideDirection ? 0 : 1,
                      scale: zoomLevel,
                    }}
                    animate={{
                      x: imagePosition.x / zoomLevel,
                      y: imagePosition.y / zoomLevel,
                      opacity: 1,
                      scale: zoomLevel,
                    }}
                    exit={{
                      x: slideDirection === 'left' ? -300 : slideDirection === 'right' ? 300 : 0,
                      opacity: 0,
                      scale: zoomLevel,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    drag={isDragging && animationComplete}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    onDrag={(e, info) => {
                      if (zoomLevel > 1 && animationComplete) {
                        setImagePosition({
                          x: imagePosition.x + info.delta.x,
                          y: imagePosition.y + info.delta.y,
                        });
                      }
                    }}
                  />
                </AnimatePresence>
              </div>
        {animationComplete && (
          <div className="absolute top-4 left-4 flex items-center space-x-2 z-[100001] pointer-events-auto">
            <button
              type="button"
              onMouseDown={e => e.stopPropagation()}
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Oddal"
            >
              <ZoomOut size={20} />
            </button>

            <button
              type="button"
              onMouseDown={e => e.stopPropagation()}
              onClick={handleResetZoom}
              className="px-3 py-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors text-sm"
              aria-label="Resetuj zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>

            <button
              type="button"
              onMouseDown={e => e.stopPropagation()}
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Przybliż"
            >
              <ZoomIn size={20} />
            </button>
          </div>
        )}

        {/* Image Counter - show only after animation */}
        {animationComplete && currentIndex !== undefined && totalImages && totalImages > 1 && (
          <div className="absolute top-4 right-20 px-4 py-2 rounded-full bg-black/50 text-white text-sm font-medium z-10">
            {currentIndex + 1} / {totalImages}
          </div>
        )}

        {/* Close Button - show only after animation */}
        {animationComplete && (
          <button
            type="button"
            ref={closeButtonRef}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation();
              if (isDev) debug('Close button clicked');
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors z-[100001] pointer-events-auto cursor-pointer"
            aria-label="Zamknij"
          >
            <X size={24} />
          </button>
        )}

        {/* Previous Button - show only after animation */}
        {animationComplete && onPrevious && hasPrevious && (
          <div className="absolute left-0 top-0 w-20 h-full flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity duration-300 z-[100] group">
            <button
              type="button"
              onMouseDown={e => e.stopPropagation()}
              onClick={onPrevious}
              className="p-4 rounded-full bg-black/80 text-white hover:bg-black/90 transition-all duration-200 hover:scale-110 shadow-lg"
              aria-label="Poprzednie zdjęcie"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Next Button - show only after animation */}
        {animationComplete && onNext && hasNext && (
          <div className="absolute right-0 top-0 w-20 h-full flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity duration-300 z-[100] group">
            <button
              type="button"
              onMouseDown={e => e.stopPropagation()}
              onClick={onNext}
              className="p-4 rounded-full bg-black/80 text-white hover:bg-black/90 transition-all duration-200 hover:scale-110 shadow-lg"
              aria-label="Następne zdjęcie"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
            </motion.div>
        </motion.div>
      )}
    </>,
    document.body,
  );
}