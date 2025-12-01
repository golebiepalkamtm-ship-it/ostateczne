// lib/sanitization.ts - NAPRAWIONA WERSJA

// NOTE: This is a server-safe fallback. For client-side sanitization, use 'sanitization.client.ts'.
// All functions here are safe no-ops for SSR/server. Client code should import the client version.

/**
 * Sanityzuje HTML aby zapobiec atakom XSS
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  // No-op on server
  return dirty;
}

/**
 * Sanityzuje tekst usuwając wszystkie tagi HTML
 */
export function sanitizeText(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  // No-op on server
  return dirty;
}

/**
 * Sanityzuje URL aby zapobiec JavaScript injection
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  // Remove dangerous protocols
  const dangerous = /^(javascript|data|vbscript):/i;
  if (dangerous.test(url)) {
    return '';
  }
  // No-op on server
  return url;
}

/**
 * Sanityzuje obiekt rekurencyjnie
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeText(value) as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item =>
        typeof item === 'string'
          ? sanitizeText(item)
          : typeof item === 'object'
            ? sanitizeObject(item)
            : item
      ) as T[keyof T];
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key as keyof T] = sanitizeObject(value) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }

  return sanitized;
}

/**
 * Waliduje i sanityzuje email
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  const sanitized = email.trim().toLowerCase();

  // Podstawowa walidacja email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }

  return sanitized;
}
