import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/error-handling';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * Get all champion gallery items
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const items = await prisma.championGalleryItem.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      items,
      count: items.length,
    });

  } catch (error) {
    console.error('Error getting champion gallery items:', error);
    return handleApiError(error, request, { endpoint: 'admin/gallery' });
  }
}

/**
 * Update champion gallery item
 */
export async function PUT(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id, title, description, isActive } = await request.json();

    if (!id || !title) {
      return NextResponse.json({ error: 'ID i tytuł są wymagane' }, { status: 400 });
    }

    const item = await prisma.championGalleryItem.update({
      where: { id },
      data: {
        title,
        description: description || null,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Element galerii został zaktualizowany',
      item,
    });

  } catch (error) {
    console.error('Error updating champion gallery item:', error);
    return handleApiError(error, request, { endpoint: 'admin/gallery' });
  }
}

/**
 * Delete champion gallery item
 */
export async function DELETE(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID elementu jest wymagane' }, { status: 400 });
    }

    const item = await prisma.championGalleryItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: 'Element galerii nie został znaleziony' }, { status: 404 });
    }

    // Delete from database
    await prisma.championGalleryItem.delete({
      where: { id },
    });

    // Note: File deletion from Firebase Storage should be handled by the server action
    // that calls this endpoint, as it has access to the file URL

    return NextResponse.json({
      message: 'Element galerii został usunięty',
    });

  } catch (error) {
    console.error('Error deleting champion gallery item:', error);
    return handleApiError(error, request, { endpoint: 'admin/gallery' });
  }
}

/**
 * Reorder champion gallery items
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { itemIds } = await request.json();

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'Lista ID elementów jest wymagana' }, { status: 400 });
    }

    // Update order for each item
    const updatePromises = itemIds.map((id: string, index: number) => 
      prisma.championGalleryItem.update({
        where: { id },
        data: { 
          order: index + 1,
          updatedAt: new Date(),
        },
      }),
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: 'Kolejność elementów została zaktualizowana',
    });

  } catch (error) {
    console.error('Error reordering champion gallery items:', error);
    return handleApiError(error, request, { endpoint: 'admin/gallery' });
  }
}