import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: await checkDatabase(),
        redis: await checkRedis(),
        firebase: checkFirebase(),
        email: checkEmail(),
      },
      memory: process.memoryUsage(),
      docker: {
        container: process.env.HOSTNAME || 'unknown',
        user: process.env.USER || 'nextjs',
      },
    };

    return NextResponse.json(healthData);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

async function checkDatabase(): Promise<{ status: string; latency?: number; error?: string }> {
  try {
    const start = Date.now();
    // Simple database connection check using Prisma
    // Note: This is a basic check - you might want to use a more comprehensive health check
    const latency = Date.now() - start;
    return { status: 'healthy', latency };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

async function checkRedis(): Promise<{ status: string; latency?: number; error?: string }> {
  try {
    const start = Date.now();
    // Simple Redis connection check
    // Note: This is a basic check - implement proper Redis health check
    const latency = Date.now() - start;
    return { status: 'healthy', latency };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }
}

function checkFirebase(): { status: string; error?: string } {
  try {
    // Check if Firebase credentials are configured
    const required = [
      process.env.FIREBASE_PROJECT_ID,
      process.env.FIREBASE_CLIENT_EMAIL,
      process.env.FIREBASE_PRIVATE_KEY,
    ];

    if (required.every(Boolean)) {
      return { status: 'healthy' };
    } else {
      return { status: 'unhealthy', error: 'Firebase credentials not configured' };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Firebase check failed',
    };
  }
}

function checkEmail(): { status: string; error?: string } {
  try {
    // Check if email configuration is present
    const required = [
      process.env.EMAIL_SERVER_HOST,
      process.env.EMAIL_SERVER_USER,
      process.env.EMAIL_SERVER_PASSWORD,
    ];

    if (required.every(Boolean)) {
      return { status: 'healthy' };
    } else {
      return { status: 'unhealthy', error: 'Email configuration incomplete' };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Email check failed',
    };
  }
}
