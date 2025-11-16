import { handleApiError } from '@/lib/error-handling';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { requirePhoneVerification } from '@/lib/phone-verification';
import { apiRateLimit } from '@/lib/rate-limit';
import { mkdir, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File, type: string): { valid: boolean; error?: string } {
  if (type === 'image') {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { valid: false, error: 'Nieprawidłowy typ obrazu' };
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return { valid: false, error: 'Obraz jest za duży (max 5MB)' };
    }
  } else if (type === 'video') {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return { valid: false, error: 'Nieprawidłowy typ wideo' };
    }
    if (file.size > MAX_VIDEO_SIZE) {
      return { valid: false, error: 'Wideo jest za duże (max 50MB)' };
    }
  } else if (type === 'document') {
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      return { valid: false, error: 'Nieprawidłowy typ dokumentu' };
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      return { valid: false, error: 'Dokument jest za duży (max 10MB)' };
    }
  }
  return { valid: true };
}

function generateSafeFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
  return `${baseName}_${timestamp}_${randomString}.${extension}`;
}

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

    // Sprawdź weryfikację telefonu dla uploadu plików
    const phoneVerificationError = await requirePhoneVerification(request);
    if (phoneVerificationError) {
      return phoneVerificationError;
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const type = formData.get('type') as string; // 'image', 'video', 'document'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Brak plików do przesłania' }, { status: 400 });
    }

    if (!type || !['image', 'video', 'document'].includes(type)) {
      return NextResponse.json({ error: 'Nieprawidłowy typ pliku' }, { status: 400 });
    }

    const uploadedFiles: string[] = [];

    for (const file of files) {
      const validation = validateFile(file, type);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Generuj bezpieczną nazwę pliku
      const safeFileName = generateSafeFileName(file.name);
      const uploadDir = join(process.cwd(), 'public', 'uploads', type);
      const filePath = join(uploadDir, safeFileName);

      try {
        // Utwórz katalog jeśli nie istnieje
        await mkdir(uploadDir, { recursive: true });

        // Zapisz plik
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Dodaj URL do listy
        uploadedFiles.push(`/uploads/${type}/${safeFileName}`);
      } catch (error) {
        return handleApiError(error, request, { endpoint: 'upload', file: file.name });
      }
    }

    return NextResponse.json({
      message: 'Pliki zostały przesłane pomyślnie',
      files: uploadedFiles,
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'upload' });
  }
}
