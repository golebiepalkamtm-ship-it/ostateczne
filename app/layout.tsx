'use client';

// UWAGA: Nie ładuj tutaj Sentry config - Next.js automatycznie używa instrumentation-client.ts
// Ładowanie sentry.client.config tutaj powoduje podwójną inicjalizację!
// Next.js automatycznie obsługuje instrumentation-client.ts, więc te require() nie są potrzebne.

import ClientProviders from '@/components/providers/ClientProviders';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { useState, useEffect } from 'react';
import type { Viewport } from 'next';
import './globals.css';
import './loading-animation.css'; // Import custom CSS for the fade-out effect
import { initGlowingCards } from './glowing-cards';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // W production wyłącz overlay jeśli powoduje problemy
  const isProduction = typeof window !== 'undefined' && process.env.NODE_ENV === 'production';
  const enableLoadingOverlay = process.env.NEXT_PUBLIC_ENABLE_LOADING_OVERLAY !== 'false';
  
  const [isLoading, setIsLoading] = useState(false); // Domyślnie wyłączone
  const [fadeOut, setFadeOut] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Sprawdź czy jesteśmy w przeglądarce
  useEffect(() => {
    setIsClient(true);
    
    // Inicjalizuj glowing cards effect
    initGlowingCards();
    
    // Jeśli overlay jest wyłączony lub w production, od razu ukryj
    if (!enableLoadingOverlay || isProduction) {
      setIsLoading(false);
      return;
    }
    
    // Fallback: jeśli video się nie załaduje, ukryj overlay po 2 sekundach
    const fallbackTimer = setTimeout(() => {
      if (isLoading) {
        setVideoEnded(true);
        setFadeOut(true);
        setTimeout(() => setIsLoading(false), 500); // Krótszy fade-out
      }
    }, 2000);

    return () => clearTimeout(fallbackTimer);
  }, [isLoading, enableLoadingOverlay, isProduction]);

  // Obsługa zakończenia wideo - rozpoczyna fade-out białego tła
  const handleVideoEnd = () => {
    setVideoEnded(true);
    // Rozpocznij fade-out białego tła po zakończeniu wideo
    setTimeout(() => {
      setFadeOut(true);
    }, 100);
  };

  // Obsługa błędu ładowania video - automatycznie ukryj overlay (szybko!)
  const handleVideoError = () => {
    setVideoEnded(true);
    setFadeOut(true);
    setTimeout(() => setIsLoading(false), 500); // Krótszy fade-out w przypadku błędu
  };

  // Po zakończeniu fade-out usuń overlay (krótszy czas)
  useEffect(() => {
    if (fadeOut) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 600); // Krótszy czas fade-out (0.6 sekundy)
      return () => clearTimeout(timer);
    }
  }, [fadeOut]);

  return (
    <html lang="pl" data-scroll-behavior="smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          precedence="default"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
          precedence="default"
        />
      </head>
      <body className="relative">
        <a
          href="#main"
          className="sr-only focus:not-sr-only absolute top-2 left-2 bg-yellow-500 text-black px-3 py-1 z-[9999] rounded-lg"
        >
          Pomiń nawigację (Skip to content)
        </a>
        <ClientProviders>
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <ToastProvider />
        </ClientProviders>

        {/* Overlay z białym tłem i wideo - przykrywa główną zawartość */}
        {/* Tylko w przeglądarce i jeśli jest włączone ładowanie */}
        {isClient && isLoading && (
          <div className="fixed inset-0 z-[10000] pointer-events-none" aria-hidden="true">
            {/* Białe tło z fade-out - krótszy czas transition */}
            <div
              className={`absolute inset-0 bg-white transition-opacity duration-[500ms] ease-in-out ${
                fadeOut ? 'opacity-0' : 'opacity-100'
              }`}
            />
            {/* Wideo - widoczne dopóki się odtwarza */}
            {!videoEnded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <video
                  src="/loading-animation.mp4"
                  autoPlay
                  muted
                  loop={false}
                  onEnded={handleVideoEnd}
                  onError={handleVideoError}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
          </div>
        )}
      </body>
    </html>
  );
}
