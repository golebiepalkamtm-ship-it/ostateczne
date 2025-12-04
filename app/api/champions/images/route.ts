import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

// Wymuś dynamiczny rendering po stronie serwera
export const dynamic = 'force-dynamic';

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);

async function dirExists(p: string): Promise<boolean> {
  try {
    const s = await fs.promises.stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function listImages(dir: string): Promise<string[]> {
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    return entries
      .filter(e => e.isFile())
      .map(e => e.name)
      .filter(name => ALLOWED_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch {
    return [];
  }
}

export async function GET(_request: NextRequest) {
  try {
    const root = process.cwd();
    const championsRoot = path.join(root, 'public', 'champions');

    const rootOk = await dirExists(championsRoot);
    if (!rootOk) {
      console.warn('Brak katalogu public/champions');
      return NextResponse.json({
        champions: [],
        pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
      });
    }

    const dirents = await fs.promises.readdir(championsRoot, { withFileTypes: true });
    const championIds = dirents
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const champions = [] as Array<{
      id: string;
      images: string[];
      pedigree: { images: string[] };
    }>;

    for (const id of championIds) {
      const galleryDir = path.join(championsRoot, id, 'gallery');
      const pedigreeDir = path.join(championsRoot, id, 'pedigree');

      const galleryFiles = await listImages(galleryDir);
      const pedigreeFiles = await listImages(pedigreeDir);

      if (galleryFiles.length === 0 && pedigreeFiles.length === 0) {
        continue; // brak materiałów do pokazania
      }

      champions.push({
        id,
        images: galleryFiles.map(f => `/champions/${id}/gallery/${f}`),
        pedigree: { images: pedigreeFiles.map(f => `/champions/${id}/pedigree/${f}`) },
      });
    }

    return NextResponse.json({
      champions,
      pagination: {
        total: champions.length,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    });
  } catch (error) {
    console.error('API ERROR /api/champions/images:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}