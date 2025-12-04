import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import type { NextApiResponse } from 'next';

export type AuthzResult =
  | { ok: true; user: { id: string; email: string; role: string; isProfileVerified: boolean; isPhoneVerified: boolean } }
  | { ok: false; status: number; error: string };

export async function authorizeApiRequest(requiredLevel: 'level2-ok' | 'level3-ok', requiredRole?: 'admin'): Promise<AuthzResult> {
  try {
    const session = await getServerSession();
    if (!session || !session.user || !session.user.email) {
      return { ok: false, status: 401, error: 'Unauthorized: Missing token/session.' };
    }

    const user = await prisma.user.findFirst({
      where: { email: session.user.email },
      select: { id: true, email: true, role: true, isProfileVerified: true, isPhoneVerified: true },
    });

    if (!user) return { ok: false, status: 404, error: 'User not found.' };
    if (requiredRole === 'admin' && user.role !== 'admin') return { ok: false, status: 403, error: 'Forbidden: Admin role required.' };
    if (requiredLevel === 'level2-ok' && !user.isProfileVerified) return { ok: false, status: 403, error: 'Forbidden: Profile verification required.' };
    if (requiredLevel === 'level3-ok' && (!user.isProfileVerified || !user.isPhoneVerified)) return { ok: false, status: 403, error: 'Forbidden: Phone/Profile verification required.' };

    return { ok: true, user };
  } catch (e) {
    return { ok: false, status: 500, error: `AuthZ guard error: ${(e as Error).message}` };
  }
}

// Helper to send standardized JSON errors from API routes
export function sendAuthzError(res: NextApiResponse, result: AuthzResult) {
  if (result.ok) return;
  res.status(result.status).json({ error: result.error, code: 'AUTHZ_GUARD', status: result.status });
}
