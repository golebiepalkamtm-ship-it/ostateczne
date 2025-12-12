import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/error-handling';
import { requireAdminAuth } from '@/lib/admin-auth';
import { 
  uploadSystemBackgroundImage, 
  uploadChampionGalleryImages, 
} from '@/app/actions/admin-storage';

/**
 * Admin-only file upload endpoint
 * Handles background images and champion gallery uploads
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { decodedToken } = authResult;
    const userId = decodedToken.uid;

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const type = formData.get('type') as string; // 'background' | 'champion'
    const titles = formData.get('titles') ? JSON.parse(formData.get('titles') as string) : [];
    const descriptions = formData.get('descriptions') ? JSON.parse(formData.get('descriptions') as string) : [];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Brak plików do przesłania' }, { status: 400 });
    }

    if (!type || !['background', 'champion'].includes(type)) {
      return NextResponse.json({ error: 'Nieprawidłowy typ uploadu' }, { status: 400 });
    }

    if (type === 'background' && files.length > 1) {
      return NextResponse.json({ error: 'Tło strony może zawierać tylko jeden obraz' }, { status: 400 });
    }

    let result;
    
    if (type === 'background') {
      result = await uploadSystemBackgroundImage(files[0], userId);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        message: 'Tło strony zostało zaktualizowane pomyślnie',
        files: [result.url],
      });
    }

    if (type === 'champion') {
      // Validate that we have titles/descriptions for all files
      if (titles.length !== files.length || descriptions.length !== files.length) {
        return NextResponse.json({ 
          error: 'Brak tytułów lub opisów dla niektórych obrazów championów', 
        }, { status: 400 });
      }

      result = await uploadChampionGalleryImages(files, titles, descriptions, userId);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      const successfulUploads = result.results.filter(r => r.success && r.url);
      const failedUploads = result.results.filter(r => !r.success);

      return NextResponse.json({
        message: `Przesłano ${successfulUploads.length} z ${files.length} obrazów`,
        files: successfulUploads.map(r => r.url),
        errors: failedUploads.map(r => r.error),
        summary: {
          total: files.length,
          successful: successfulUploads.length,
          failed: failedUploads.length,
        },
      });
    }

    return NextResponse.json({ error: 'Nieobsługiwany typ uploadu' }, { status: 400 });

  } catch (error) {
    console.error('Admin upload error:', error);
    return handleApiError(error, request, { endpoint: 'admin/upload' });
  }
}