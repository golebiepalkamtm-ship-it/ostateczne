// Server root layout — head tags must be rendered on server so external styles (FontAwesome) load correctly
import type { Viewport } from 'next';
import './globals.css';
import './loading-animation.css';
import ClientRoot from '@/components/layout/ClientRoot';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
