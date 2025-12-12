/**
 * Standardowe helpery do tworzenia odpowiedzi API
 * Zgodne z typami ApiResponse<T> z types/index.ts
 */

import { NextResponse } from 'next/server';
import { ApiSuccessResponse, ApiErrorResponse } from '@/types';

/**
 * Tworzy standardową odpowiedź sukcesu zgodną z ApiSuccessResponse<T>
 */
export function createApiSuccessResponse<T = unknown>(
  data: T,
  message?: string,
  status: number = 200,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

/**
 * Tworzy standardową odpowiedź błędu zgodną z ApiErrorResponse
 */
export function createApiErrorResponse(
  message: string,
  status: number = 400,
  code?: string,
  field?: string,
  details?: unknown,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      // Budujemy obiekt błędu krok po kroku, aby uniknąć spreadowania wartości o nieznanym typie
      error: (() => {
        const e: any = { message };
        if (code) e.code = code;
        if (field) e.field = field;
        if (typeof details !== 'undefined') e.details = details;
        return e as ApiErrorResponse['error'];
      })(),
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

/**
 * Helper do parsowania odpowiedzi API na frontendzie
 * Type-safe wrapper dla fetch()
 */
export async function parseApiResponse<T = unknown>(
  response: Response,
): Promise<ApiSuccessResponse<T> | ApiErrorResponse> {
  const data = await response.json();
  
  if (!response.ok) {
    // Jeśli backend zwraca ApiErrorResponse, zwróć go
    if (data.success === false) {
      return data as ApiErrorResponse;
    }
    // Fallback dla starych formatów
    return {
      success: false,
      error: {
        message: data.error || 'Wystąpił błąd',
        code: data.code,
        details: data.details,
      },
      timestamp: new Date().toISOString(),
    };
  }
  
  // Jeśli backend zwraca ApiSuccessResponse, zwróć go
  if (data.success === true) {
    return data as ApiSuccessResponse<T>;
  }
  
  // Fallback dla starych formatów - wrap w ApiSuccessResponse
  return {
    success: true,
    data: data as T,
    timestamp: new Date().toISOString(),
  };
}

