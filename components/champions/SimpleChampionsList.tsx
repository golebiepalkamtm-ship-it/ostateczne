'use client';

import ImageModal from '@/components/ImageModal';
import { useEffect, useState, useCallback } from 'react';
import { debug, error as logError, isDev } from '@/lib/logger';
import { ChampionsCarousel } from './ChampionsCarousel';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Champion {
  id: string;
  images: string[];
  pedigreeImage?: string;
}

interface ChampionData {
  id?: string;
  images?: Array<string | { url?: string }>;
  pedigreeImage?: string;
}

export function SimpleChampionsList({
  onPedigreeClick,
  onCentralChampionChange,
}: {
  onPedigreeClick?: (image: string) => void;
  onCentralChampionChange?: (champion: Champion | null) => void;
}) {
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; sourceEl?: HTMLElement } | null>(null);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [allImages, setAllImages] = useState<Array<{ src: string; alt: string }>>([]);
  const [selectedPedigreeImage, setSelectedPedigreeImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced loading function with retry logic
  const loadChampions = useCallback(async (isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
      } else {
        setIsLoading(true);
        setError(null);
      }

      if (isDev) debug(`Fetching champions from API... (retry: ${isRetry})`);
      
      const response = await fetch('/api/champions/images', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (isDev) debug('API response status:', response.status);
      if (isDev) debug('API response ok:', response.ok);

      if (!response.ok) {
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      if (isDev) debug('API response data:', responseData);
      const championsData = responseData.champions || [];
      if (isDev) debug('Champions data from API:', championsData);

      // Enhanced error handling for empty data
      if (!Array.isArray(championsData)) {
        throw new Error('Nieprawidłowy format danych z serwera');
      }

      // Konwertuj dane z API na format Champion z enhanced error handling
      const championsList = championsData
        .map((championData: ChampionData, index: number) => {
          try {
            // API zwraca images jako tablicę stringów
            const apiImages = Array.isArray(championData.images) ? championData.images : [];
            if (isDev) debug('Raw API images for champion', championData.id, ':', apiImages);

            const gallery = apiImages
              .map((img: string | { url?: string }) => {
                // Obsługa zarówno stringów jak i obiektów (backward compatibility)
                if (typeof img === 'string') return img;
                if (typeof img === 'object' && img !== null) {
                  return String(img.url || '');
                }
                return '';
              })
              .filter(Boolean);

            // Pobierz rodowód z danych API
            let pedigreeImage = '';
            const championWithPedigree = championData as {
              id: string;
              pedigree?: {
                images?: string[];
              };
            };

            if (isDev) debug('Champion data pedigree:', championWithPedigree.pedigree);

            // Użyj pierwszego obrazu rodowodu z API
            if (
              championWithPedigree.pedigree &&
              typeof championWithPedigree.pedigree === 'object' &&
              'images' in championWithPedigree.pedigree &&
              Array.isArray(championWithPedigree.pedigree.images) &&
              championWithPedigree.pedigree.images.length > 0
            ) {
              const firstImage = championWithPedigree.pedigree.images[0];
              if (typeof firstImage === 'string' && firstImage.trim()) {
                pedigreeImage = firstImage;
                if (isDev) debug('Using scanned pedigree image:', pedigreeImage);
              }
            }

            const processedChampion = {
              id: String(championData.id || `champion-${index}`),
              images: gallery,
              pedigreeImage: pedigreeImage,
            };

            if (isDev) debug('Processed champion:', processedChampion);

            return processedChampion;
          } catch (championError) {
            logError(`Error processing champion at index ${index}:`, championError);
            return null;
          }
        })
        .filter(Boolean) as Champion[];

      if (isDev) debug('Processed champions list:', championsList);
      if (isDev) debug('Champions list length:', championsList.length);

      // Enhanced validation
      if (championsList.length === 0) {
        throw new Error('Brak dostępnych championów do wyświetlenia');
      }

      setChampions(championsList);

      // Przygotuj wszystkie zdjęcia do nawigacji w modalu
      const flatImages = championsList.flatMap((champion: Champion) =>
        champion.images.map(src => ({ src, alt: `Zdjęcie championa ${champion.id}` }))
      );

      setAllImages(flatImages);

      // Reset retry count on success
      setRetryCount(0);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd podczas ładowania championów';
      
      if (isDev) logError('Error loading champions:', { error: err, retryCount, isRetry });
      
      setError(errorMessage);
      
      // Log to Sentry in production
      if (!isDev) {
        logError('Champions loading failed', { error: errorMessage, retryCount });
      }
      
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [retryCount]);

  // Retry function
  const handleRetry = useCallback(() => {
    loadChampions(true);
  }, [loadChampions]);

  // Ładowanie championów z API
  useEffect(() => {
    loadChampions();
  }, [loadChampions]);

  const handleImageClick = (imageSrc: string, index: number, sourceEl?: HTMLElement) => {
    // Store sourceEl together with image data to ensure they're in sync
    console.log('handleImageClick - sourceEl:', sourceEl);
    setSelectedImage({ src: imageSrc, alt: `Zdjęcie ${index + 1}`, sourceEl });
    setSelectedImageIndex(index);
  };

  // Enhanced loading state with skeleton
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-300 absolute top-2 left-2"></div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <h3 className="text-white text-lg font-semibold mb-2">Ładowanie championów...</h3>
          <p className="text-gray-300 text-sm">Przygotowujemy dla Ciebie naszych wybitnych gołębi pocztowych</p>
        </motion.div>
        
        {/* Skeleton loading for carousel placeholders */}
        <div className="w-full max-w-[1600px] px-4 mt-8">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-700/50 rounded-lg animate-pulse">
                <div className="h-full bg-gradient-to-r from-gray-700/80 via-gray-600/80 to-gray-700/80 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // Error state with retry functionality
  if (error && champions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 px-4"
      >
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-white text-xl font-semibold mb-3">Wystąpił błąd</h3>
          <p className="text-gray-300 mb-6 text-sm leading-relaxed">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Ponawiam próbę...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Spróbuj ponownie
                </>
              )}
            </button>
            
            <p className="text-gray-400 text-xs">
              Próba {retryCount > 0 ? `${retryCount + 1}` : '1'} z 3
            </p>
          </div>
        </div>
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-black/50 text-gray-300 p-4 rounded-lg text-xs max-w-2xl">
            <strong>Debug info:</strong>
            <br />
            Champions loaded: {champions.length}
            <br />
            All images: {allImages.length}
            <br />
            Error: {error}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <>
      {/* Champions Carousel */}
      <ChampionsCarousel
        champions={champions}
        onImageClick={(src, idx, el) => handleImageClick(src, idx, el)}
        onPedigreeClick={pedigreeImage => {
          console.log('=== onPedigreeClick CALLED ===');
          console.log('Pedigree image received:', pedigreeImage);
          console.log('Setting selectedPedigreeImage to:', pedigreeImage);
          setSelectedPedigreeImage(pedigreeImage);
          console.log('selectedPedigreeImage set successfully');
          console.log('=== END onPedigreeClick ===');
        }}
        onCentralChampionChange={onCentralChampionChange}
      />

      {/* Image Modal - renderowany lokalnie */}
      {selectedImage && selectedImageIndex !== null && (
        <ImageModal
          image={{
            id: `champion-image-${selectedImageIndex}`,
            src: selectedImage.src,
            alt: selectedImage.alt,
          }}
          onClose={() => {
            setSelectedImage(null);
            setSelectedImageIndex(null);
          }}
          onPrevious={
            selectedImageIndex > 0
              ? () =>
                  handleImageClick(
                    allImages[selectedImageIndex - 1].src,
                    selectedImageIndex - 1,
                    undefined
                  )
              : undefined
          }
          onNext={
            selectedImageIndex < allImages.length - 1
              ? () =>
                  handleImageClick(
                    allImages[selectedImageIndex + 1].src,
                    selectedImageIndex + 1,
                    undefined
                  )
              : undefined
          }
          hasPrevious={selectedImageIndex > 0}
          hasNext={selectedImageIndex < allImages.length - 1}
          currentIndex={selectedImageIndex}
          totalImages={allImages.length}
          sourceElement={selectedImage.sourceEl || null}
        />
      )}

      {/* Pedigree Image Modal */}
      {selectedPedigreeImage && (
        <ImageModal
          image={{ id: 'pedigree-image', src: selectedPedigreeImage, alt: 'Rodowód championa' }}
          onClose={() => {
            console.log('Closing pedigree modal');
            setSelectedPedigreeImage(null);
          }}
        />
      )}

      {/* Warning for partial data with errors */}
      {error && champions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-yellow-200 text-sm font-medium">
                Część danych może być nieaktualna
              </p>
              <p className="text-yellow-300/80 text-xs mt-1">
                {error} - pokazujemy ostatnie dostępne dane
              </p>
            </div>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="ml-auto bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white text-xs px-3 py-1.5 rounded transition-colors"
            >
              Odśwież
            </button>
          </div>
        </motion.div>
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-4 right-4 bg-black/90 text-white p-3 rounded-lg text-xs z-50 max-w-xs backdrop-blur-sm"
        >
          <div className="space-y-1">
            <div>Status: {error ? '❌ Błąd' : '✅ OK'}</div>
            <div>Champions: {champions.length}</div>
            <div>Images: {allImages.length}</div>
            <div>Retry: {retryCount}</div>
            <div>Loading: {isLoading ? '⏳' : isRetrying ? '🔄' : '✅'}</div>
          </div>
        </motion.div>
      )}
    </>
  );
}
