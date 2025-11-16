import { NextRequest, NextResponse } from 'next/server';

// Trasy wymagające autoryzacji
const protectedRoutes = ['/dashboard', '/admin', '/seller', '/auctions', '/profile', '/settings'];

// Wymogi poziomów dla części tras (proste routingi po prefixie)
const level2Routes = ['/profile'];
const level3Routes = ['/auctions/create', '/seller', '/auctions/bid'];

// Trasy wymagające uprawnień administratora
const adminRoutes = ['/admin'];

// Funkcja sprawdzająca czy request jest HTTPS
function isHttps(request: NextRequest): boolean {
  return (
    request.headers.get('x-forwarded-proto') === 'https' ||
    request.headers.get('x-forwarded-protocol') === 'https' ||
    request.url.startsWith('https://')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignoruj znane przypadki, które mogą generować 404 (nie loguj ich)
  const silentPaths = [
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/apple-touch-icon.png',
    '/favicon-32x32.png',
    '/favicon-16x16.png',
    '/site.webmanifest',
    '/metrics', // Prometheus może próbować
  ];

  // Nie loguj 404 dla znanych ścieżek
  if (silentPaths.some(path => pathname === path || pathname.startsWith(path))) {
    // Przekieruj /metrics do /api/metrics
    if (pathname === '/metrics') {
      return NextResponse.redirect(new URL('/api/metrics', request.url), 302);
    }
    // Dla innych - pozwól przejść dalej bez logowania
    return NextResponse.next();
  }

  // Wymuszenie HTTPS w produkcji
  if (process.env.NODE_ENV === 'production' && !isHttps(request)) {
    const httpsUrl = `https://${request.headers.get('host')}${pathname}${request.url.split('?')[1] ? '?' + request.url.split('?')[1] : ''}`;
    return NextResponse.redirect(httpsUrl, 301);
  }

  // Sprawdź czy trasa wymaga autoryzacji
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  try {
    // Preferuj nagłówek Authorization: Bearer <token>, w przeciwnym razie użyj ciasteczka
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const cookieToken = request.cookies.get('firebase-auth-token')?.value;
    const bearerToken =
      authHeader && authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.substring(7)
        : undefined;
    const token = bearerToken || cookieToken;

    if (!token) {
      const loginUrl = new URL('/auth/register', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

    // Lekkie bramki na poziomie UI (bez walidacji tokenu w middleware):
    // - jeśli wchodzimy na trasy tylko Poziomu 2/3, a brak cookie z potwierdzeniem poziomu, przekieruj do odpowiednich ekranów
    // Uwaga: Rzeczywista autoryzacja jest w API routes. Middleware robi tylko UX redirect.

    const cookies = request.cookies;
    const level2Cookie = cookies.get('level2-ok')?.value;
    const level3Cookie = cookies.get('level3-ok')?.value;

    if (level2Routes.some(p => pathname.startsWith(p)) && !level2Cookie) {
      const url = new URL('/auth/register', request.url);
      url.searchParams.set('needs', 'email');
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    if (level3Routes.some(p => pathname.startsWith(p)) && !level3Cookie) {
      const url = new URL('/profile', request.url);
      url.searchParams.set('needs', 'sms');
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (err) {
    console.error('Middleware authentication error:', err instanceof Error ? err.message : err);

    // W przypadku błędu, przekieruj do rejestracji
    const loginUrl = new URL('/auth/register', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('error', 'AuthenticationError');
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|auth).*)',
  ],
};
