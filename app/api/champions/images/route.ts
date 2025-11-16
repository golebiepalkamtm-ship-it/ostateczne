import { handleApiError } from '@/lib/error-handling';
import { apiRateLimit } from '@/lib/rate-limit';
import { scanChampionFolders } from '@/utils/getChampionImages';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Walidacja parametrów zapytania
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const search = searchParams.get('search')?.trim();

    // Buduj warunki filtrowania
    const where: {
      isChampion: boolean;
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        ringNumber?: { contains: string; mode: 'insensitive' };
        bloodline?: { contains: string; mode: 'insensitive' };
      }>;
    } = {
      isChampion: true, // Tylko championy
    };

    if (search && search.length > 0) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { ringNumber: { contains: search, mode: 'insensitive' } },
        { bloodline: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Skanuj foldery championów w public/champions/
    const folderChampions = await scanChampionFolders();

    // Zastosuj paginację do folderów
    const paginatedChampions = folderChampions.slice(offset, offset + limit);
    const total = folderChampions.length;

    // Zwracaj pełne dane championów
    const transformedChampions = paginatedChampions.map(champion => ({
      id: champion.id,
      name: champion.name,
      ringNumber: champion.ringNumber,
      bloodline: champion.bloodline,
      // Konwertuj images z obiektów { url, alt } na stringi (url)
      images: Array.isArray(champion.images)
        ? champion.images.map((img: { url?: string; alt?: string } | string) =>
            typeof img === 'string' ? img : img?.url || ''
          )
        : [],
      // Zwróć pedigree bez zmian (już zawiera images jako tablicę stringów)
      pedigree: champion.pedigree,
    }));

    return NextResponse.json({
      champions: transformedChampions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'champions/images' });
  }
}
