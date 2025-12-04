export async function register() {
  // Avoid importing Sentry during the Next.js production build step
  // Next sets NEXT_PHASE='phase-production-build' during build — bail out early
  if (process.env.NEXT_PHASE === 'phase-production-build') return

  // W development wyłącz Sentry - usuwa webpack warnings
  if (process.env.NODE_ENV === 'production') {
    // Dynamic import - only loads in production, avoids webpack processing in dev
    const Sentry = await import('@sentry/nextjs');

    if (process.env.NEXT_RUNTIME === 'nodejs') {
      await import('./sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
      await import('./sentry.edge.config');
    }

    // Export onRequestError only in production
    return {
      onRequestError: Sentry.captureRequestError,
    };
  }
}

// Export undefined in development to avoid importing Sentry
export const onRequestError = undefined;
