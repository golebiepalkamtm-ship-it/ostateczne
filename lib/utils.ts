/**
 * Utility functions for the application
 * PROD-READY: TypeScript Strict Mode, full type safety
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 * Combines clsx and tailwind-merge for optimal className handling
 * 
 * @example
 * ```ts
 * cn('px-4 py-2', isActive && 'bg-blue-500', 'hover:bg-blue-600')
 * // Returns: 'px-4 py-2 bg-blue-500 hover:bg-blue-600' (if isActive is true)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency to Polish zloty
 * @param amount - Amount in smallest currency unit (grosze)
 * @param locale - Locale string (default: 'pl-PL')
 */
export function formatCurrency(amount: number, locale = 'pl-PL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'PLN',
  }).format(amount / 100);
}

/**
 * Format date to Polish locale
 * @param date - Date object or ISO string
 * @param options - Intl.DateTimeFormat options
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pl-PL', options).format(dateObj);
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param date - Date object or ISO string
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) return 'przed chwilą';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minutę' : 'minut'} temu`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'godzinę' : 'godzin'} temu`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days} ${days === 1 ? 'dzień' : 'dni'} temu`;
}

/**
 * Debounce function - delays execution until after wait time
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function - limits execution to once per wait time
 * @param func - Function to throttle
 * @param wait - Wait time in milliseconds
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
    }
  };
}

/**
 * Sleep function - async delay
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncate string with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length before truncation
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Generate random ID
 * @param length - Length of the ID (default: 8)
 */
export function generateId(length = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Check if code is running on client side
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Check if code is running on server side
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Safe JSON parse with fallback
 * @param str - JSON string to parse
 * @param fallback - Fallback value if parse fails
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}
