import { handleApiError } from '@/lib/error-handling';
import { getActiveUser } from '@/lib/firebase-auth-helpers';
import { prisma } from '@/lib/prisma';
import { checkProfileCompleteness, getProfileCompletenessMessage } from '@/lib/profile-validation';
import { apiRateLimit } from '@/lib/rate-limit';
import { bidCreateSchema } from '@/lib/validations/schemas';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// POST /api/auctions/[id]/bids - Dodaj licytację
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
        { status: 400 }
      );
    }

    const { id: auctionId } = await params;
    const body = await request.json();

    // Walidacja danych
    const validatedData = bidCreateSchema.parse(body);

    // Sprawdź czy aukcja istnieje i jest aktywna
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        seller: true,
        bids: {
          orderBy: { amount: 'desc' },
          take: 1,
        },
      },
    });

    if (!auction) {
      return NextResponse.json({ error: 'Aukcja nie została znaleziona' }, { status: 404 });
    }

    if (auction.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Aukcja nie jest aktywna' }, { status: 400 });
    }

    if (!auction.isApproved) {
      return NextResponse.json({ error: 'Aukcja nie została zatwierdzona' }, { status: 400 });
    }

    // Sprawdź czy użytkownik nie jest sprzedawcą
    if (authResult.userId === auction.sellerId) {
      return NextResponse.json({ error: 'Nie możesz licytować w swojej aukcji' }, { status: 400 });
    }

    // Sprawdź czy licytacja jest wyższa od aktualnej ceny
    const currentPrice = auction.bids.length > 0 ? auction.bids[0].amount : auction.startingPrice;
    if (validatedData.amount <= currentPrice) {
      return NextResponse.json(
        { error: `Licytacja musi być wyższa od ${currentPrice} zł` },
        { status: 400 }
      );
    }

    // Sprawdź czy licytacja nie przekracza ceny "kup teraz"
    if (auction.buyNowPrice && validatedData.amount >= auction.buyNowPrice) {
      return NextResponse.json(
        { error: 'Użyj opcji "Kup teraz" zamiast licytacji' },
        { status: 400 }
      );
    }

    // Sprawdź czy aukcja nie zakończyła się
    if (new Date() > auction.endTime) {
      return NextResponse.json({ error: 'Aukcja już się zakończyła' }, { status: 400 });
    }

    // Utwórz licytację w transakcji
    const result = await prisma.$transaction(async (tx: any) => {
      // Utwórz nową licytację
      const bid = await tx.bid.create({
        data: {
          auctionId: auctionId,
          bidderId: authResult.userId,
          amount: validatedData.amount,
        },
        include: {
          bidder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Zaktualizuj aktualną cenę aukcji
      await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentPrice: validatedData.amount,
        },
      });

      // Oznacz poprzednie licytacje jako nie-wygrywające
      await tx.bid.updateMany({
        where: {
          auctionId: auctionId,
          id: { not: bid.id },
        },
        data: {
          isWinning: false,
        },
      });

      // Oznacz nową licytację jako wygrywającą
      await tx.bid.update({
        where: { id: bid.id },
        data: {
          isWinning: true,
        },
      });

      return bid;
    });

    return NextResponse.json(
      {
        message: 'Licytacja została dodana',
        bid: result,
      },
      { status: 201 }
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
