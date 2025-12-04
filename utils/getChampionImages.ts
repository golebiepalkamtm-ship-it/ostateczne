import { Dirent, promises as fs } from 'fs';
import { join } from 'path';
import { storage } from '@/lib/firebase';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

export interface ChampionImageData {
  id: string;
  name: string;
  ringNumber: string;
  bloodline: string;
  gender: string;
  birthDate: string;
  color: string;
  weight: number;
  breeder: string;
  description: string;
  images: Array<{ url: string; alt: string }>;
  videos: Array<{ url: string; alt: string }>;
  achievements: string[];
  pedigree: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// Funkcja do skanowania folderów championów z obsługą Firebase Storage
export async function scanChampionFolders(): Promise<ChampionImageData[]> {
  // Jeśli wymuszone lokalne lub pracujemy lokalnie (dev), użyj lokalnych plików najpierw
  const forceLocal =
    String(process.env.FORCE_LOCAL_CHAMPIONS || '').toLowerCase() === '1' ||
    String(process.env.FORCE_LOCAL_CHAMPIONS || '').toLowerCase() === 'true';
  const isDev = process.env.NODE_ENV !== 'production';

  if (forceLocal || isDev) {
    try {
      const localChampions = await scanFromLocalFiles();
      if (localChampions.length > 0) {
        console.log(`Używam lokalnych plików championów (znaleziono ${localChampions.length})`);
        return localChampions;
      }
    } catch (err) {
      console.warn('Błąd podczas skanowania lokalnych plików, spróbuję Firebase Storage:', err);
    }
  }

  // Jeśli nie wymuszone lokalnie lub lokalne nie zawiera danych, spróbuj Firebase Storage
  try {
    const firebaseChampions = await scanFromFirebaseStorage();
    if (firebaseChampions.length > 0) {
      console.log(`Pobrano ${firebaseChampions.length} championów z Firebase Storage`);
      return firebaseChampions;
    }
  } catch (error) {
    console.log('Firebase Storage niedostępne lub puste, używam lokalnych plików jako fallback:', error);
  }

  // Ostateczny fallback do lokalnych plików
  console.log('Używam lokalnych plików championów (fallback)');
  return scanFromLocalFiles();
}

// Pobierz championów z Firebase Storage
async function scanFromFirebaseStorage(): Promise<ChampionImageData[]> {
  const champions: ChampionImageData[] = [];
  
  if (!storage) {
    throw new Error('Firebase Storage nie jest zainicjalizowany');
  }

  try {
    // Referencja do folderu champions w Firebase Storage
    const championsRef = ref(storage, 'champions');
    
    // Pobierz listę wszystkich folderów championów
    const championsList = await listAll(championsRef);
    
    // Filtruj tylko foldery
    const championFolders = championsList.items.filter(item => 
      !item.name.includes('.') // Foldery nie mają rozszerzenia
    );

    console.log(`Znaleziono ${championFolders.length} folderów championów w Firebase Storage`);

    for (const folderRef of championFolders) {
      const championId = folderRef.name;
      const champion = await scanFirebaseChampionFolder(championId);
      
      if (champion) {
        champions.push(champion);
      }
    }

    // Sortuj po ID
    champions.sort((a, b) => {
      const numA = parseInt(a.id) || 0;
      const numB = parseInt(b.id) || 0;
      return numA - numB;
    });

    return champions;
  } catch (error) {
    console.error('Błąd podczas pobierania z Firebase Storage:', error);
    throw error;
  }
}

// Pobierz dane championa z Firebase Storage
async function scanFirebaseChampionFolder(folderId: string): Promise<ChampionImageData | null> {
  try {
    const champion: ChampionImageData = {
      id: folderId,
      name: `Champion ${folderId}`,
      ringNumber: `PL-2024-${folderId.padStart(3, '0')}`,
      bloodline: 'Janssen',
      gender: 'MALE',
      birthDate: '2023-01-01T00:00:00.000Z',
      color: 'Blue',
      weight: 450,
      breeder: 'MTM Pałka',
      description: `Champion ${folderId} z Firebase Storage`,
      images: [],
      videos: [],
      achievements: ['Mistrz Polski 2023'],
      pedigree: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Pobierz zdjęcia z folderu gallery
    try {
      if (!storage) {
        throw new Error('Firebase Storage nie jest zainicjalizowany');
      }
      const galleryRef = ref(storage, `champions/${folderId}/gallery`);
      const galleryList = await listAll(galleryRef);
      
      const galleryImages = await Promise.all(
        galleryList.items.map(async (item, index) => {
          const url = await getDownloadURL(item);
          return {
            url: url, // Firebase Storage URL
            alt: `Champion ${folderId} - zdjęcie ${index + 1}`,
          };
        })
      );

      champion.images = galleryImages;
      console.log(`Champion ${folderId}: ${galleryImages.length} zdjęć z Firebase Storage`);
    } catch (error) {
      console.log(`Champion ${folderId}: Brak folderu gallery w Firebase Storage`);
    }

    // Pobierz wideo z folderu videos
    try {
      if (!storage) {
        throw new Error('Firebase Storage nie jest zainicjalizowany');
      }
      const videosRef = ref(storage, `champions/${folderId}/videos`);
      const videosList = await listAll(videosRef);
      
      const videos = await Promise.all(
        videosList.items.map(async (item, index) => {
          const url = await getDownloadURL(item);
          return {
            url: url, // Firebase Storage URL
            alt: `Champion ${folderId} - wideo ${index + 1}`,
          };
        })
      );

      champion.videos = videos;
      console.log(`Champion ${folderId}: ${videos.length} wideo z Firebase Storage`);
    } catch (error) {
      console.log(`Champion ${folderId}: Brak folderu videos w Firebase Storage`);
    }

    // Pobierz zdjęcia rodowodu z folderu pedigree
    try {
      if (!storage) {
        throw new Error('Firebase Storage nie jest zainicjalizowany');
      }
      const pedigreeRef = ref(storage, `champions/${folderId}/pedigree`);
      const pedigreeList = await listAll(pedigreeRef);
      
      const pedigreeImages = await Promise.all(
        pedigreeList.items.map(async (item) => {
          return await getDownloadURL(item); // Firebase Storage URL
        })
      );

      if (pedigreeImages.length > 0) {
        champion.pedigree = {
          images: pedigreeImages,
        };
        console.log(`Champion ${folderId}: ${pedigreeImages.length} zdjęć rodowodu z Firebase Storage`);
      }
    } catch (error) {
      console.log(`Champion ${folderId}: Brak folderu pedigree w Firebase Storage`);
    }

    return champion;
  } catch (error) {
    console.error(`Błąd podczas pobierania championa ${folderId} z Firebase Storage:`, error);
    return null;
  }
}

// Fallback: skanuj lokalne pliki (oryginalna funkcja)
async function scanFromLocalFiles(): Promise<ChampionImageData[]> {
  const championsDir = join(process.cwd(), 'public', 'champions');
  const champions: ChampionImageData[] = [];

  try {
    // Sprawdź czy folder champions istnieje
    await fs.access(championsDir);

    // Przeczytaj wszystkie foldery w champions
    const entries = await fs.readdir(championsDir, { withFileTypes: true });
    const folders = entries
      .filter((dirent: Dirent) => dirent.isDirectory())
      .map((dirent: Dirent) => dirent.name);

    for (const folderName of folders) {
      // Pomiń foldery specjalne
      if (folderName === 'thunder-storm' || folderName.startsWith('.')) {
        continue;
      }

      const championPath = join(championsDir, folderName);
      const champion = await scanLocalChampionFolder(folderName, championPath);

      if (champion) {
        champions.push(champion);
      }
    }

    // Sortuj po numerze folderu
    champions.sort((a, b) => {
      const numA = parseInt(a.id) || 0;
      const numB = parseInt(b.id) || 0;
      return numA - numB;
    });
  } catch (error) {
    console.error('Błąd podczas skanowania lokalnych folderów championów:', error);
  }

  return champions;
}

// Funkcja do skanowania pojedynczego lokalnego folderu championa
async function scanLocalChampionFolder(
  folderId: string,
  folderPath: string
): Promise<ChampionImageData | null> {
  try {
    // Sprawdź czy istnieje plik JSON z danymi championa
    let championData: Partial<ChampionImageData> = {};
    const jsonPath = join(folderPath, 'data.json');
    try {
      await fs.access(jsonPath);
      const jsonContent = await fs.readFile(jsonPath, 'utf-8');
      championData = JSON.parse(jsonContent);
    } catch {
      // Plik JSON nie istnieje, użyj domyślnych danych
    }

    // Podstawowe dane championa z możliwością nadpisania z pliku JSON
    const champion: ChampionImageData = {
      id: folderId,
      name: championData.name || `Champion ${folderId}`,
      ringNumber: championData.ringNumber || `PL-2024-${folderId.padStart(3, '0')}`,
      bloodline: championData.bloodline || 'Janssen',
      gender: championData.gender || 'MALE',
      birthDate: championData.birthDate || '2023-01-01T00:00:00.000Z',
      color: championData.color || 'Blue',
      weight: championData.weight || 450,
      breeder: championData.breeder || 'MTM Pałka',
      description: championData.description || `Wybitny champion z folderu ${folderId}`,
      images: [],
      videos: [],
      achievements: championData.achievements || ['Mistrz Polski 2023'],
      pedigree: null,
      createdAt: championData.createdAt || new Date().toISOString(),
      updatedAt: championData.updatedAt || new Date().toISOString(),
    };

    // Skanuj folder gallery - zdjęcia gołębia
    const galleryPath = join(folderPath, 'gallery');
    try {
      await fs.access(galleryPath);
      const galleryFiles = await fs.readdir(galleryPath);
      const galleryImages = galleryFiles
        .filter((file: string) => /\.(jpg|jpeg|png|webp)$/i.test(file))
        .sort()
        .map((file: string, index: number) => ({
          url: `/champions/${folderId}/gallery/${file}`,
          alt: `Champion ${folderId} - zdjęcie ${index + 1}`,
        }));

      champion.images = galleryImages;
    } catch {
      // Folder gallery nie istnieje
      champion.images = [];
    }

    // Skanuj folder videos
    const videosPath = join(folderPath, 'videos');
    try {
      await fs.access(videosPath);
      const videoFiles = await fs.readdir(videosPath);
      const videos = videoFiles
        .filter((file: string) => /\.(mp4|webm|mov)$/i.test(file))
        .map((file: string, index: number) => ({
          url: `/champions/${folderId}/videos/${file}`,
          alt: `Champion ${folderId} - wideo ${index + 1}`,
        }));

      champion.videos = videos;
    } catch {
      // Folder videos nie istnieje
    }

    // Skanuj folder pedigree - zdjęcie rodowodu
    const pedigreePath = join(folderPath, 'pedigree');
    try {
      await fs.access(pedigreePath);
      const pedigreeFiles = await fs.readdir(pedigreePath);
      const pedigreeImages = pedigreeFiles
        .filter((file: string) => /\.(jpg|jpeg|png|webp)$/i.test(file))
        .sort();

      if (pedigreeImages.length > 0) {
        champion.pedigree = {
          images: pedigreeImages.map((file: string) => `/champions/${folderId}/pedigree/${file}`),
        };
      }
    } catch {
      // Folder pedigree nie istnieje
      champion.pedigree = null;
    }

    return champion;
  } catch (error) {
    console.error(`Błąd podczas skanowania folderu ${folderId}:`, error);
    return null;
  }
}
