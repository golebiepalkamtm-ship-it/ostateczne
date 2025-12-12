import { handleApiError } from '@/lib/error-handling';
import { getActiveUser } from '@/lib/firebase-auth-helpers';
import { prisma } from '@/lib/prisma';
import { checkProfileCompleteness, getProfileCompletenessMessage } from '@/lib/profile-validation';
import { apiRateLimit } from '@/lib/rate-limit';
import { createBidWithFeatures } from '@/lib/auction-service';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Schema walidacji z rozszerzeniem o maxBid
const bidRequestSchema = z.object({
  amount: z.number().min(0, 'Kwota licytacji nie może być ujemna'),
  maxBid: z.number().min(0, 'Maksymalna kwota nie może być ujemna').optional(),
});

// POST /api/auctions/[id]/bids - Dodaj licytację
// Funkcjonalności:
// - Snipe Protection: automatyczne przedłużanie aukcji przy licytacji w ostatnich minutach
// - Auto-outbid: automatyczne podbijanie do maksymalnej kwoty (jeśli podano maxBid)
// - Powiadomienia: automatyczne powiadomienia o przebiciu
// - Reserve Price: walidacja ceny minimalnej
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Sprawdź autoryzację Firebase
    const authResult = await getActiveUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Sprawdź kompletność profilu
    const profileCompleteness = await checkProfileCompleteness(authResult.userId);
    if (!profileCompleteness.isComplete) {
      return NextResponse.json(
        {
          error: 'Profil użytkownika jest niekompletny',
          message: getProfileCompletenessMessage(profileCompleteness),
          missingFields: profileCompleteness.missingFields,
        },
        { status: 400 },
      );
    }

    const { id: auctionId } = await params;
    const body = await request.json();

    // Walidacja danych
    const validatedData = bidRequestSchema.parse(body);

    // Użyj zaawansowanego serwisu aukcyjnego
    const result = await createBidWithFeatures({
      auctionId,
      bidderId: authResult.userId,
      amount: validatedData.amount,
      maxBid: validatedData.maxBid,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: result.message,
        bid: result.bid,
        auction: {
          id: result.auction?.id,
          currentPrice: result.auction?.currentPrice,
          endTime: result.auction?.endTime,
        },
        meta: {
          wasExtended: result.wasExtended,
          newEndTime: result.newEndTime,
          autoBidTriggered: result.autoBidTriggered,
          outbidNotificationsSent: result.outbidNotificationsSent,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auctions/[id]/bids', method: 'POST' });
  }
}

// GET /api/auctions/[id]/bids - Pobierz licytacje aukcji
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { id: auctionId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    // Sprawdź czy aukcja istnieje
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      return NextResponse.json({ error: 'Aukcja nie została znaleziona' }, { status: 404 });
    }

    // Pobierz licytacje
    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where: { auctionId },
        include: {
          bidder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bid.count({ where: { auctionId } }),
    ]);

    return NextResponse.json({
      bids,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auctions/[id]/bids', method: 'GET' });
  }
}
