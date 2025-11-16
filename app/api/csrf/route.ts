import { handleApiError } from '@/lib/error-handling';
import { generateCSRFToken, setCSRFCookie } from '@/lib/csrf';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = generateCSRFToken();
    const response = NextResponse.json({ csrfToken: token });

    await setCSRFCookie(response, token);

    return response;
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'csrf' });
  }
}
