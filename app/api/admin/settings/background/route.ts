import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/error-handling';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * Get current system background setting
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'siteBackgroundImageUrl' },
    });

    return NextResponse.json({
      setting: setting || null,
    });

  } catch (error) {
    console.error('Error getting background setting:', error);
    return handleApiError(error, request, { endpoint: 'admin/settings/background' });
  }
}

/**
 * Update system background setting (alternative to file upload)
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Nieprawidłowy URL obrazu' }, { status: 400 });
    }

    // Validate that it's a valid image URL (basic check)
    if (!url.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i)) {
      return NextResponse.json({ error: 'Nieprawidłowy format URL obrazu' }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key: 'siteBackgroundImageUrl' },
      update: { 
        value: url,
        updatedAt: new Date(),
      },
      create: {
        key: 'siteBackgroundImageUrl',
        value: url,
        description: 'URL tła strony głównej',
        type: 'STRING',
      },
    });

    // Revalidate relevant paths
    // Note: We would use revalidatePath here in a server action context

    return NextResponse.json({
      message: 'Tło strony zostało zaktualizowane',
      setting,
    });

  } catch (error) {
    console.error('Error updating background setting:', error);
    return handleApiError(error, request, { endpoint: 'admin/settings/background' });
  }
}