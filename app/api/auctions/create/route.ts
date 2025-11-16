import { handleApiError } from '@/lib/error-handling';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { apiRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const approveSchema = z.object({
  auctionId: z.string().cuid('Nieprawidłowe ID aukcji'),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Sprawdź autoryzację admina
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { auctionId } = approveSchema.parse(body);

    const updatedAuction = await prisma.auction.update({
      where: {
        id: auctionId,
        isApproved: false, // Upewnij się, że nie zatwierdzamy już zatwierdzonej
      },
      data: {
        isApproved: true,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, auction: updatedAuction });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auctions/create' });
  }
}
