import { handleApiError } from '@/lib/error-handling';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { requirePhoneVerification } from '@/lib/phone-verification';
import { prisma } from '@/lib/prisma';
import { apiRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const achievementSchema = z.object({
  pigeon: z.string(),
  ringNumber: z.string(),
  results: z.array(
    z.object({
      competition: z.string(),
      place: z.number(),
      date: z.string(),
    })
  ),
});

const createReferenceSchema = z.object({
  breederName: z.string(),
  location: z.string(),
  experience: z.string(),
  testimonial: z.string(),
  rating: z.number().min(1).max(5),
  achievements: z.array(achievementSchema),
});

export async function GET() {
  try {
    const refs = await prisma.reference.findMany({
      where: {
        isApproved: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        breederName: true,
        location: true,
        experience: true,
        testimonial: true,
        rating: true,
        achievements: true,
        createdAt: true,
      },
    });

    const references = refs.map(
      (ref: {
        id: string;
        breederName: string;
        location: string;
        experience: string;
        testimonial: string;
        achievements: string | null;
        rating: number;
        createdAt: Date;
      }) => {
        let achievements = [];
        try {
          achievements = JSON.parse(ref.achievements || '[]');
        } catch {
          // Jeśli parsing nie powiedzie się, użyj pustej tablicy
          achievements = [];
        }

        return {
          id: ref.id,
          breeder: {
            name: ref.breederName,
            location: ref.location,
            experience: ref.experience,
            avatar: null, // Avatar z profilu użytkownika - do implementacji w przyszłości
          },
          testimonial: ref.testimonial,
          achievements,
          rating: ref.rating,
          date: ref.createdAt.toISOString().split('T')[0],
        };
      }
    );

    return NextResponse.json(references);
  } catch (error) {
    return handleApiError(error, undefined, { endpoint: 'references', method: 'GET' });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Sprawdź autoryzację Firebase
    const authResult = await requireFirebaseAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Sprawdź weryfikację telefonu dla dodawania referencji
    const phoneVerificationError = await requirePhoneVerification(request);
    if (phoneVerificationError) {
      return phoneVerificationError;
    }

    const body = await request.json();
    const parsedData = createReferenceSchema.parse(body);

    const reference = await prisma.reference.create({
      data: {
        breederName: parsedData.breederName,
        location: parsedData.location,
        experience: parsedData.experience,
        testimonial: parsedData.testimonial,
        rating: parsedData.rating,
        achievements: JSON.stringify(parsedData.achievements || []),
        isApproved: false, // Nowe referencje wymagają zatwierdzenia
      },
    });

    return NextResponse.json(
      {
        message: 'Referencja została dodana i oczekuje na zatwierdzenie',
        id: reference.id,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'references' });
  }
}
