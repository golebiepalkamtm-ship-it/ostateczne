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

// Funkcja do pobierania championów z Firebase Storage
export async function scanChampionFoldersFromFirebase(): Promise<ChampionImageData[]> {
  const champions: ChampionImageData[] = [];
  
  try {
    if (!storage) {
      console.error('Firebase Storage nie jest zainicjalizowany');
      return champions;
    }

    // Referencja do folderu champions w Firebase Storage
    const championsRef = ref(storage, 'champions');
    
    // Pobierz listę wszystkich folderów championów
    const championsList = await listAll(championsRef);
    
    // prefixes zawiera podfoldery (foldery championów)
    const championFolders = championsList.prefixes;

    console.log(`Znaleziono ${championFolders.length} folderów championów`);

    for (const folderRef of championFolders) {
      const championId = folderRef.name;
      const champion = await scanChampionFolderFromFirebase(championId, folderRef);
      
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

  } catch (error) {
    console.error('Błąd podczas pobierania championów z Firebase Storage:', error);
  }

  return champions;
}

// Funkcja do pobierania danych championa z Firebase Storage
async function scanChampionFolderFromFirebase(
  folderId: string, 
  folderRef: any,
): Promise<ChampionImageData | null> {
  try {
    // Podstawowe dane championa
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
      description: `Wybitny champion z Firebase Storage ${folderId}`,
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
            url: url,
            alt: `Champion ${folderId} - zdjęcie ${index + 1}`,
          };
        }),
      );

      champion.images = galleryImages;
      console.log(`Champion ${folderId}: ${galleryImages.length} zdjęć w galerii`);
    } catch (error) {
      console.log(`Champion ${folderId}: Brak folderu gallery`);
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
            url: url,
            alt: `Champion ${folderId} - wideo ${index + 1}`,
          };
        }),
      );

      champion.videos = videos;
      console.log(`Champion ${folderId}: ${videos.length} wideo`);
    } catch (error) {
      console.log(`Champion ${folderId}: Brak folderu videos`);
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
          return await getDownloadURL(item);
        }),
      );

      if (pedigreeImages.length > 0) {
        champion.pedigree = {
          images: pedigreeImages,
        };
        console.log(`Champion ${folderId}: ${pedigreeImages.length} zdjęć rodowodu`);
      }
    } catch (error) {
      console.log(`Champion ${folderId}: Brak folderu pedigree`);
    }

    // Spróbuj pobrać data.json z Firebase Storage
    try {
      if (!storage) {
        throw new Error('Firebase Storage nie jest zainicjalizowany');
      }
      const dataRef = ref(storage, `champions/${folderId}/data.json`);
      // W rzeczywistej implementacji pobralibyśmy plik JSON
      // ale Firebase Storage nie ma łatwego sposobu na pobranie zawartości tekstowej
      // Możemy to pominąć lub zaimplementować osobno
    } catch (error) {
      console.log(`Champion ${folderId}: Brak pliku data.json`);
    }

    return champion;
  } catch (error) {
    console.error(`Błąd podczas pobierania championa ${folderId}:`, error);
    return null;
  }
}