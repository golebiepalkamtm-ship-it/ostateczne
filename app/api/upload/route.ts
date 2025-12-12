import { handleApiError } from '@/lib/error-handling';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { requirePhoneVerification } from '@/lib/phone-verification';
import { apiRateLimit } from '@/lib/rate-limit';
import { getStorage } from 'firebase-admin/storage';
import { getAdminApp } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']; // Dodano obrazy do dokumentów
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

async function uploadToFirebaseStorage(file: File, type: string, userId: string): Promise<string> {
  const app = getAdminApp()
  if (!app) {
    throw new Error('Firebase Admin SDK not initialized')
  }

  // Pobierz nazwę bucketa z zmiennych środowiskowych
  const storageBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
  
  if (!storageBucketName) {
    throw new Error('Firebase Storage bucket name is not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or FIREBASE_STORAGE_BUCKET environment variable.')
  }

  // Użyj jawnie nazwy bucketa
  const bucket = getStorage(app).bucket(storageBucketName)
  const safeFileName = generateSafeFileName(file.name)
  const storagePath = `uploads/${type}/${userId}/${safeFileName}`

  const fileRef = bucket.file(storagePath)
  const buffer = Buffer.from(await file.arrayBuffer())

  await fileRef.save(buffer, {
    metadata: {
      contentType: file.type,
      metadata: {
        originalName: file.name,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    },
    public: true,
  })

  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`
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
    const { decodedToken } = authResult;
    const userId = decodedToken.uid;

    // Sprawdź weryfikację telefonu dla uploadu plików
    const phoneVerificationError = await requirePhoneVerification(request);
    if (phoneVerificationError) {
      return phoneVerificationError;
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const type = formData.get('type') as string; // 'image', 'video', 'document'

    console.log('📂 [API Upload] Otrzymano żądanie uploadu:', {
      type,
      filesCount: files?.length,
      fileNames: files?.map(f => f.name),
      fileSizes: files?.map(f => f.size),
      fileTypes: files?.map(f => f.type),
    });

    if (!files || files.length === 0) {
      console.error('❌ [API Upload] Brak plików w żądaniu');
      return NextResponse.json({ error: 'Brak plików do przesłania' }, { status: 400 });
    }

    if (!type || !['image', 'video', 'document'].includes(type)) {
      console.error('❌ [API Upload] Nieprawidłowy typ pliku:', type);
      return NextResponse.json({ error: 'Nieprawidłowy typ pliku' }, { status: 400 });
    }

    const uploadedFiles: string[] = [];

    for (const file of files) {
      const validation = validateFile(file, type);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      try {
        // Upload to Firebase Storage
        const publicUrl = await uploadToFirebaseStorage(file, type, userId);
        uploadedFiles.push(publicUrl);
      } catch (error) {
        console.error('❌ [API Upload] Błąd uploadu do Firebase Storage:', error);
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
