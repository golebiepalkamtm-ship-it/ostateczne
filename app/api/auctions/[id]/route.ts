import { handleApiError } from '@/lib/error-handling';
import { getActiveUser } from '@/lib/firebase-auth-helpers';
import { prisma } from '@/lib/prisma';
import { apiRateLimit } from '@/lib/rate-limit';
import { auctionUpdateSchema } from '@/lib/validations/schemas';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/auctions/[id] - Pobierz szczegóły aukcji
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { id: auctionId } = await params;

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            image: true,
          },
        },
        pigeon: {
          select: {
            id: true,
            name: true,
            ringNumber: true,
            bloodline: true,
            birthDate: true,
            color: true,
            weight: true,
            breeder: true,
            description: true,
            pedigree: true,
            achievements: true,
            gender: true,
          },
        },
        assets: {
          orderBy: { createdAt: 'asc' },
        },
        bids: {
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
        },
        _count: {
          select: {
            bids: true,
            watchlist: true,
          },
        },
      },
    });

    if (!auction) {
      return NextResponse.json({ error: 'Aukcja nie została znaleziona' }, { status: 404 });
    }

    // Sprawdź czy aukcja jest zatwierdzona lub użytkownik jest sprzedawcą/adminem
    let authResult: { userId: string; user: { role: string } } | null = null;
    if (!auction.isApproved) {
      // Tylko sprawdź autoryzację jeśli aukcja nie jest zatwierdzona
      const authCheck = await getActiveUser(request);
      if (authCheck instanceof NextResponse) {
        return authCheck;
      }
      authResult = authCheck;
      if (authResult.userId !== auction.sellerId && authResult.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Aukcja nie jest dostępna' }, { status: 403 });
      }
    }

    return NextResponse.json({
      ...auction,
      age: 0, // Domyślny wiek
      location: 'Brak lokalizacji', // Domyślna lokalizacja
      sex: auction.pigeon?.gender || 'male', // Mapowanie gender -> sex
      bloodline: auction.pigeon?.bloodline || '', // Mapowanie bloodline
      category: auction.category, // Mapowanie category
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auctions/[id]', method: 'GET' });
  }
}

// PUT /api/auctions/[id] - Aktualizuj aukcję
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
    const validatedData = auctionUpdateSchema.parse(body);

    // Sprawdź czy aukcja istnieje
    const existingAuction = await prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!existingAuction) {
      return NextResponse.json({ error: 'Aukcja nie została znaleziona' }, { status: 404 });
    }

    // Sprawdź uprawnienia
    if (authResult.userId !== existingAuction.sellerId && authResult.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Brak uprawnień do edycji tej aukcji' }, { status: 403 });
    }

    // Sprawdź czy aukcja może być edytowana
    if (existingAuction.status === 'ENDED') {
      return NextResponse.json({ error: 'Nie można edytować zakończonej aukcji' }, { status: 400 });
    }

    // Przygotuj dane do aktualizacji
    const updateData: {
      title?: string;
      description?: string;
      category?: string;
      startingPrice?: number;
      reservePrice?: number;
      images?: string[];
      videos?: string[];
      documents?: string[];
      startTime?: Date;
      endTime?: Date;
      updatedAt: Date;
    } = {
      title: validatedData.title,
      description: validatedData.description,
      category: validatedData.category,
      startingPrice: validatedData.startingPrice,
      reservePrice: validatedData.reservePrice,
      images: validatedData.images,
      videos: validatedData.videos,
      documents: validatedData.documents,
      updatedAt: new Date(),
    };

    // Dodaj daty tylko jeśli są podane
    if (validatedData.startTime) {
      updateData.startTime = new Date(validatedData.startTime);
    }
    if (validatedData.endTime) {
      updateData.endTime = new Date(validatedData.endTime);
    }

    // Aktualizuj aukcję
    const updatedAuction = await prisma.auction.update({
      where: { id: auctionId },
      data: updateData,
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            image: true,
          },
        },
        assets: true,
      },
    });

    // Aktualizuj zasoby jeśli podano
    if (validatedData.images) {
      // Usuń stare obrazy
      await prisma.auctionAsset.deleteMany({
        where: {
          auctionId: auctionId,
          type: 'IMAGE',
        },
      });

      // Dodaj nowe obrazy
      if (validatedData.images.length > 0) {
        await prisma.auctionAsset.createMany({
          data: validatedData.images.map(url => ({
            auctionId: auctionId,
            type: 'IMAGE',
            url,
          })),
        });
      }
    }

    return NextResponse.json({
      message: 'Aukcja została zaktualizowana',
      auction: updatedAuction,
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auctions/[id]', method: 'PATCH' });
  }
}

// DELETE /api/auctions/[id] - Usuń aukcję
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    // Sprawdź czy aukcja istnieje
    const existingAuction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: true,
      },
    });

    if (!existingAuction) {
      return NextResponse.json({ error: 'Aukcja nie została znaleziona' }, { status: 404 });
    }

    // Sprawdź uprawnienia
    if (authResult.userId !== existingAuction.sellerId && authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Brak uprawnień do usunięcia tej aukcji' },
        { status: 403 },
      );
    }

    // Sprawdź czy aukcja może być usunięta
    if (existingAuction.status === 'ACTIVE' && existingAuction.bids.length > 0) {
      return NextResponse.json(
        { error: 'Nie można usunąć aukcji z aktywnymi licytacjami' },
        { status: 400 },
      );
    }

    // Usuń aukcję (kaskadowe usuwanie zasobów i licytacji)
    await prisma.auction.delete({
      where: { id: auctionId },
    });

    return NextResponse.json({
      message: 'Aukcja została usunięta',
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auctions/[id]', method: 'DELETE' });
  }
}
