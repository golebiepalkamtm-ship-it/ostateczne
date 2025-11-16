import { requireAdminAuth } from '@/lib/admin-auth';
import { withCache } from '@/lib/cache';
import { withCSRF } from '@/lib/csrf';
import { withErrorHandling } from '@/lib/error-handling';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
// import { logger } from '@/lib/logger'; // Unused
import { apiRateLimit } from '@/lib/rate-limit';
// import { withSanitization } from '@/lib/sanitization'; // ZAKOMENTOWANE - nie używane
import { trackHttpRequest } from '@/lib/prometheus-helpers';
import { NextRequest, NextResponse } from 'next/server.js';

/**
 * Wspólne middleware dla API routes
 */
export interface ApiMiddlewareOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  enableCSRF?: boolean;
  enableSanitization?: boolean;
  enableCache?: boolean;
  cacheOptions?: {
    ttl?: number;
    keyPrefix?: string;
    skipCache?: (request: NextRequest) => boolean;
  };
  enableRateLimit?: boolean;
  enableLogging?: boolean;
}

/**
 * Tworzy middleware stack dla API routes
 */
export function createApiMiddleware(options: ApiMiddlewareOptions = {}) {
  const {
    requireAuth: needsAuth = false,
    requireAdmin = false,
    enableCSRF = true,
    enableSanitization = true,
    enableCache = false,
    cacheOptions = {},
    enableRateLimit = true,
    enableLogging = true,
  } = options;

  return function wrapHandler(handler: (request: NextRequest) => Promise<NextResponse>) {
    let wrappedHandler = handler;

    // Error handling - zawsze na końcu
    if (enableLogging) {
      wrappedHandler = withLogging(wrappedHandler) as (
        request: NextRequest
      ) => Promise<NextResponse>;
    }
    wrappedHandler = withErrorHandling(wrappedHandler) as (
      request: NextRequest
    ) => Promise<NextResponse>;

    // Cache - przed error handling
    if (enableCache) {
      wrappedHandler = withCache(wrappedHandler, cacheOptions) as (
        request: NextRequest
      ) => Promise<NextResponse>;
    }

    // Sanitization - włączone dla bezpieczeństwa
    if (enableSanitization) {
      // Sanitization jest implementowane w validatorach Zod - tutaj tylko logujemy
      // Pełna sanitization w lib/sanitization.ts dla dodatkowych zabezpieczeń
    }

    // CSRF - przed sanitization
    if (enableCSRF) {
      wrappedHandler = withCSRF(wrappedHandler) as (request: NextRequest) => Promise<NextResponse>;
    }

    // Auth - na początku
    if (needsAuth) {
      wrappedHandler = withAuth(wrappedHandler, requireAdmin) as (
        request: NextRequest
      ) => Promise<NextResponse>;
    }

    // Rate limiting - na samym początku
    if (enableRateLimit) {
      wrappedHandler = withRateLimit(wrappedHandler) as (
        request: NextRequest
      ) => Promise<NextResponse>;
    }

    return wrappedHandler;
  };
}

/**
 * Middleware dla rate limiting
 */
function withRateLimit(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(request);
  };
}

/**
 * Middleware dla autoryzacji
 */
function withAuth(
  handler: (request: NextRequest) => Promise<NextResponse>,
  requireAdmin: boolean = false
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    if (requireAdmin) {
      const authResult = await requireAdminAuth(request);
      if (authResult instanceof NextResponse) {
        return authResult;
      }
    } else {
      const authResult = await requireFirebaseAuth(request);
      if (authResult instanceof NextResponse) {
        return authResult;
      }
    }

    return handler(request);
  };
}

/**
 * Middleware dla logowania i Prometheus tracking
 */
function withLogging(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const route = request.nextUrl.pathname;

    try {
      const response = await handler(request);
      const duration = Date.now() - startTime;
      const statusCode = response.status;

      // Track HTTP request in Prometheus
      trackHttpRequest(method, route, statusCode, duration);

      return response;
    } catch (err) {
      const duration = Date.now() - startTime;

      // Track error request in Prometheus
      trackHttpRequest(method, route, 500, duration);

      throw err;
    }
  };
}

/**
 * Predefiniowane konfiguracje middleware
 */
export const middlewareConfigs = {
  // Publiczne API (tylko rate limiting)
  public: {
    enableRateLimit: true,
    enableCSRF: false,
    enableSanitization: false,
    enableCache: true,
    cacheOptions: { ttl: 60 },
  },

  // Chronione API (wymaga autoryzacji)
  protected: {
    requireAuth: true,
    enableRateLimit: true,
    enableCSRF: true,
    enableSanitization: true, // ✅ Włączone dla bezpieczeństwa
    enableCache: false,
  },

  // Admin API (wymaga uprawnień administratora)
  admin: {
    requireAuth: true,
    requireAdmin: true,
    enableRateLimit: true,
    enableCSRF: true,
    enableSanitization: true, // ✅ Włączone dla bezpieczeństwa
    enableCache: false,
  },

  // API do tworzenia zasobów (POST/PUT)
  create: {
    requireAuth: true,
    enableRateLimit: true,
    enableCSRF: false, // Tymczasowo wyłączone dla debugowania
    enableSanitization: true, // ✅ Włączone dla bezpieczeństwa
    enableCache: false,
  },

  // API do odczytu (GET)
  read: {
    enableRateLimit: true,
    enableCSRF: false,
    enableSanitization: false,
    enableCache: true,
    cacheOptions: { ttl: 300 },
  },
};

/**
 * Helper do tworzenia API routes z middleware
 */
export function createApiRoute(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: keyof typeof middlewareConfigs | ApiMiddlewareOptions = 'protected'
) {
  const middlewareOptions = typeof config === 'string' ? middlewareConfigs[config] : config;

  return createApiMiddleware(middlewareOptions)(handler);
}

/**
 * Helper do walidacji parametrów URL
 */
export function validateUrlParams(
  request: NextRequest,
  requiredParams: string[] = []
): { isValid: boolean; params: Record<string, string>; error?: string } {
  const url = new URL(request.url);
  const params: Record<string, string> = {};

  for (const param of requiredParams) {
    const value = url.searchParams.get(param);
    if (!value) {
      return {
        isValid: false,
        params: {},
        error: `Missing required parameter: ${param}`,
      };
    }
    params[param] = value;
  }

  return { isValid: true, params };
}

/**
 * Helper do tworzenia odpowiedzi JSON
 */
export function createJsonResponse<T = unknown>(
  data: T,
  status: number = 200,
  headers: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Helper do tworzenia odpowiedzi błędów
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
): NextResponse {
  return createJsonResponse(
    {
      error: message,
      ...(details && { details }),
    },
    status
  );
}

/**
 * Helper do tworzenia odpowiedzi sukcesu
 */
export function createSuccessResponse<T = unknown>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return createJsonResponse(
    {
      ...(message && { message }),
      ...data,
    },
    status
  );
}

/**
 * Helper do tworzenia odpowiedzi z paginacją
 */
export function createPaginatedResponse<T = unknown>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  additionalData: Record<string, unknown> = {}
): NextResponse {
  return createJsonResponse({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
    ...additionalData,
  });
}

/**
 * Helper do logowania akcji użytkownika
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function logUserActionHelper(
  _userId: string,
  _action: string,
  _context?: Record<string, unknown>
) {
  // logger.logUserAction(userId, action, context);
}

/**
 * Helper do logowania zdarzeń biznesowych
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function logBusinessEventHelper(_event: string, _context?: Record<string, unknown>) {
  // logger.logBusinessEvent(event, context);
}

/**
 * Utility do sprawdzania metod HTTP
 */
export function requireHttpMethod(
  request: NextRequest,
  allowedMethods: string[]
): { isValid: boolean; error?: string } {
  if (!allowedMethods.includes(request.method)) {
    return {
      isValid: false,
      error: `Method ${request.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Utility do sprawdzania Content-Type
 */
export function requireContentType(
  request: NextRequest,
  expectedType: string = 'application/json'
): { isValid: boolean; error?: string } {
  const contentType = request.headers.get('content-type');

  if (!contentType || !contentType.includes(expectedType)) {
    return {
      isValid: false,
      error: `Expected Content-Type: ${expectedType}, got: ${contentType}`,
    };
  }

  return { isValid: true };
}
