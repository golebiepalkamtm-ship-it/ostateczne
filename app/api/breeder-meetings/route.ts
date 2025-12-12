import { handleApiError } from '@/lib/error-handling';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { requirePhoneVerification } from '@/lib/phone-verification';
import { prisma, withDatabaseFallback } from '@/lib/prisma';
import { apiRateLimit } from '@/lib/rate-limit';
import { convertPublicPathToStorageUrl } from '@/lib/firebase-storage';
import { getAdminApp } from '@/lib/firebase-admin';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Sprawdź autoryzację Firebase
    const authResult = await requireFirebaseAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { decodedToken } = authResult;

    // Sprawdź czy użytkownik ma zweryfikowany telefon
    const phoneVerificationError = await requirePhoneVerification(request);
    if (phoneVerificationError) {
      return phoneVerificationError;
    }

    // Parsuj formularz
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const date = formData.get('date') as string;
    const images = formData.getAll('images') as File[];

    // Walidacja
    if (!title || !location || !date || images.length === 0) {
      return NextResponse.json(
        { error: 'Wszystkie wymagane pola muszą być wypełnione' },
        { status: 400 },
      );
    }

    // Walidacja zdjęć
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    for (const image of images) {
      if (image.size > maxFileSize) {
        return NextResponse.json(
          { error: `Zdjęcie ${image.name} jest za duże. Maksymalny rozmiar to 5MB.` },
          { status: 400 },
        );
      }

      if (!allowedTypes.includes(image.type)) {
        return NextResponse.json(
          {
            error: `Nieprawidłowy format zdjęcia ${image.name}. Dozwolone formaty: JPG, PNG, WebP.`,
          },
          { status: 400 },
        );
      }
    }

    // Stwórz folder dla zdjęć lokalnie (development) lub uploaduj do Firebase (production)
    const localDirName = 'meetings-with-breeders'
    const uploadDir = join(process.cwd(), 'public', localDirName);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Zapisz zdjęcia (lokalnie) albo uploaduj do Firebase gdy Admin SDK jest dostępne
    const imagePaths: string[] = [];
    const adminApp = getAdminApp();
    const useFirebase = !!adminApp && process.env.NODE_ENV === 'production';

    let bucket: any = null
    if (useFirebase) {
      try {
        bucket = getAdminStorage(adminApp).bucket();
      } catch (e) {
        // fallback to local if storage not available
        bucket = null
      }
    }

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const timestamp = Date.now();
      const fileName = `${timestamp}_${i}_${image.name}`;
      const filePath = join(uploadDir, fileName);

      const bytes = await image.arrayBuffer();

      if (bucket) {
        // upload to Firebase Storage under 'public/meetings-with-breeders/...'
        const storagePath = `public/${localDirName}/${fileName}`
        try {
          await bucket.file(storagePath).save(Buffer.from(bytes), {
            metadata: { contentType: image.type },
            public: true,
          })
          // store the public path (convertPublicPathToStorageUrl will map it)
          imagePaths.push(`/${localDirName}/${fileName}`)
        } catch (err) {
          // on error, fallback to saving locally
          await writeFile(filePath, Buffer.from(bytes));
          imagePaths.push(`/${localDirName}/${fileName}`)
        }
      } else {
        // development or fallback: save locally
        await writeFile(filePath, Buffer.from(bytes));
        imagePaths.push(`/${localDirName}/${fileName}`);
      }
    }

    if (!prisma) {
      return NextResponse.json(
        { error: 'Baza danych niedostępna – nie można zapisać spotkania.' },
        { status: 503 },
      );
    }

    // Zapisz spotkanie do bazy danych
    const firebaseImagePaths = imagePaths.map(path => convertPublicPathToStorageUrl(path));
    const meeting = await prisma.breederMeeting.create({
      data: {
        title,
        description: description || '',
        location,
        date: new Date(date),
        images: JSON.stringify(firebaseImagePaths),
        userId: decodedToken.uid,
        isApproved: false, // Nowe spotkania wymagają zatwierdzenia
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Spotkanie zostało dodane i oczekuje na zatwierdzenie przez administratora',
      meeting: {
        id: meeting.id,
        title: meeting.title,
        location: meeting.location,
        date: meeting.date,
        imagesCount: imagePaths.length,
      },
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'breeder-meetings' });
  }
}

export async function GET() {
  // Prefer remote assets when a public asset base is configured; allow opting into strictly-local assets
  const forceLocalAssets = process.env.NEXT_PUBLIC_FORCE_PUBLIC_MEETING_ASSETS === 'true';
  const assetBase = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(/\/$/, '');

  const buildImageUrl = (rawPath: unknown) => {
    if (typeof rawPath !== 'string' || !rawPath.trim()) return '';
    const safePath = rawPath.trim();
    if (/^https?:\/\//i.test(safePath)) return safePath;

    const cleanPath = safePath
      .replace(/^\/?api\/images\?path=/, '')
      .replace(/^\/?api\/images\//, '')
      .replace(/^\/?public\//, '')
      .replace(/^\/+/, '');

    if (!cleanPath) return '';

    // Local path used for dev and as a runtime fallback
    const localPath = `/${cleanPath}`;

    // If we explicitly want local assets or no base is provided, serve locally
    if (forceLocalAssets || !assetBase) {
      return localPath;
    }

    // Build a storage URL (respects NEXT_PUBLIC_ASSET_BASE_URL inside convertPublicPathToStorageUrl)
    // Ensure the path is prefixed with /public/ for Firebase helpers
    const publicScopedPath = cleanPath.startsWith('public/')
      ? `/${cleanPath}`
      : `/public/${cleanPath}`;

    const storageUrl = convertPublicPathToStorageUrl(publicScopedPath);

    // Fallback to local path if conversion failed
    return storageUrl || localPath;
  };

  // Statyczne spotkania ze zdjęciami z folderów
  const staticMeetings = [
    {
      id: 'geert-munnik',
      name: 'Spotkanie z Geert Munnik',
      location: 'Holandia',
      date: '2024-01-15',
      description: 'Spotkanie z hodowcą Geert Munnik w jego hodowli w Holandii',
      images: [
        buildImageUrl('/meetings-with-breeders/Geert Munnik/DSC_0031.jpg'),
        buildImageUrl('/meetings-with-breeders/Geert Munnik/DSC_0038.jpg'),
        buildImageUrl('/meetings-with-breeders/Geert Munnik/DSC_0044.jpg'),
        buildImageUrl('/meetings-with-breeders/Geert Munnik/DSC_0399.jpg'),
        buildImageUrl('/meetings-with-breeders/Geert Munnik/DSC_03991.jpg'),
        buildImageUrl('/meetings-with-breeders/Geert Munnik/DSC_0409.jpg'),
      ],
    },
    {
      id: 'jan-oost',
      name: 'Spotkanie z Jan Oost',
      location: 'Holandia',
      date: '2024-02-20',
      description: 'Wizyta u hodowcy Jana Oosta - dyskusje o hodowli gołębi pocztowych',
      images: [
        buildImageUrl('/meetings-with-breeders/Jan Oost/DSC_0002.jpg'),
        buildImageUrl('/meetings-with-breeders/Jan Oost/DSC_0004.jpg'),
        buildImageUrl('/meetings-with-breeders/Jan Oost/DSC_0006.jpg'),
        buildImageUrl('/meetings-with-breeders/Jan Oost/DSC_0011.jpg'),
        buildImageUrl('/meetings-with-breeders/Jan Oost/DSC_0017.jpg'),
        buildImageUrl('/meetings-with-breeders/Jan Oost/DSC_0018.jpg'),
        buildImageUrl('/meetings-with-breeders/Jan Oost/DSC_0422.jpg'),
        buildImageUrl('/meetings-with-breeders/Jan Oost/DSC_0423.jpg'),
        buildImageUrl('/meetings-with-breeders/Jan Oost/DSC_0426.jpg'),
      ],
    },
    {
      id: 'marginus-oostenbrink',
      name: 'Spotkanie z Marginus Oostenbrink',
      location: 'Holandia',
      date: '2024-03-10',
      description: 'Spotkanie z doświadczonym hodowcą Marginus Oostenbrink',
      images: [
        buildImageUrl('/meetings-with-breeders/Marginus Oostenbrink/DSC_0431.jpg'),
        buildImageUrl('/meetings-with-breeders/Marginus Oostenbrink/DSC_0433.jpg'),
        buildImageUrl('/meetings-with-breeders/Marginus Oostenbrink/DSC_0435.jpg'),
      ],
    },
    {
      id: 'theo-lehnen',
      name: 'Spotkanie z Theo Lehnen',
      location: 'Niemcy',
      date: '2024-04-05',
      description: 'Wizyta u niemieckiego hodowcy Theo Lehnen',
      images: [
        buildImageUrl('/meetings-with-breeders/Theo Lehnen/Theo-1.jpg'),
        buildImageUrl('/meetings-with-breeders/Theo Lehnen/Theo-2.jpg'),
        buildImageUrl('/meetings-with-breeders/Theo Lehnen/Theo-3.jpg'),
        buildImageUrl('/meetings-with-breeders/Theo Lehnen/Theo.jpg'),
      ],
    },
    {
      id: 'toni-van-ravenstein',
      name: 'Spotkanie z Toni van Ravenstein',
      location: 'Holandia',
      date: '2024-05-12',
      description: 'Spotkanie z hodowcą Toni van Ravenstein - wymiana doświadczeń',
      images: [
        buildImageUrl('/meetings-with-breeders/Toni van Ravenstein/DSC_0001.jpg'),
        buildImageUrl('/meetings-with-breeders/Toni van Ravenstein/DSC_0003.jpg'),
        buildImageUrl('/meetings-with-breeders/Toni van Ravenstein/DSCF2556.jpg'),
        buildImageUrl('/meetings-with-breeders/Toni van Ravenstein/DSCF2559.jpg'),
        buildImageUrl('/meetings-with-breeders/Toni van Ravenstein/DSCF2578.jpg'),
        buildImageUrl('/meetings-with-breeders/Toni van Ravenstein/TONI-1.jpg'),
        buildImageUrl('/meetings-with-breeders/Toni van Ravenstein/TONI-2.jpg'),
      ],
    },
  ];

  const canUseDb = !!prisma;
  const dbMeetings = canUseDb
    ? await withDatabaseFallback(
        async () => {
          const meetings: Array<{
            id: string;
            title: string;
            description: string | null;
            location: string;
            date: Date;
            images: string | null;
          }> = await prisma!.breederMeeting.findMany({
            where: {
              isApproved: true,
            },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              description: true,
              location: true,
              date: true,
              images: true,
            },
          });

          return meetings.map(meeting => ({
            id: meeting.id,
            name: meeting.title,
            location: meeting.location,
            date: meeting.date.toISOString().split('T')[0],
            description: meeting.description || '',
            images: JSON.parse(meeting.images || '[]').map((imagePath: string) => buildImageUrl(imagePath)),
          }));
        },
        [],
        'Database not available, returning only static meetings',
      )
    : [];

  // Połącz wszystkie spotkania
  const allMeetings = [...staticMeetings, ...dbMeetings];

  return NextResponse.json(allMeetings);
}
