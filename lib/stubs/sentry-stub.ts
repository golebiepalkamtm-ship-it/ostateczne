/**
 * Stub dla @sentry/nextjs w development
 * Eliminuje webpack warnings związane z Prisma/OpenTelemetry instrumentation
 */

// Stub dla wszystkich funkcji Sentry - no-op w development
const noop = () => {};
const createNoopScope = () => ({
  setContext: noop,
  setTag: noop,
  setLevel: noop,
  setUser: noop,
  addBreadcrumb: noop,
});

// Export jako namespace - działa z `import * as Sentry`
export const init = noop;
export const captureException = noop;
export const captureMessage = noop;
export const withScope = (callback: (scope: ReturnType<typeof createNoopScope>) => void) => {
  callback(createNoopScope());
};
export const startSpan = async <T>(
  _options: { name: string; op?: string },
  callback: () => Promise<T>,
): Promise<T> => {
  return callback();
};
export const setUser = noop;
export const addBreadcrumb = noop;
export const setTag = noop;
export const setContext = noop;
export const configureScope = noop;
export const captureRequestError = noop;
export const replayIntegration = () => ({});
export const captureRouterTransitionStart = noop;

// Default export dla kompatybilności
const sentryStub = {
  init,
  captureException,
  captureMessage,
  withScope,
  startSpan,
  setUser,
  addBreadcrumb,
  setTag,
  setContext,
  configureScope,
  captureRequestError,
  replayIntegration,
  captureRouterTransitionStart,
};

export default sentryStub;

// Export types dla TypeScript
export type Scope = ReturnType<typeof createNoopScope>;
export type SpanOptions = { name: string; op?: string };
export type Breadcrumb = Record<string, unknown>;
export type User = Record<string, unknown>;

