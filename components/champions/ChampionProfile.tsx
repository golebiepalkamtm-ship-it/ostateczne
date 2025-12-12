'use client';

import ImageModal from '@/components/ImageModal';
import Image from 'next/image';
import { useState } from 'react';
import { debug, isDev } from '@/lib/logger';

interface Champion {
  id: string;
  images: string[];
  pedigreeImage?: string;
  [key: string]: any; // Allow additional properties
}

interface ChampionProfileProps {
  champion: Champion;
}

export function ChampionProfile({ champion }: ChampionProfileProps) {
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; sourceEl?: HTMLElement } | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedPedigreeImage, setSelectedPedigreeImage] = useState<string | null>(null);

  const handleImageClick = (imageSrc: string, index: number, sourceEl?: HTMLElement) => {
    console.log('handleImageClick - sourceEl:', sourceEl);
    setSelectedImage({ src: imageSrc, alt: `Zdjęcie ${index + 1}`, sourceEl });
    setSelectedImageIndex(index);
  };

  const allImages = champion.images?.map((src, index) => ({ src, alt: `Zdjęcie ${index + 1}` })) || [];

  if (isDev) debug('ChampionProfile - champion data:', champion);

  return (
    <div className="container mx-auto px-4 pt-4 pb-8">
      {/* Champion Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Champion {champion.id}
        </h1>
        <div className="text-gray-300">
          Profil championa gołębia pocztowego
        </div>
      </div>

      {/* Champion Images Gallery */}
      {champion.images && champion.images.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Galeria</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {champion.images.map((image, index) => (
              <div
                key={index}
                className="relative group cursor-pointer overflow-hidden rounded-lg"
                onClick={(e) => handleImageClick(image, index, e.currentTarget)}
              >
                <Image
                  src={image}
                  alt={`Zdjęcie ${index + 1}`}
                  width={400}
                  height={256}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Kliknij, aby powiększyć
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pedigree Section */}
      {champion.pedigreeImage && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Rodowód</h2>
          <div
            className="relative group cursor-pointer overflow-hidden rounded-lg inline-block"
            onClick={() => setSelectedPedigreeImage(champion.pedigreeImage!)}
          >
            <Image
              src={champion.pedigreeImage}
              alt="Rodowód championa"
              width={600}
              height={400}
              className="w-full max-w-md h-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
              <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Kliknij, aby powiększyć
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Champion Details */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Szczegóły</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-gray-400">ID:</span>
            <span className="text-white ml-2">{champion.id}</span>
          </div>
          {champion.name && (
            <div>
              <span className="text-gray-400">Nazwa:</span>
              <span className="text-white ml-2">{champion.name}</span>
            </div>
          )}
          {champion.year && (
            <div>
              <span className="text-gray-400">Rok:</span>
              <span className="text-white ml-2">{champion.year}</span>
            </div>
          )}
          {champion.category && (
            <div>
              <span className="text-gray-400">Kategoria:</span>
              <span className="text-white ml-2">{champion.category}</span>
            </div>
          )}
        </div>
        
        {/* Additional champion data */}
        {Object.entries(champion).map(([key, value]) => {
          if (key === 'id' || key === 'images' || key === 'pedigreeImage') return null;
          if (typeof value === 'string' || typeof value === 'number') {
            return (
              <div key={key} className="mt-2">
                <span className="text-gray-400">{key}:</span>
                <span className="text-white ml-2">{value}</span>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Image Modal - Gallery Images */}
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
                    undefined,
                  )
              : undefined
          }
          onNext={
            selectedImageIndex < allImages.length - 1
              ? () =>
                  handleImageClick(
                    allImages[selectedImageIndex + 1].src,
                    selectedImageIndex + 1,
                    undefined,
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
    </div>
  );
}