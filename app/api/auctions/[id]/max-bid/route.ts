import { handleApiError } from '@/lib/error-handling';
import { getActiveUser } from '@/lib/firebase-auth-helpers';
import { updateMaxBid } from '@/lib/auction-service';
import { apiRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const maxBidSchema = z.object({
  maxBid: z.number().min(1, 'Maksymalna kwota musi być większa od 0'),
});

/**
 * PUT /api/auctions/[id]/max-bid - Aktualizuj maksymalną kwotę auto-licytacji
 * 
 * Pozwala użytkownikowi ustawić maksymalną kwotę, do której system
 * będzie automatycznie podbijał za niego.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Sprawdź autoryzację
    const authResult = await getActiveUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id: auctionId } = await params;
    const body = await request.json();

    // Walidacja danych
    const validatedData = maxBidSchema.parse(body);

    // Aktualizuj max bid
    const result = await updateMaxBid(
      auctionId,
      authResult.userId,
      validatedData.maxBid,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auctions/[id]/max-bid', method: 'PUT' });
  }
}

/**
 * GET /api/auctions/[id]/max-bid - Pobierz aktualną maksymalną kwotę użytkownika
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Sprawdź autoryzację
    const authResult = await getActiveUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id: auctionId } = await params;

    // Pobierz ostatni bid użytkownika z maxBid
    const { prisma } = await import('@/lib/prisma');
    const lastBid = await prisma.bid.findFirst({
      where: { 
        auctionId, 
        bidderId: authResult.userId,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        amount: true,
        // maxBid: true, // Po migracji odkomentować
        isWinning: true,
      },
    });

    if (!lastBid) {
      return NextResponse.json({
        hasMaxBid: false,
        maxBid: null,
        currentBid: null,
        isWinning: false,
      });
    }

    return NextResponse.json({
      hasMaxBid: false, // Po migracji: !!lastBid.maxBid
      maxBid: null, // Po migracji: lastBid.maxBid
      currentBid: lastBid.amount,
      isWinning: lastBid.isWinning,
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auctions/[id]/max-bid', method: 'GET' });
  }
}