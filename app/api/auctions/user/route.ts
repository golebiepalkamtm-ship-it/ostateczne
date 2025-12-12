import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { handleApiError } from '@/lib/error-handling';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFirebaseAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { decodedToken } = authResult;

    // Znajdź użytkownika w bazie Prisma po firebaseUid
    const user = await prisma.user.findFirst({
      where: { firebaseUid: decodedToken.uid },
    });

    if (!user) {
      return NextResponse.json({ error: 'Użytkownik nie znaleziony' }, { status: 404 });
    }

    // Pobierz aukcje użytkownika
    // 1. Moje aukcje (wszystkie statusy)
    const myAuctions = await prisma.auction.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { bids: true, watchlist: true },
        },
      },
    });

    // 2. Aukcje obserwowane
    const watchedAuctions = await prisma.auction.findMany({
      where: {
        watchlist: {
          some: { userId: user.id },
        },
      },
      orderBy: { endTime: 'asc' },
    });

    // 3. Moje licytacje (aukcje, w których brałem udział)
    const myBids = await prisma.bid.findMany({
      where: { bidderId: user.id },
      include: {
        auction: true,
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['auctionId'], // Jedna licytacja na aukcję
    });

    // 4. Aukcje zakończone (moje)
    const endedAuctions = myAuctions.filter(
      a => a.status === 'ENDED' || new Date(a.endTime) < new Date(),
    );

    // 5. Aukcje sprzedane (moje, które mają licytacje lub kup teraz)
    // Zakładamy, że sprzedana = zakończona i ma wygrywającą ofertę (to uproszczenie)
    const soldAuctions = await prisma.auction.findMany({
      where: {
        sellerId: user.id,
        status: 'ENDED',
        bids: {
          some: { isWinning: true },
        },
      },
    });

    return NextResponse.json({
      myAuctions,
      watchedAuctions,
      myBids: myBids.map(bid => ({
        ...bid,
        isWinning: bid.isWinning, // Czy ta konkretna oferta wygrywa? (to może być mylące przy distinct)
        // Lepiej byłoby sprawdzić status aukcji i czy JA wygrałem
      })),
      endedAuctions,
      soldAuctions,
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auctions/user', method: 'GET' });
  }
}

