'use client';

// Sentry configs are loaded conditionally in their own files
// Import them here only in production to avoid webpack warnings in dev
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@/sentry.client.config');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@/sentry.server.config');
}
import ClientProviders from '@/components/providers/ClientProviders';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { useState, useEffect } from 'react';
import type { Viewport } from 'next';
import './globals.css';
import './loading-animation.css'; // Import custom CSS for the fade-out effect

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  // Obsługa zakończenia wideo - rozpoczyna fade-out białego tła
  const handleVideoEnd = () => {
    setVideoEnded(true);
    // Rozpocznij fade-out białego tła po zakończeniu wideo
    setTimeout(() => {
      setFadeOut(true);
    }, 100);
  };

  // Po zakończeniu fade-out usuń overlay
  useEffect(() => {
    if (fadeOut) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 3500); // Czas trwania fade-out (3.5 sekundy)
      return () => clearTimeout(timer);
    }
  }, [fadeOut]);

  return (
    <html lang="pl" data-scroll-behavior="smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
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
        {isLoading && (
          <div className="fixed inset-0 z-[10000] pointer-events-none">
            {/* Białe tło z fade-out */}
            <div
              className={`absolute inset-0 bg-white transition-opacity duration-[3500ms] ease-in-out ${
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
