import { handleApiError } from '@/lib/error-handling';
import { register } from '@/lib/prometheus-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const metrics = await register.metrics();
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'metrics' });
  }
}
