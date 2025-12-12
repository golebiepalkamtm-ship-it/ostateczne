import type { PrismaClient as PrismaClientType } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

// Environment-specific database URL
const getDatabaseUrl = () => {
  // Czytaj preferowane zmienne bez sztucznych fallbacków na SQLite –
  // provider w schemacie to PostgreSQL, więc brak URL oznacza brak DB.
  const urlFromEnv =
    process.env.DEV_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.PROD_DATABASE_URL ||
    process.env.TEST_DATABASE_URL ||
    '';

  return urlFromEnv.trim();
};

// Check if database is configured
export function isDatabaseConfigured(): boolean {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return false;

  // Odfiltruj placeholdery i błędne protokoły – lepiej zwrócić pustą listę
  // niż wysadzić endpoint 500.
  const lower = databaseUrl.toLowerCase();
  const isPlaceholder = lower.includes('placeholder');
  const isPostgresUrl = lower.startsWith('postgres://') || lower.startsWith('postgresql://');

  return !isPlaceholder && isPostgresUrl;
}

// Lazy initialization function to avoid Prisma initialization during build
const createPrismaClient = () => {
  const databaseUrl = getDatabaseUrl();

  // Wymuś bezpieczny typ silnika – nie używaj "client", który wymaga adaptera/accelerateUrl
  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE || process.env.PRISMA_CLIENT_ENGINE_TYPE.toLowerCase() === 'client') {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
  }

  // Brak skonfigurowanej bazy - pomijamy inicjalizację Prisma, pozwalamy na fallback danych
  if (!isDatabaseConfigured()) {
    return undefined;
  }

  // Załaduj PrismaClient dopiero po ustawieniu env
  const { PrismaClient } = require('@prisma/client') as { PrismaClient: new (...args: any[]) => PrismaClientType };

  try {
    return new PrismaClient({
      log: ['error'], // Wyciszone logi - tylko błędy
      errorFormat: 'pretty',
      // Disable query engine during build to avoid runtime issues
      ...(process.env.NODE_ENV === 'production' &&
        process.env.DOCKER_BUILD === 'true' && {
          log: [],
        }),
    });
  } catch (err) {
    console.warn('[Prisma] Nie udało się zainicjalizować klienta, przechodzę w tryb fallback (tylko statyczne dane).', err);
    return undefined;
  }
};

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production' && prisma) globalForPrisma.prisma = prisma;

// Database fallback utility function
export async function withDatabaseFallback<T>(
  dbOperation: () => Promise<T>,
  fallbackData: T,
  errorMessage?: string,
): Promise<T> {
  try {
    return await dbOperation();
  } catch (error) {
    console.warn(errorMessage || 'Database operation failed, using fallback data:', error);
    return fallbackData;
  }
}
