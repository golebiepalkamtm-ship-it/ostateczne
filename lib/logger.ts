export const isDev = process.env.NODE_ENV !== 'production';

// Simple client-safe logging (no winston dependency for client imports)
export const debug = (...args: any[]) => {
  if (isDev && typeof window === 'undefined') {
    console.debug('[DEBUG]', ...args);
  }
};

export const info = (...args: any[]) => {
  if (typeof window === 'undefined') {
    console.info('[INFO]', ...args);
  }
};

export const error = (...args: any[]) => {
  if (typeof window === 'undefined') {
    console.error('[ERROR]', ...args);
  }
};
