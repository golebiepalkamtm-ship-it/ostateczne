import { handleApiError } from '@/lib/error-handling';
import { getActiveUser } from '@/lib/firebase-auth-helpers';
import { finalizeAuction } from '@/lib/auction-service';
import { prisma } from '@/lib/prisma';
import { apiRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/auctions/[id]/finalize - Zakończ aukcję
 * 
 * Sprawdza czy reserve price została osiągnięta i finalizuje aukcję:
 * - Jeśli reserve price osiągnięta: tworzy transakcję, wysyła powiadomienia
 * - Jeśli reserve price nie osiągnięta: aukcja kończy się bez sprzedaży
 * 
 * Wymaga uprawnień: właściciel aukcji lub admin
 * Może być wywołane automatycznie przez cron job
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { id: auctionId } = await params;

    // Sprawdź autoryzację
    const authResult = await getActiveUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Sprawdź czy aukcja istnieje
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        sellerId: true,
        status: true,
        endTime: true,
      },
    });

    if (!auction) {
      return NextResponse.json(
        { error: 'Aukcja nie została znaleziona' },
        { status: 404 },
      );
    }

    // Sprawdź uprawnienia (tylko właściciel lub admin może zakończyć wcześniej)
    const isOwner = authResult.userId === auction.sellerId;
    const isAdmin = authResult.user.role === 'ADMIN';
    const hasEnded = new Date() > auction.endTime;

    if (!isOwner && !isAdmin && !hasEnded) {
      return NextResponse.json(
        { error: 'Brak uprawnień do zakończenia tej aukcji' },
        { status: 403 },
      );
    }

    if (auction.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Aukcja nie jest aktywna' },
        { status: 400 },
      );
    }

    // Finalizuj aukcję
    const result = await finalizeAuction(auctionId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        winnerId: result.winnerId,
        finalPrice: result.finalPrice,
        reserveMet: result.reserveMet,
      },
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auctions/[id]/finalize', method: 'POST' });
  }
}