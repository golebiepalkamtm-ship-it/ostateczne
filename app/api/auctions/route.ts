import { createApiRoute } from '@/lib/api-middleware';
import { AppErrors, handleApiError } from '@/lib/error-handling';
// TODO: Jeśli potrzebujesz eventów, użyj logger.info lub debug
import { error as loggerError } from '@/lib/logger';
import {
  auctionQueries,
  createAuctionFilters,
  createAuctionSorting,
  createPagination,
} from '@/lib/optimized-queries';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { NextRequest, NextResponse } from 'next/server';

async function getAuctionsHandler(request: NextRequest) {
  try {
    // Pobierz parametry z URL
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const sortByParam = url.searchParams.get('sortBy') || 'newest';

    // Mapowanie parametru sortowania na format obsługiwany przez createAuctionSorting
    const sortByMap: Record<string, string> = {
      newest: 'newest',
      oldest: 'oldest',
      endingSoon: 'ending-soon',
      endingLatest: 'ending-latest',
      priceAsc: 'price-low',
      priceDesc: 'price-high',
      priceLow: 'price-low',
      priceHigh: 'price-high',
      title: 'title',
    };

    const sortBy = sortByMap[sortByParam] || 'newest';

    // Walidacja parametrów
    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1 || limit > 100) {
      throw AppErrors.validation('Nieprawidłowe parametry paginacji');
    }

    // Utwórz filtry i sortowanie
    const where = createAuctionFilters({
      category: category || undefined,
      status: status || undefined,
      search: search || undefined,
      isApproved: true,
    });
    const orderBy = createAuctionSorting(sortBy);
    const { skip, take } = createPagination(page, limit);

    // Wykonaj zapytania równolegle
    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        ...auctionQueries.withBasicRelations,
        orderBy,
        skip,
        take,
      }),
      prisma.auction.count({ where }),
    ]);

    return NextResponse.json({
      auctions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auctions', method: 'GET' });
  }
}

async function createAuctionHandler(request: NextRequest) {
  const body = await request.json();
  console.log('Received body:', body); // Dodaj to dla debugowania

  // Autoryzacja Firebase
  const authResult = await requireFirebaseAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { decodedToken } = authResult;

  // Pobierz użytkownika z bazy po firebaseUid
  const dbUser = await prisma.user.findFirst({
    where: { firebaseUid: decodedToken.uid },
    select: {
      id: true,
      role: true,
      isPhoneVerified: true,
      isProfileVerified: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!dbUser) {
    loggerError('Użytkownik nie znaleziony w bazie', { uid: decodedToken.uid });
    return NextResponse.json({ error: 'Użytkownik nie znaleziony' }, { status: 403 });
  }

  // Sprawdź pełną weryfikację (Level 3)
  const isFullyVerified = dbUser.isProfileVerified && dbUser.isPhoneVerified;
  if (!isFullyVerified && dbUser.role !== 'ADMIN') {
    loggerError('Brak uprawnień do tworzenia aukcji', {
      uid: decodedToken.uid,
      role: dbUser.role,
      isProfileVerified: dbUser.isProfileVerified,
      isPhoneVerified: dbUser.isPhoneVerified,
    });
    return NextResponse.json({ error: 'Brak uprawnień do tworzenia aukcji' }, { status: 403 });
  }

  // Walidacja danych
  // Użyj baseAuctionSchema który zawiera startTime i endTime
  const baseAuctionSchema = z
    .object({
      title: z
        .string()
        .min(5, 'Tytuł musi mieć co najmniej 5 znaków')
        .max(200, 'Tytuł może mieć maksymalnie 200 znaków'),
      description: z
        .string()
        .min(20, 'Opis musi mieć co najmniej 20 znaków')
        .max(2000, 'Opis może mieć maksymalnie 2000 znaków'),
      category: z.string().min(1, 'Kategoria jest wymagana'),
      startingPrice: z.number().min(0, 'Cena startowa nie może być ujemna').optional(),
      buyNowPrice: z.number().min(0, 'Cena kup teraz nie może być ujemna').optional(),
      reservePrice: z.number().min(0, 'Cena rezerwowa nie może być ujemna').optional(),
      startTime: z.string().datetime('Nieprawidłowa data rozpoczęcia'),
      endTime: z.string().datetime('Nieprawidłowa data zakończenia'),
      images: z.array(z.string().min(1, 'URL obrazu nie może być pusty')).optional(),
      videos: z.array(z.string().min(1, 'URL wideo nie może być pusty')).optional(),
      documents: z.array(z.string().min(1, 'URL dokumentu nie może być pusty')).optional(),
      location: z.string().optional(),
      locationData: z.any().optional(),
      pigeon: z
        .object({
          ringNumber: z.string().min(1, 'Numer obrączki jest wymagany dla gołębia'),
          bloodline: z.string().min(1, 'Linia krwi jest wymagana dla gołębia'),
          sex: z.enum(['male', 'female'], { message: 'Płeć jest wymagana dla gołębia' }),
          eyeColor: z.string().optional(),
          featherColor: z.string().optional(),
          purpose: z.array(z.string()).optional(),
        })
        .optional(),
      csrfToken: z.string().min(1, 'Token CSRF jest wymagany'),
    })
    .refine(
      data => {
        if (data.buyNowPrice && data.startingPrice) {
          return data.buyNowPrice >= data.startingPrice;
        }
        return true;
      },
      {
        message: 'Cena kup teraz musi być większa lub równa cenie startowej',
        path: ['buyNowPrice'],
      }
    )
    .refine(
      data => {
        if (data.category === 'Pigeon') {
          return data.pigeon && data.pigeon.ringNumber && data.pigeon.bloodline && data.pigeon.sex;
        }
        return true;
      },
      {
        message: 'Dla aukcji gołębia wymagane są: numer obrączki, linia krwi i płeć',
        path: ['pigeon'],
      }
    );

  let validatedData;
  try {
    validatedData = baseAuctionSchema.parse(body);
  } catch (err) {
    return handleApiError(err, request, { endpoint: 'auctions/create', body });
  }

  // Sprawdź daty
  const startTime = new Date(validatedData.startTime);
  const endTime = new Date(validatedData.endTime);
  const now = new Date();

  // Akceptuj daty z niewielkim marginesem (5 sekund wstecz) by uwzględnić opóźnienie sieci
  const marginTime = new Date(now.getTime() - 5000);

  if (startTime < marginTime) {
    throw AppErrors.validation('Data rozpoczęcia nie może być w przeszłości');
  }

  if (endTime <= startTime) {
    throw AppErrors.validation('Data zakończenia musi być po dacie rozpoczęcia');
  }

  // Utwórz aukcję w transakcji
  const result = await prisma.$transaction(async tx => {
    let pigeonId: string | undefined;

    // Jeśli to aukcja gołębia, utwórz rekord gołębia najpierw
    if (validatedData.category === 'Pigeon' && validatedData.pigeon) {
      const pigeon = await tx.pigeon.create({
        data: {
          name: `${validatedData.pigeon.bloodline} ${validatedData.pigeon.ringNumber}`,
          ringNumber: validatedData.pigeon.ringNumber,
          bloodline: validatedData.pigeon.bloodline,
          gender: validatedData.pigeon.sex,
          birthDate: new Date(),
          color: validatedData.pigeon.featherColor || validatedData.pigeon.eyeColor || 'Unknown',
          weight: 0.5, // Default weight
          breeder: dbUser.firstName
            ? `${dbUser.firstName} ${dbUser.lastName || ''}`.trim()
            : 'Unknown',
          description: `Gołąb rasy ${validatedData.pigeon.bloodline}`,
          images: validatedData.images?.join(',') || '',
          videos: validatedData.videos?.join(',') || '',
          isChampion: false,
        },
      });
      pigeonId = pigeon.id;
    }

    // Utwórz aukcję
    const auction = await tx.auction.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        pigeonId: pigeonId,
        sellerId: dbUser.id,
        startingPrice: validatedData.startingPrice || 0,
        currentPrice: validatedData.startingPrice || 0,
        buyNowPrice: validatedData.buyNowPrice,
        reservePrice: validatedData.reservePrice,
        startTime: startTime,
        endTime: endTime,
        status: 'ACTIVE', // Aukcje są od razu aktywne
        isApproved: true, // Auto-zatwierdzenie aukcji
      },
    });

    // Utwórz assety dla aukcji
    const assets = [];
    if (validatedData.images) {
      assets.push(
        ...validatedData.images.map(url => ({
          auctionId: auction.id,
          type: 'IMAGE' as const,
          url,
        }))
      );
    }
    if (validatedData.videos) {
      assets.push(
        ...validatedData.videos.map(url => ({
          auctionId: auction.id,
          type: 'VIDEO' as const,
          url,
        }))
      );
    }
    if (validatedData.documents) {
      assets.push(
        ...validatedData.documents.map(url => ({
          auctionId: auction.id,
          type: 'DOCUMENT' as const,
          url,
        }))
      );
    }

    if (assets.length > 0) {
      await tx.auctionAsset.createMany({
        data: assets,
      });
    }

    return auction;
  });

  // TODO: Add Prometheus metric for auction_create
  loggerError('Aukcja utworzona pomyślnie', { auctionId: result.id, sellerId: dbUser.id });

  return NextResponse.json({
    success: true,
    message: 'Aukcja została utworzona i oczekuje na zatwierdzenie',
    auctionId: result.id,
  });
}

export const GET = createApiRoute(getAuctionsHandler, 'read');
export const POST = createApiRoute(createAuctionHandler, 'create');
