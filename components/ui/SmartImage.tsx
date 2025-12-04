'use client';

import Image from 'next/image';
import { ImageIcon, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SmartImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'empty' | 'blur';
  blurDataURL?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  fitMode?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | 'auto';
  cropFocus?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function SmartImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  onLoad,
  onError,
  fitMode = 'contain',
  aspectRatio = 'auto',
  cropFocus = 'center',
}: SmartImageProps) {
  // Sprawdź czy src jest prawidłowy - nie modyfikuj URL-i zewnętrznych
  const isValidSrc = src && typeof src === 'string' && src.trim() !== '';

  // Next/Image nie obsługuje blob: (URL.createObjectURL) ani niektórych data: URL poprawnie
  // Również API routes wymagają regularnych img tagów
  const isBlobOrDataUrl = typeof src === 'string' && (/^blob:/.test(src) || /^data:/.test(src));
  const isApiRoute = typeof src === 'string' && /^\/api\//.test(src);
  const isLocalUrl = typeof src === 'string' && /^\/[^a]/.test(src) && !isApiRoute && !isBlobOrDataUrl;

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority || isApiRoute); // API routes load immediately
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading (skip for API routes and priority images)
  useEffect(() => {
    if (priority || isInView || isApiRoute) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          try {
            observer.disconnect();
          } catch {
            // ignore
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      try {
        observer.disconnect();
      } catch {
        // ignore
      }
    };
  }, [priority, isInView, imgRef, isApiRoute]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  // Proste klasy CSS na podstawie parametrów
  const getImageClasses = () => {
    const baseClasses = 'w-full h-full object-center transition-opacity duration-300';
    const loadedClasses = isLoaded ? 'opacity-100' : 'opacity-0';

    const fitClasses = {
      cover: 'object-cover',
      contain: 'object-contain',
      fill: 'object-fill',
      none: 'object-none',
      'scale-down': 'object-scale-down',
    }[fitMode] || 'object-contain';

    const aspectClasses = {
      square: 'aspect-square',
      video: 'aspect-video',
      portrait: 'aspect-[3/4]',
      landscape: 'aspect-[4/3]',
      auto: '',
    }[aspectRatio] || '';

    return `${baseClasses} ${loadedClasses} ${fitClasses} ${aspectClasses}`;
  };

  if (!isValidSrc) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Brak obrazu</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      {...(width && height && !fill ? { style: { width, height } } : {})}
    >
      {/* Loading placeholder */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error placeholder */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Błąd ładowania obrazu</p>
          </div>
        </div>
      )}

      {/* Blur placeholder */}
      {placeholder === 'blur' && blurDataURL && !isLoaded && !isError && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110"
          data-bg-image={blurDataURL}
        />
      )}

      {/* Actual image */}
      {isInView && (
        isBlobOrDataUrl || isApiRoute || isLocalUrl ? (
          <img
            src={src}
            alt={alt}
            className={getImageClasses()}
            onLoad={handleLoad}
            onError={handleError}
            {...(width && height && !fill ? { width, height } : {})}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            fill={fill}
            width={!fill ? (width || 400) : undefined}
            height={!fill ? (height || 300) : undefined}
            className={getImageClasses()}
            onLoad={handleLoad}
            onError={handleError}
            priority={priority}
            quality={quality}
            sizes={sizes}
            placeholder={placeholder === 'blur' && blurDataURL ? 'blur' : 'empty'}
            blurDataURL={blurDataURL}
          />
        )
      )}

      {/* Fade in animation */}
      {isLoaded && (
        <div
          className="absolute inset-0 bg-white dark:bg-gray-900"
          style={{
            opacity: 1,
            transition: 'opacity 0.3s',
          }}
        />
      )}
    </div>
  );
}

// Hook dla preloadingu obrazów
export function useImagePreload(src: string) {
  const [isPreloaded, setIsPreloaded] = useState(false);

  useEffect(() => {
    if (!src || typeof window === 'undefined') return;

    const img = new window.Image();
    img.onload = () => setIsPreloaded(true);
    img.onerror = () => setIsPreloaded(false);
    img.src = src;

    return () => {
      try {
        img.onload = null;
        img.onerror = null;
      } catch {
        // ignore
      }
    };
  }, [src]);

  return isPreloaded;
}

// Hook dla batch preloadingu
export function useBatchImagePreload(srcs: string[]) {
  const [preloadedCount, setPreloadedCount] = useState(0);
  const [isAllPreloaded, setIsAllPreloaded] = useState(false);

  useEffect(() => {
    if (!srcs.length) return;

    let loadedCount = 0;
    const totalCount = srcs.length;

    const preloadImage = (src: string) => {
      const img = new window.Image();
      img.onload = () => {
        loadedCount++;
        setPreloadedCount(loadedCount);
        if (loadedCount === totalCount) {
          setIsAllPreloaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        setPreloadedCount(loadedCount);
        if (loadedCount === totalCount) {
          setIsAllPreloaded(true);
        }
      };
      img.src = src;
    };

    srcs.forEach(preloadImage);
  }, [srcs]);

  return { preloadedCount, isAllPreloaded, progress: preloadedCount / srcs.length };
}
