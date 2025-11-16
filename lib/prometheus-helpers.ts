import client from 'prom-client';

// Registry dla wszystkich metryk
export const register = new client.Registry();

// Zbieraj domyślne metryki systemowe (CPU, pamięć, etc.)
// W Next.js API routes może być problem z dostępem do metryk systemowych, więc opakowujemy w try-catch
try {
  client.collectDefaultMetrics({ register });
} catch (error) {
  // W środowisku Next.js niektóre metryki systemowe mogą nie być dostępne
  // Ignorujemy błąd i kontynuujemy z metrykami aplikacji
  if (process.env.NODE_ENV === 'development') {
    console.warn('Warning: Could not collect default metrics:', error);
  }
}

// ========== HTTP REQUEST METRICS ==========

// Counter dla liczby requestów
export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Histogram dla czasu odpowiedzi
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register],
});

// Counter dla błędów
export const httpRequestErrors = new client.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'error_type'],
  registers: [register],
});

// ========== BUSINESS METRICS ==========

// Counter dla stworzonych aukcji
export const auctionsCreated = new client.Counter({
  name: 'auctions_created_total',
  help: 'Total number of auctions created',
  labelNames: ['user_id'],
  registers: [register],
});

// Counter dla złożonych bidów
export const bidsPlaced = new client.Counter({
  name: 'bids_placed_total',
  help: 'Total number of bids placed',
  labelNames: ['auction_id', 'user_id'],
  registers: [register],
});

// Gauge dla aktywnych aukcji
export const activeAuctions = new client.Gauge({
  name: 'auctions_active',
  help: 'Current number of active auctions',
  registers: [register],
});

// Gauge dla aktywnych użytkowników online
export const activeUsers = new client.Gauge({
  name: 'users_active',
  help: 'Current number of active users',
  registers: [register],
});

// Histogram dla wartości bidów
export const bidAmount = new client.Histogram({
  name: 'bid_amount_pln',
  help: 'Bid amounts in PLN',
  labelNames: ['auction_id'],
  buckets: [10, 50, 100, 500, 1000, 5000, 10000, 50000],
  registers: [register],
});

// Counter dla zarejestrowanych użytkowników
export const usersRegistered = new client.Counter({
  name: 'users_registered_total',
  help: 'Total number of user registrations',
  labelNames: ['registration_method'],
  registers: [register],
});

// Counter dla wiadomości
export const messagesSent = new client.Counter({
  name: 'messages_sent_total',
  help: 'Total number of messages sent',
  labelNames: ['conversation_id'],
  registers: [register],
});

// ========== DATABASE METRICS ==========

// Histogram dla czasu zapytań do bazy
export const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Counter dla błędów bazy danych
export const databaseErrors = new client.Counter({
  name: 'database_errors_total',
  help: 'Total number of database errors',
  labelNames: ['operation', 'error_code'],
  registers: [register],
});

// ========== EXTERNAL SERVICES METRICS ==========

// Histogram dla requestów do Firebase
export const firebaseRequestDuration = new client.Histogram({
  name: 'firebase_request_duration_seconds',
  help: 'Duration of Firebase requests in seconds',
  labelNames: ['operation'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Counter dla błędów Firebase
export const firebaseErrors = new client.Counter({
  name: 'firebase_errors_total',
  help: 'Total number of Firebase errors',
  labelNames: ['operation', 'error_code'],
  registers: [register],
});

// Histogram dla requestów SMS
export const smsRequestDuration = new client.Histogram({
  name: 'sms_request_duration_seconds',
  help: 'Duration of SMS sending in seconds',
  buckets: [1, 2, 5, 10, 30],
  registers: [register],
});

// Counter dla wysłanych SMS
export const smsSent = new client.Counter({
  name: 'sms_sent_total',
  help: 'Total number of SMS sent',
  labelNames: ['status'],
  registers: [register],
});

// ========== HELPER FUNCTIONS ==========

/**
 * Track HTTP request
 */
export function trackHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  duration: number
) {
  const labels = { method, route, status_code: statusCode.toString() };

  httpRequestTotal.inc(labels);
  httpRequestDuration.observe(labels, duration / 1000); // convert ms to seconds

  if (statusCode >= 400) {
    httpRequestErrors.inc({
      method,
      route,
      error_type: statusCode >= 500 ? 'server_error' : 'client_error',
    });
  }
}

/**
 * Track database query
 */
export function trackDatabaseQuery(operation: string, table: string, duration: number) {
  databaseQueryDuration.observe({ operation, table }, duration / 1000);
}

/**
 * Track database error
 */
export function trackDatabaseError(operation: string, errorCode: string) {
  databaseErrors.inc({ operation, error_code: errorCode });
}

/**
 * Track Firebase operation
 */
export function trackFirebaseOperation(operation: string, duration: number) {
  firebaseRequestDuration.observe({ operation }, duration / 1000);
}

/**
 * Track Firebase error
 */
export function trackFirebaseError(operation: string, errorCode: string) {
  firebaseErrors.inc({ operation, error_code: errorCode });
}

/**
 * Track auction creation
 */
export function trackAuctionCreated(userId?: string) {
  auctionsCreated.inc({ user_id: userId || 'unknown' });
  activeAuctions.inc();
}

/**
 * Track auction end
 */
export function trackAuctionEnded() {
  activeAuctions.dec();
}

/**
 * Track bid placement
 */
export function trackBidPlaced(auctionId: string, userId: string, amount: number) {
  bidsPlaced.inc({ auction_id: auctionId, user_id: userId });
  bidAmount.observe({ auction_id: auctionId }, amount);
}

/**
 * Track user registration
 */
export function trackUserRegistered(method: 'phone' | 'email' | 'google' = 'phone') {
  usersRegistered.inc({ registration_method: method });
  activeUsers.inc();
}

/**
 * Track user login
 */
export function trackUserLogin() {
  activeUsers.inc();
}

/**
 * Track user logout
 */
export function trackUserLogout() {
  activeUsers.dec();
}

/**
 * Track message sent
 */
export function trackMessageSent(conversationId: string) {
  messagesSent.inc({ conversation_id: conversationId });
}

/**
 * Track SMS sent
 */
export function trackSMSSent(status: 'success' | 'error') {
  smsSent.inc({ status });
}

/**
 * Track SMS sending duration
 */
export function trackSMSSending(duration: number) {
  smsRequestDuration.observe(duration / 1000);
}
