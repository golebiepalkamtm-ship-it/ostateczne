export const isDev = process.env.NODE_ENV !== 'production';

// Simple client-safe logging (no winston dependency for client imports)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debug = (...args: any[]) => {
  if (isDev && typeof window === 'undefined') {
    console.debug('[DEBUG]', ...args);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const info = (...args: any[]) => {
  if (typeof window === 'undefined') {
    console.info('[INFO]', ...args);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const error = (...args: any[]) => {
  if (typeof window === 'undefined') {
    console.error('[ERROR]', ...args);
  }
};
