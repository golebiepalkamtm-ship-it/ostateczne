// W development ten plik jest zastępowany przez webpack alias stubem
// W production ładuj prawdziwy Sentry
import * as Sentry from '@sentry/nextjs';
import { AppError } from './error-handling';

/**
 * Wysyła błąd do Sentry z kontekstem
 */
export function captureError(error: Error | AppError, context?: Record<string, unknown>) {
  // Nie loguj operacyjne błędy walidacji (400) do Sentry
  if (error instanceof AppError && error.isOperational && error.statusCode < 500) {
    return;
  }

  Sentry.withScope(scope => {
    // Dodaj kontekst
    if (context) {
      scope.setContext('additional', context);
    }

    // Dodaj tagi dla lepszej kategoryzacji
    if (error instanceof AppError) {
      scope.setTag('errorType', error.type);
      scope.setTag('statusCode', error.statusCode.toString());
      scope.setLevel(
        error.statusCode >= 500 ? 'error' : error.statusCode >= 400 ? 'warning' : 'info'
      );
    }

    // Dodaj dodatkowe dane
    if (error instanceof AppError && error.details) {
      const details =
        typeof error.details === 'object' && error.details !== null
          ? (error.details as Record<string, unknown>)
          : { value: String(error.details) };
      scope.setContext('errorDetails', details);
    }

    Sentry.captureException(error);
  });
}

/**
 * Wysyła wiadomość do Sentry (dla logowania zdarzeń)
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  context?: Record<string, unknown>
) {
  Sentry.withScope(scope => {
    if (context) {
      scope.setContext('messageContext', context);
    }
    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

/**
 * Dodaje kontekst użytkownika do Sentry
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}) {
  Sentry.setUser({
    ...user,
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Czyści kontekst użytkownika (np. po wylogowaniu)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Dodaje breadcrumb (ślad) do Sentry
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Wykonuje funkcję z monitoringiem performance w Sentry
 */
export async function withSentrySpan<T>(
  name: string,
  operation: string,
  callback: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: operation,
    },
    callback
  );
}

/**
 * Ustawia tag w Sentry (dla filtrowania)
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Ustawia kontekst w Sentry
 */
export function setContext(key: string, context: Record<string, unknown>) {
  Sentry.setContext(key, context);
}

/**
 * Ustawia poziom ważności dla następnych zdarzeń
 */
export function setLevel(level: 'debug' | 'info' | 'warning' | 'error' | 'fatal') {
  Sentry.withScope(scope => {
    scope.setLevel(level);
  });
}
