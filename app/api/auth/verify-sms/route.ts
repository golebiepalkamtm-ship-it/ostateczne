import { handleApiError } from '@/lib/error-handling';
import { getAdminAuth } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { sessionInfo, code } = await req.json();

    if (!sessionInfo || !code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        {
          status: 400,
        }
      );
    }

    try {
      const auth = getAdminAuth();
      if (!auth) {
        return NextResponse.json(
          { error: 'Serwis tymczasowo niedostępny. Spróbuj ponownie później.' },
          { status: 503 }
        );
      }
      const result = await auth.verifySessionCookie(sessionInfo);
      return NextResponse.json({ success: true, uid: result.uid });
    } catch (error) {
      return handleApiError(error, req, { endpoint: 'auth/verify-sms', inner: true });
    }
  } catch (error) {
    return handleApiError(error, req, { endpoint: 'auth/verify-sms' });
  }
}
