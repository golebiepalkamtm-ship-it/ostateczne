/**
 * Centralny API Client wrapper
 * Automatyczne dodawanie tokenów, type-safe endpoints, retry logic
 */

import { User } from 'firebase/auth';
import { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from '@/types';
import { parseApiResponse } from './api-response';

interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;
  private retryDelay: number;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || '';
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Pobiera token Firebase dla użytkownika
   */
  private async getAuthToken(user: User | null): Promise<string | null> {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Wykonuje request z retry logic
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retriesLeft: number = this.retries,
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Retry dla błędów sieciowych i 5xx
      if (!response.ok && retriesLeft > 0) {
        const status = response.status;
        if (status >= 500 || status === 429 || status === 408) {
          await this.delay(this.retryDelay * (this.retries - retriesLeft + 1));
          return this.fetchWithRetry(url, options, retriesLeft - 1);
        }
      }

      return response;
    } catch (error) {
      // Retry dla błędów sieciowych
      if (retriesLeft > 0 && (error instanceof TypeError || error instanceof DOMException)) {
        await this.delay(this.retryDelay * (this.retries - retriesLeft + 1));
        return this.fetchWithRetry(url, options, retriesLeft - 1);
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T = unknown>(
    endpoint: string,
    user: User | null = null,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const token = await this.getAuthToken(user);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await this.fetchWithRetry(`${this.baseUrl}${endpoint}`, {
      ...options,
      method: 'GET',
      headers,
    });

    return parseApiResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    endpoint: string,
    data: unknown,
    user: User | null = null,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const token = await this.getAuthToken(user);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await this.fetchWithRetry(`${this.baseUrl}${endpoint}`, {
      ...options,
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    return parseApiResponse<T>(response);
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    data: unknown,
    user: User | null = null,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const token = await this.getAuthToken(user);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await this.fetchWithRetry(`${this.baseUrl}${endpoint}`, {
      ...options,
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    return parseApiResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    endpoint: string,
    user: User | null = null,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const token = await this.getAuthToken(user);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await this.fetchWithRetry(`${this.baseUrl}${endpoint}`, {
      ...options,
      method: 'DELETE',
      headers,
    });

    return parseApiResponse<T>(response);
  }
}

// Singleton instance
export const apiClient = new ApiClient({
  baseUrl: '',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
});

// Type guards dla type-safe parsowania
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

export function isApiError(response: ApiResponse<unknown>): response is ApiErrorResponse {
  return response.success === false;
}

