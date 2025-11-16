/**
 * Stub dla lib/sentry-helpers.ts w development
 * Eliminuje webpack warnings związane z Prisma/OpenTelemetry instrumentation
 * przez całkowite pominięcie importu @sentry/nextjs
 */

import { AppError } from '../error-handling';

// No-op functions - nie robią nic w development
export function captureError(_error: Error | AppError, _context?: Record<string, unknown>) {
  // No-op
}

export function captureMessage(
  _message: string,
  _level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  _context?: Record<string, unknown>
) {
  // No-op
}

export function setUserContext(_user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}) {
  // No-op
}

export function clearUserContext() {
  // No-op
}

export function addBreadcrumb(
  _message: string,
  _category?: string,
  _level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  _data?: Record<string, unknown>
) {
  // No-op
}

export async function withSentrySpan<T>(
  _name: string,
  _operation: string,
  callback: () => Promise<T>
): Promise<T> {
  return callback();
}

export function setTag(_key: string, _value: string) {
  // No-op
}

export function setContext(_key: string, _context: Record<string, unknown>) {
  // No-op
}

export function setLevel(_level: 'debug' | 'info' | 'warning' | 'error' | 'fatal') {
  // No-op
}

