"use server";
import { revalidatePath } from 'next/cache';
import { getAdminApp } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { prisma } from '@/lib/prisma';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Validate uploaded file against constraints
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Nieprawidłowy typ obrazu. Dozwolone: JPG, PNG, WebP' };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'Obraz jest za duży. Maksymalny rozmiar: 5MB' };
  }
  return { valid: true };
}

/**
 * Generate safe filename for storage
 */
function generateSafeFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
  return `${baseName}_${timestamp}_${randomString}.${extension}`;
}

/**
 * Upload file to Firebase Storage
 */
async function uploadToFirebaseStorage(
  file: File, 
  folder: string, 
  userId: string
): Promise<string> {
  const app = getAdminApp();
  if (!app) {
    throw new Error('Firebase Admin SDK not initialized');
  }

  const storageBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
  if (!storageBucketName) {
    throw new Error('Firebase Storage bucket name is not configured');
  }

  const bucket = getStorage(app).bucket(storageBucketName);
  const safeFileName = generateSafeFileName(file.name);
  const storagePath = `${folder}/${userId}/${safeFileName}`;

  const fileRef = bucket.file(storagePath);
  const buffer = Buffer.from(await file.arrayBuffer());

  await fileRef.save(buffer, {
    metadata: {
      contentType: file.type,
      metadata: {
        originalName: file.name,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        folder: folder,
      },
    },
    public: true,
  });

  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
}

/**
 * Delete file from Firebase Storage
 */
async function deleteFromFirebaseStorage(fileUrl: string): Promise<void> {
  try {
    const app = getAdminApp();
    if (!app) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    const storageBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
    if (!storageBucketName) {
      throw new Error('Firebase Storage bucket name is not configured');
    }

    const bucket = getStorage(app).bucket(storageBucketName);
    
    // Extract file path from URL
    const urlPattern = /\/o\/([^?]+)/;
    const match = fileUrl.match(urlPattern);
    if (!match) {
      throw new Error('Invalid Firebase Storage URL format');
    }

    const filePath = decodeURIComponent(match[1]);
    await bucket.file(filePath).delete();
  } catch (error) {
    console.error('Error deleting file from Firebase Storage:', error);
    throw error;
  }
}

/**
 * Upload and store system background image
 */
export async function uploadSystemBackgroundImage(
  file: File,
  userId: string
): Promise<FileUploadResult> {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Get current background image URL to delete later
    const currentSetting = await prisma.systemSetting.findUnique({
      where: { key: 'siteBackgroundImageUrl' }
    });

    // Upload new image
    const imageUrl = await uploadToFirebaseStorage(file, 'system/backgrounds', userId);

    // Update or create system setting
    await prisma.systemSetting.upsert({
      where: { key: 'siteBackgroundImageUrl' },
      update: { 
        value: imageUrl,
        updatedAt: new Date()
      },
      create: {
        key: 'siteBackgroundImageUrl',
        value: imageUrl,
        description: 'URL tła strony głównej',
        type: 'STRING'
      }
    });

    // Delete old background image if it exists
    if (currentSetting?.value && currentSetting.value !== imageUrl) {
      try {
        await deleteFromFirebaseStorage(currentSetting.value);
      } catch (error) {
        console.warn('Failed to delete old background image:', error);
        // Don't fail the whole operation if old image deletion fails
      }
    }

    // Revalidate relevant paths
    revalidatePath('/');
    revalidatePath('/admin/settings/appearance');

    return { success: true, url: imageUrl };
  } catch (error) {
    console.error('Error uploading system background image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Błąd podczas przesyłania obrazu' 
    };
  }
}

/**
 * Upload and create champion gallery items
 */
export async function uploadChampionGalleryImages(
  files: File[],
  titles: string[],
  descriptions: string[],
  userId: string
): Promise<{ success: boolean; results: FileUploadResult[]; error?: string }> {
  try {
    const results: FileUploadResult[] = [];
    
    // Validate all files first
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateImageFile(file);
      if (!validation.valid) {
        return { 
          success: false, 
          results: [],
          error: `Plik "${file.name}": ${validation.error}` 
        };
      }
    }

    // Get current max order to append new items
    const lastItem = await prisma.championGalleryItem.findFirst({
      orderBy: { order: 'desc' }
    });
    let currentOrder = lastItem?.order || 0;

    // Upload files and create database records
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const title = titles[i] || `Champion ${currentOrder + 1}`;
        const description = descriptions[i] || '';

        // Upload image
        const imageUrl = await uploadToFirebaseStorage(file, 'champions/gallery', userId);

        // Create database record
        const galleryItem = await prisma.championGalleryItem.create({
          data: {
            imageUrl,
            title,
            description,
            order: currentOrder + 1,
            isActive: true
          }
        });

        currentOrder++;
        results.push({ success: true, url: imageUrl });
      } catch (error) {
        console.error(`Error processing file ${i}:`, error);
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Błąd przesyłania pliku' 
        });
      }
    }

    // Revalidate relevant paths
    revalidatePath('/champions');
    revalidatePath('/admin/gallery');

    return { success: true, results };
  } catch (error) {
    console.error('Error uploading champion gallery images:', error);
    return { 
      success: false, 
      results: [],
      error: error instanceof Error ? error.message : 'Błąd podczas przesyłania plików' 
    };
  }
}

/**
 * Update champion gallery item
 */
export async function updateChampionGalleryItem(
  id: string,
  title: string,
  description: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.championGalleryItem.update({
      where: { id },
      data: {
        title,
        description,
        isActive,
        updatedAt: new Date()
      }
    });

    revalidatePath('/champions');
    revalidatePath('/admin/gallery');

    return { success: true };
  } catch (error) {
    console.error('Error updating champion gallery item:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Błąd podczas aktualizacji' 
    };
  }
}

/**
 * Delete champion gallery item
 */
export async function deleteChampionGalleryItem(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const item = await prisma.championGalleryItem.findUnique({
      where: { id }
    });

    if (!item) {
      return { success: false, error: 'Element galerii nie został znaleziony' };
    }

    // Delete from database first
    await prisma.championGalleryItem.delete({
      where: { id }
    });

    // Delete file from storage
    try {
      await deleteFromFirebaseStorage(item.imageUrl);
    } catch (error) {
      console.warn('Failed to delete file from storage:', error);
      // Don't fail the whole operation if file deletion fails
    }

    revalidatePath('/champions');
    revalidatePath('/admin/gallery');

    return { success: true };
  } catch (error) {
    console.error('Error deleting champion gallery item:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Błąd podczas usuwania' 
    };
  }
}

/**
 * Reorder champion gallery items
 */
export async function reorderChampionGalleryItems(
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update order for each item
    for (let i = 0; i < itemIds.length; i++) {
      await prisma.championGalleryItem.update({
        where: { id: itemIds[i] },
        data: { 
          order: i + 1,
          updatedAt: new Date()
        }
      });
    }

    revalidatePath('/champions');
    revalidatePath('/admin/gallery');

    return { success: true };
  } catch (error) {
    console.error('Error reordering champion gallery items:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Błąd podczas zmiany kolejności' 
    };
  }
}