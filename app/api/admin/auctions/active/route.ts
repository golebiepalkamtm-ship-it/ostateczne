import { handleApiError } from '@/lib/error-handling';
import { getAdminUser } from '@/lib/firebase-auth-helpers';
import { prisma } from '@/lib/prisma';
import { apiRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Sprawdź autoryzację - tylko admin
    const authResult = await getAdminUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Pobierz aktywne aukcje
    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where: {
          status: 'ACTIVE',
          isApproved: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          startingPrice: true,
          currentPrice: true,
          buyNowPrice: true,
          reservePrice: true,
          startTime: true,
          endTime: true,
          status: true,
          isApproved: true,
          createdAt: true,
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assets: {
            select: {
              id: true,
              type: true,
              url: true,
            },
          },
          bids: {
            select: {
              id: true,
              amount: true,
              createdAt: true,
              bidder: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: {
              amount: 'desc',
            },
            take: 1,
          },
        },
      }),
      prisma.auction.count({
        where: {
          status: 'ACTIVE',
          isApproved: true,
        },
      }),
    ]);

    return NextResponse.json({
      auctions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'admin/auctions/active' });
  }
}
