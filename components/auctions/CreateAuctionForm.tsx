'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { X, LucideImage, Video, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedCard } from '@/components/ui/UnifiedCard';
import { auctionCreateSchema } from '@/lib/validations/schemas';
import { debug, error, isDev } from '@/lib/logger';

// Typ dla danych formularza aukcji
type CreateAuctionFormData = z.infer<typeof auctionCreateSchema>;

// Typy dla plików
interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video' | 'document';
}

// Funkcja pomocnicza do tworzenia MediaFile
const createMediaFile = (file: File, type: 'image' | 'video' | 'document'): MediaFile => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  file,
  preview: type === 'image' ? URL.createObjectURL(file) : '',
  type,
});

interface CreateAuctionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showHeader?: boolean;
}

export default function CreateAuctionForm({
  onSuccess,
  onCancel,
  showHeader = true,
}: CreateAuctionFormProps) {
  const { user, dbUser, loading: authLoading } = useAuth();
  const router = useRouter();

  // Stan komponentu
  const [pigeonImages, setPigeonImages] = useState<MediaFile[]>([]);
  const [videos, setVideos] = useState<MediaFile[]>([]);
  const [pedigreeFiles, setPedigreeFiles] = useState<MediaFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [hasStartingPrice, setHasStartingPrice] = useState(true);
  const [hasBuyNowPrice, setHasBuyNowPrice] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: string;
    lon: string;
    display_name: string;
    address: {
      city?: string;
      town?: string;
      village?: string;
      county?: string;
      state?: string;
      country?: string;
      postcode?: string;
    };
  } | null>(null);

  // Hook formularza
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateAuctionFormData>({
    resolver: zodResolver(auctionCreateSchema),
    mode: 'onChange',
  });

  const watchedCategory = watch('category');

  // Funkcje obsługi dropzone
  const onDropPigeonImages = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => createMediaFile(file, 'image'));
    setPigeonImages(prev => [...prev, ...newFiles]);
  }, []);

  const onDropVideos = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => createMediaFile(file, 'video'));
    setVideos(prev => [...prev, ...newFiles]);
  }, []);

  const onDropPedigree = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      // Wykryj typ pliku na podstawie MIME type
      const isImage = file.type.startsWith('image/');
      const fileType = isImage ? 'image' : 'document';
      return createMediaFile(file, fileType);
    });
    setPedigreeFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Hooki dropzone
  const {
    getRootProps: getPigeonImagesRootProps,
    getInputProps: getPigeonImagesInputProps,
    isDragActive: isPigeonImagesDragActive,
  } = useDropzone({
    onDrop: onDropPigeonImages,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 8,
  });

  const {
    getRootProps: getVideosRootProps,
    getInputProps: getVideosInputProps,
    isDragActive: isVideosDragActive,
  } = useDropzone({
    onDrop: onDropVideos,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi'],
    },
    maxFiles: 3,
  });

  const {
    getRootProps: getPedigreeRootProps,
    getInputProps: getPedigreeInputProps,
    isDragActive: isPedigreeDragActive,
  } = useDropzone({
    onDrop: onDropPedigree,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 2,
  });

  // Funkcje usuwania plików
  const removePigeonImage = useCallback((id: string) => {
    setPigeonImages(prev => prev.filter(file => file.id !== id));
  }, []);

  const removeVideo = useCallback((id: string) => {
    setVideos(prev => prev.filter(file => file.id !== id));
  }, []);

  const removePedigreeFile = useCallback((id: string) => {
    setPedigreeFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  const openPreview = useCallback((imageUrl: string) => {
    setPreviewImage(imageUrl);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  const _refreshForm = useCallback(() => {
    // Resetuj tylko pola formularza, zachowaj pliki i stan checkboxów
    setValue('title', '');
    setValue('description', '');
    setValue('category', 'Pigeon');
    setValue('startingPrice', undefined);
    setValue('buyNowPrice', undefined);
    setValue('location', '');
    setValue('pigeon.ringNumber', '');
    setValue('pigeon.bloodline', '');
    setValue('pigeon.sex', undefined);
    setValue('pigeon.eyeColor', '');
    setValue('pigeon.featherColor', '');

    // Resetuj lokalizację
    setSelectedLocation(null);

    // Zachowaj checkboxy i pliki
    // hasStartingPrice, hasBuyNowPrice, pigeonImages, videos, pedigreeFiles pozostają
  }, [setValue]);

  // Sprawdź czy użytkownik może tworzyć aukcje - wymagany pełny poziom weryfikacji
  const canCreateAuctions = dbUser && ['USER_FULL_VERIFIED', 'ADMIN'].includes(dbUser.role);
  const missingFields: string[] = [];

  const onSubmit = async (data: CreateAuctionFormData) => {
    if (isDev) debug('🚀 ONSUBMIT STARTED!');
    if (isDev) debug('📝 Form data:', data);

    // Sprawdź wymagane pliki
    if (pigeonImages.length === 0) {
      toast.error('Dodaj przynajmniej jedno zdjęcie aukcji');
      return;
    }

    if (watchedCategory === 'Pigeon' && pedigreeFiles.length === 0) {
      toast.error('Dla aukcji gołębia wymagany jest rodowód');
      return;
    }

    setIsSubmitting(true);

    try {
      toast.loading('Przygotowywanie aukcji...', { id: 'auction-submit' });

      // Pobierz Firebase token dla autoryzacji (wymuś odświeżenie)
      const token = await user!.getIdToken(true);
      toast.loading('Pobieranie tokenów bezpieczeństwa...', { id: 'auction-submit' });

      // Pobierz CSRF token
      const csrfResponse = await fetch('/api/csrf');
      if (!csrfResponse.ok) {
        throw new Error('Nie udało się pobrać tokenu CSRF');
      }
      const { csrfToken } = await csrfResponse.json();

      // Upload files by category
      let uploadedImages: string[] = [];
      let uploadedVideos: string[] = [];
      let uploadedDocuments: string[] = [];

      // Upload pigeon images
      if (pigeonImages.length > 0) {
        toast.loading('Przesyłanie zdjęć...', { id: 'auction-submit' });
        const imageFormData = new FormData();
        imageFormData.append('type', 'image');
        imageFormData.append('csrfToken', csrfToken);
        pigeonImages.forEach(file => {
          imageFormData.append('files', file.file);
        });

        const imageResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: imageFormData,
        });

        if (imageResponse.ok) {
          const imageResult = await imageResponse.json();
          uploadedImages = imageResult.files || [];
          toast.loading('Zdjęcia przesłane pomyślnie', { id: 'auction-submit' });
        } else {
          const error = await imageResponse.json();
          error('Błąd uploadu obrazów:', error);
          throw new Error(`Błąd przesyłu zdjęć: ${error.message || 'Nieznany błąd'}`);
        }
      }

      // Upload videos
      if (videos.length > 0) {
        toast.loading('Przesyłanie filmów...', { id: 'auction-submit' });
        const videoFormData = new FormData();
        videoFormData.append('type', 'video');
        videoFormData.append('csrfToken', csrfToken);
        videos.forEach(file => {
          videoFormData.append('files', file.file);
        });

        const videoResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: videoFormData,
        });

        if (videoResponse.ok) {
          const videoResult = await videoResponse.json();
          uploadedVideos = videoResult.files || [];
          toast.loading('Filmy przesłane pomyślnie', { id: 'auction-submit' });
        } else {
          const error = await videoResponse.json();
          error('Błąd uploadu filmów:', error);
          throw new Error(`Błąd przesyłu filmów: ${error.message || 'Nieznany błąd'}`);
        }
      }

      // Upload pedigree documents
      if (pedigreeFiles.length > 0) {
        toast.loading('Przesyłanie dokumentów...', { id: 'auction-submit' });
        const pedigreeFormData = new FormData();
        pedigreeFormData.append('type', 'document');
        pedigreeFormData.append('csrfToken', csrfToken);
        pedigreeFiles.forEach(file => {
          pedigreeFormData.append('files', file.file);
        });

        const pedigreeResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: pedigreeFormData,
        });

        if (pedigreeResponse.ok) {
          const pedigreeResult = await pedigreeResponse.json();
          uploadedDocuments = pedigreeResult.files || [];
          toast.loading('Dokumenty przesłane pomyślnie', { id: 'auction-submit' });
        } else {
          const error = await pedigreeResponse.json();
          error('Błąd uploadu dokumentów:', error);
          throw new Error(`Błąd przesyłu dokumentów: ${error.message || 'Nieznany błąd'}`);
        }
      }

      const now = new Date();
      const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Domyślnie 7 dni

      const requestData = {
        csrfToken,
        title: data.title,
        description: data.description,
        category: data.category,
        startingPrice:
          hasStartingPrice && data.startingPrice && !isNaN(data.startingPrice)
            ? data.startingPrice
            : 0,
        buyNowPrice:
          hasBuyNowPrice && data.buyNowPrice && !isNaN(data.buyNowPrice)
            ? data.buyNowPrice
            : undefined,
        startTime: now.toISOString(),
        endTime: endTime.toISOString(),
        images: uploadedImages,
        videos: uploadedVideos,
        documents: uploadedDocuments,
        location: data.location || 'Nie podano',
        locationData: selectedLocation
          ? {
              lat: parseFloat(selectedLocation.lat),
              lon: parseFloat(selectedLocation.lon),
              displayName: selectedLocation.display_name,
              address: selectedLocation.address,
            }
          : null,
        // Dane specyficzne dla gołębi
        ...(data.category === 'Pigeon' && {
          pigeon: data.pigeon
            ? {
                ringNumber: data.pigeon.ringNumber,
                bloodline: data.pigeon.bloodline,
                sex: data.pigeon.sex,
                eyeColor: data.pigeon.eyeColor,
                featherColor: data.pigeon.featherColor,
                purpose: data.pigeon.purpose || [],
              }
            : undefined,
        }),
      };

      toast.loading('Tworzenie aukcji...', { id: 'auction-submit' });

      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result = await response.json();
        if (isDev) debug('✅ Aukcja utworzona pomyślnie:', result);

        toast.success('🎉 Aukcja została utworzona pomyślnie!', {
          id: 'auction-submit',
          duration: 5000,
        });

        if (onSuccess) {
          onSuccess();
        } else {
          // Jeśli nie ma callback, przekieruj do aukcji i odśwież
          router.push('/auctions');
          // Odśwież stronę po krótkim opóźnieniu żeby router zdążył przekierować
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      } else {
        const error = await response.json();
        error('❌ Błąd API:', error);
        throw new Error(error.message || 'Wystąpił błąd podczas tworzenia aukcji');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd';
      error('❌ Błąd podczas tworzenia aukcji:', err);

      toast.error(`❌ ${errorMessage}`, {
        id: 'auction-submit',
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <p>Ładowanie...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
        <p className="text-xs text-red-700">
          Musisz być zalogowany, aby utworzyć aukcję.
          <Link
            href="/auth/register"
            className="font-medium underline text-red-800 hover:text-red-900 ml-2"
          >
            Zarejestruj się
          </Link>
        </p>
      </div>
    );
  }

  if (!canCreateAuctions) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Weryfikacja profilu wymagana</strong>
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Aby utworzyć aukcję, musisz uzupełnić wszystkie dane w profilu i zweryfikować numer
              telefonu.
            </p>
            {missingFields.length > 0 && (
              <p className="text-sm text-yellow-700 mt-1">
                Brakujące pola: {missingFields.join(', ')}
              </p>
            )}
            <div className="mt-3">
              <Link
                href="/dashboard?tab=profile&edit=true"
                className="font-medium underline text-yellow-800 hover:text-yellow-900"
              >
                Uzupełnij profil
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Przycisk zamknięcia - poza UnifiedCard */}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="absolute -top-2 -right-2 z-[200] p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors text-white shadow-lg"
          aria-label="Zamknij formularz"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      <UnifiedCard
        variant="glass"
        glow={true}
        hover={true}
        className="p-4 max-w-6xl min-h-[400px] w-full mx-auto text-white relative"
      >
        <form
          onSubmit={handleSubmit(onSubmit, errors => {
            if (Object.keys(errors).length > 0) {
              toast.error('Wypełnij wszystkie wymagane pola formularza');
              console.error('Form validation errors:', errors);
            }
          })}
          className="p-1"
        >
          {showHeader && (
            <div className="mb-1">
              <h1 className="text-xl font-bold text-white mb-0">Utwórz nową aukcję</h1>
              <p className="text-white/70 text-sm">
                Wypełnij wszystkie wymagane pola i opublikuj swoją aukcję
              </p>
            </div>
          )}

          {/* Pola formularza w jednej linii, wyrównane */}
          <div className="space-y-1 mb-2">
            <div className="flex flex-row items-center gap-3">
              <label className="w-40 text-base font-semibold text-white/80">Tytuł aukcji *</label>
              <input
                type="text"
                {...register('title')}
                className="flex-1 px-3 py-1.5 text-lg font-semibold bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/50"
                placeholder="np. Młody gołąb wyścigowy"
              />
              {errors.title && <p className="text-red-400 text-sm ml-2">{errors.title.message}</p>}
            </div>
            <div className="flex flex-row items-center gap-3">
              <label className="w-40 text-base font-semibold text-white/80">Opis *</label>
              <textarea
                {...register('description')}
                rows={1}
                className="flex-1 px-3 py-1.5 text-lg font-semibold bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/50 resize-none"
                placeholder="Opisz szczegóły aukcji..."
              />
              {errors.description && (
                <p className="text-red-400 text-sm ml-2">{errors.description.message}</p>
              )}
            </div>
            <div className="flex flex-row items-center gap-3">
              <label className="w-40 text-base font-semibold text-white/80">Kategoria *</label>
              <select
                {...register('category')}
                className="flex-1 px-3 py-2 text-base bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              >
                <option value="Pigeon" className="bg-gray-800 text-white">
                  Gołąb
                </option>
                <option value="Equipment" className="bg-gray-800 text-white">
                  Sprzęt
                </option>
                <option value="Other" className="bg-gray-800 text-white">
                  Inne
                </option>
              </select>
              {errors.category && (
                <p className="text-red-400 text-sm ml-2">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Szczegóły dla gołębia */}
          {watchedCategory === 'Pigeon' && (
            <>
              <div className="grid grid-cols-2 gap-1.5 mb-1">
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-0.5">
                    Numer obrączki *
                  </label>
                  <input
                    type="text"
                    {...register('pigeon.ringNumber')}
                    className="w-full px-2 py-1 text-lg font-semibold bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/50"
                    placeholder="np. PL-12345-2023"
                  />
                  {errors.pigeon?.ringNumber && (
                    <p className="text-red-400 text-sm mt-0.5">
                      {errors.pigeon.ringNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-0.5">
                    Linia krwi *
                  </label>
                  <input
                    type="text"
                    {...register('pigeon.bloodline')}
                    className="w-full px-2 py-1 text-lg font-semibold bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/50"
                    placeholder="np. Van den Bulck"
                  />
                  {errors.pigeon?.bloodline && (
                    <p className="text-red-400 text-sm mt-0.5">{errors.pigeon.bloodline.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 mb-1">
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-0.5">Płeć *</label>
                  <select
                    {...register('pigeon.sex')}
                    className="w-full px-2 py-1.5 text-base bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="" className="bg-gray-800 text-white">
                      Wybierz
                    </option>
                    <option value="male" className="bg-gray-800 text-white">
                      Samiec
                    </option>
                    <option value="female" className="bg-gray-800 text-white">
                      Samica
                    </option>
                  </select>
                  {errors.pigeon?.sex && (
                    <p className="text-red-400 text-sm mt-0.5">{errors.pigeon.sex.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-0.5">
                    Kolor oczu
                  </label>
                  <select
                    {...register('pigeon.eyeColor')}
                    className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                  >
                    <option value="" className="bg-gray-800 text-white">
                      Wybierz
                    </option>
                    <option value="pearl" className="bg-gray-800 text-white">
                      Perłowy
                    </option>
                    <option value="bull" className="bg-gray-800 text-white">
                      Byczy
                    </option>
                    <option value="dark" className="bg-gray-800 text-white">
                      Ciemny
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-0.5">
                    Kolor upierzenia
                  </label>
                  <select
                    {...register('pigeon.featherColor')}
                    className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                  >
                    <option value="" className="bg-gray-800 text-white">
                      Wybierz
                    </option>
                    <option value="blue" className="bg-gray-800 text-white">
                      Niebieska
                    </option>
                    <option value="blue_speckled" className="bg-gray-800 text-white">
                      Niebieska nakrapiana
                    </option>
                    <option value="dark_speckled" className="bg-gray-800 text-white">
                      Ciemna nakrapiana
                    </option>
                    <option value="dark" className="bg-gray-800 text-white">
                      Ciemna
                    </option>
                    <option value="black" className="bg-gray-800 text-white">
                      Czarna
                    </option>
                    <option value="red_speckled" className="bg-gray-800 text-white">
                      Czerwona nakrapiana
                    </option>
                    <option value="red" className="bg-gray-800 text-white">
                      Czerwona
                    </option>
                    <option value="dun" className="bg-gray-800 text-white">
                      Płowa
                    </option>
                    <option value="white" className="bg-gray-800 text-white">
                      Biała
                    </option>
                    <option value="pied" className="bg-gray-800 text-white">
                      Szpakowata
                    </option>
                    <option value="blue_pied" className="bg-gray-800 text-white">
                      Niebieska pstra
                    </option>
                    <option value="blue_speckled_pied" className="bg-gray-800 text-white">
                      Niebieska nakrapiana pstra
                    </option>
                    <option value="dark_speckled_pied" className="bg-gray-800 text-white">
                      Ciemna nakrapiana pstra
                    </option>
                    <option value="dark_pied" className="bg-gray-800 text-white">
                      Ciemna pstra
                    </option>
                    <option value="black_pied" className="bg-gray-800 text-white">
                      Czarna pstra
                    </option>
                    <option value="red_speckled_pied" className="bg-gray-800 text-white">
                      Czerwona nakrapiana pstra
                    </option>
                    <option value="red_pied" className="bg-gray-800 text-white">
                      Czerwona pstra
                    </option>
                    <option value="dun_pied" className="bg-gray-800 text-white">
                      Płowa pstra
                    </option>
                    <option value="pied_pied" className="bg-gray-800 text-white">
                      Szpakowata pstra
                    </option>
                    <option value="red_pied_mix" className="bg-gray-800 text-white">
                      Czerwona szpakowata
                    </option>
                  </select>
                </div>
              </div>

              {/* Charakterystyka - Sekcja rozwijana */}
              <div className="mb-1 mt-1">
                <h3 className="text-base font-semibold text-white/80 mb-1 border-b border-white/20 pb-0.5">
                  Charakterystyka gołębia
                </h3>

                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">
                      Kolor oczu
                    </label>
                    <select
                      {...register('pigeon.eyeColor')}
                      className="w-full px-2 py-1 text-base bg-white/10 border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                    >
                      <option value="" className="bg-gray-800 text-white">
                        Wybierz
                      </option>
                      <option value="orange_yellow" className="bg-gray-800 text-white">
                        Pomarańczowy/żółty
                      </option>
                      <option value="dark_red" className="bg-gray-800 text-white">
                        Ciemnoczerwony
                      </option>
                      <option value="pearl_glass" className="bg-gray-800 text-white">
                        Perłowy ("glass")
                      </option>
                      <option value="dark" className="bg-gray-800 text-white">
                        Ciemny
                      </option>
                      <option value="amber" className="bg-gray-800 text-white">
                        Bursztynowy
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-0.5">
                      Witalność
                    </label>
                    <select
                      {...register('pigeon.vitality')}
                      className="w-full px-2 py-1 text-base bg-white/10 border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                    >
                      <option value="" className="bg-gray-800 text-white">
                        Wybierz
                      </option>
                      <option value="weak" className="bg-gray-800 text-white">
                        Słaby
                      </option>
                      <option value="average" className="bg-gray-800 text-white">
                        Przeciętny
                      </option>
                      <option value="strong" className="bg-gray-800 text-white">
                        Silny
                      </option>
                      <option value="very_strong" className="bg-gray-800 text-white">
                        Bardzo silny
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-0.5">
                      Długość
                    </label>
                    <select
                      {...register('pigeon.length')}
                      className="w-full px-2 py-1 text-base bg-white/10 border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                    >
                      <option value="" className="bg-gray-800 text-white">
                        Wybierz
                      </option>
                      <option value="short" className="bg-gray-800 text-white">
                        Krótki
                      </option>
                      <option value="medium" className="bg-gray-800 text-white">
                        Średni
                      </option>
                      <option value="long" className="bg-gray-800 text-white">
                        Długi
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-0.5">
                      Wytrzymałość
                    </label>
                    <select
                      {...register('pigeon.endurance')}
                      className="w-full px-2 py-1 text-base bg-white/10 border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                    >
                      <option value="" className="bg-gray-800 text-white">
                        Wybierz
                      </option>
                      <option value="weak" className="bg-gray-800 text-white">
                        Słaby
                      </option>
                      <option value="average" className="bg-gray-800 text-white">
                        Przeciętny
                      </option>
                      <option value="strong" className="bg-gray-800 text-white">
                        Silny
                      </option>
                      <option value="very_strong" className="bg-gray-800 text-white">
                        Bardzo silny
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-0.5">
                      Siła widełek
                    </label>
                    <select
                      {...register('pigeon.forkStrength')}
                      className="w-full px-2 py-1 text-base bg-white/10 border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                    >
                      <option value="" className="bg-gray-800 text-white">
                        Wybierz
                      </option>
                      <option value="weak" className="bg-gray-800 text-white">
                        Słaby
                      </option>
                      <option value="average" className="bg-gray-800 text-white">
                        Przeciętny
                      </option>
                      <option value="strong" className="bg-gray-800 text-white">
                        Silny
                      </option>
                      <option value="very_strong" className="bg-gray-800 text-white">
                        Bardzo silny
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-0.5">
                      Układ widełek
                    </label>
                    <select
                      {...register('pigeon.forkAlignment')}
                      className="w-full px-2 py-1 text-base bg-white/10 border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                    >
                      <option value="" className="bg-gray-800 text-white">
                        Wybierz
                      </option>
                      <option value="closed" className="bg-gray-800 text-white">
                        Zamknięty
                      </option>
                      <option value="slightly_open" className="bg-gray-800 text-white">
                        Lekko otwarty
                      </option>
                      <option value="open" className="bg-gray-800 text-white">
                        Otwarty
                      </option>
                      <option value="very_open" className="bg-gray-800 text-white">
                        Bardzo otwarty
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-0.5">
                      Mięśnie
                    </label>
                    <select
                      {...register('pigeon.muscles')}
                      className="w-full px-2 py-1 text-base bg-white/10 border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                    >
                      <option value="" className="bg-gray-800 text-white">
                        Wybierz
                      </option>
                      <option value="soft" className="bg-gray-800 text-white">
                        Miękki
                      </option>
                      <option value="flexible" className="bg-gray-800 text-white">
                        Giętki
                      </option>
                      <option value="firm" className="bg-gray-800 text-white">
                        Jędrny
                      </option>
                      <option value="hard" className="bg-gray-800 text-white">
                        Twardy
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-0.5">Balans</label>
                    <select
                      {...register('pigeon.balance')}
                      className="w-full px-2 py-1 text-base bg-white/10 border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                    >
                      <option value="" className="bg-gray-800 text-white">
                        Wybierz
                      </option>
                      <option value="poor" className="bg-gray-800 text-white">
                        Słaby
                      </option>
                      <option value="average" className="bg-gray-800 text-white">
                        Przeciętny
                      </option>
                      <option value="balanced" className="bg-gray-800 text-white">
                        Zbalansowany
                      </option>
                      <option value="excellent" className="bg-gray-800 text-white">
                        Doskonały
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-0.5">Plecy</label>
                    <select
                      {...register('pigeon.back')}
                      className="w-full px-2 py-1 text-base bg-white/10 border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                    >
                      <option value="" className="bg-gray-800 text-white">
                        Wybierz
                      </option>
                      <option value="weak" className="bg-gray-800 text-white">
                        Słaby
                      </option>
                      <option value="average" className="bg-gray-800 text-white">
                        Przeciętny
                      </option>
                      <option value="strong" className="bg-gray-800 text-white">
                        Silny
                      </option>
                      <option value="very_strong" className="bg-gray-800 text-white">
                        Bardzo silny
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Cena */}
          <div className="grid grid-cols-2 gap-1.5 mb-1 mt-1">
            <div>
              <div className="flex items-center space-x-2 mb-0.5">
                <input
                  type="checkbox"
                  checked={hasStartingPrice}
                  onChange={e => setHasStartingPrice(e.target.checked)}
                  className="text-blue-600 focus:ring-blue-500"
                  title="Zaznacz aby włączyć licytację"
                />
                <label className="text-sm font-medium text-white/70">Cena wywoławcza (zł)</label>
              </div>
              <input
                type="number"
                {...register('startingPrice', { valueAsNumber: true })}
                disabled={!hasStartingPrice}
                className={`w-full px-2 py-1 text-lg font-semibold border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-white/50 ${
                  !hasStartingPrice ? 'bg-white/5' : 'bg-white/10'
                }`}
              />
              {errors.startingPrice && (
                <p className="text-red-400 text-sm mt-1">{errors.startingPrice.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-0.5">
                <input
                  type="checkbox"
                  checked={hasBuyNowPrice}
                  onChange={e => setHasBuyNowPrice(e.target.checked)}
                  className="text-blue-600 focus:ring-blue-500"
                  title="Zaznacz aby włączyć opcję Kup teraz"
                />
                <label className="text-sm font-medium text-white/70">Cena Kup teraz (zł)</label>
              </div>
              <input
                type="number"
                {...register('buyNowPrice', { valueAsNumber: true })}
                disabled={!hasBuyNowPrice}
                className={`w-full px-2 py-1 text-lg font-semibold border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-white/50 ${
                  !hasBuyNowPrice ? 'bg-white/5' : 'bg-white/10'
                }`}
              />
              {errors.buyNowPrice && (
                <p className="text-red-400 text-sm mt-1">{errors.buyNowPrice.message}</p>
              )}
            </div>
          </div>

          {/* Czas trwania aukcji - usunięty, domyślnie 7 dni */}

          {/* Upload plików */}
          <div className="mb-1">
            <h2 className="text-sm font-medium text-white/70 mb-1">Pliki *</h2>

            <div className="grid grid-cols-2 gap-2">
              {/* Lewa kolumna - zdjęcia i filmy */}
              <div>
                <h2 className="text-sm font-medium text-white/70 mb-1">Zdjęcia i filmy *</h2>
                <div className="flex gap-1.5">
                  {/* Zdjęcia gołębia */}
                  <div
                    {...getPigeonImagesRootProps()}
                    className={`flex-1 border-2 border-dashed rounded-lg p-1.5 text-center cursor-pointer transition-all duration-200 ${
                      isPigeonImagesDragActive
                        ? 'border-blue-400 bg-blue-500/20'
                        : 'border-white/20 bg-white/5 hover:border-blue-400 hover:bg-blue-500/10'
                    }`}
                  >
                    <input {...getPigeonImagesInputProps()} />
                    <LucideImage className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <p className="text-xs text-white/70 font-medium">Zdjęcia</p>
                    <p className="text-xs text-white/50">({pigeonImages.length}/8)</p>
                  </div>

                  {/* Filmy */}
                  <div
                    {...getVideosRootProps()}
                    className={`flex-1 border-2 border-dashed rounded-lg p-1.5 text-center cursor-pointer transition-all duration-200 ${
                      isVideosDragActive
                        ? 'border-blue-400 bg-blue-500/20'
                        : 'border-white/20 bg-white/5 hover:border-blue-400 hover:bg-blue-500/10'
                    }`}
                  >
                    <input {...getVideosInputProps()} />
                    <Video className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <p className="text-xs text-white/70 font-medium">Filmy</p>
                    <p className="text-xs text-white/50">({videos.length}/3)</p>
                  </div>
                </div>

                {/* Miniaturki zdjęć gołębia */}
                {pigeonImages.length > 0 && (
                  <div className="mt-1">
                    <div className="space-y-1">
                      {pigeonImages.map(file => (
                        <div key={file.id} className="relative group flex items-center space-x-2">
                          <div
                            className="w-8 h-8 relative rounded overflow-hidden bg-white/10 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openPreview(file.preview)}
                            title="Kliknij aby powiększyć"
                          >
                            <Image
                              src={file.preview}
                              alt="Preview"
                              width={100}
                              height={100}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-xs text-white/70 truncate flex-1">
                            {file.file.name}
                          </span>
                          <button
                            onClick={() => removePigeonImage(file.id)}
                            className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            title="Usuń"
                          >
                            <X className="w-2 h-2" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Prawa kolumna - rodowód */}
              <div>
                <h2 className="text-sm font-medium text-white/70 mb-1">Rodowód *</h2>
                {watchedCategory === 'Pigeon' && (
                  <div
                    {...getPedigreeRootProps()}
                    className={`border-2 border-dashed rounded-lg p-1.5 text-center cursor-pointer transition-all duration-200 ${
                      isPedigreeDragActive
                        ? 'border-blue-400 bg-blue-500/20'
                        : 'border-white/20 bg-white/5 hover:border-blue-400 hover:bg-blue-500/10'
                    }`}
                  >
                    <input {...getPedigreeInputProps()} />
                    <FileText className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <p className="text-xs text-white/70 font-medium">Rodowód</p>
                    <p className="text-xs text-white/50">({pedigreeFiles.length}/2)</p>
                  </div>
                )}

                {/* Miniaturki rodowodu */}
                {pedigreeFiles.length > 0 && watchedCategory === 'Pigeon' && (
                  <div className="mt-1">
                    <div className="space-y-1">
                      {pedigreeFiles.map(file => (
                        <div key={file.id} className="relative group flex items-center space-x-2">
                          <div
                            className={`w-8 h-8 relative rounded overflow-hidden bg-white/10 flex-shrink-0 ${file.type === 'image' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                            onClick={
                              file.type === 'image' ? () => openPreview(file.preview) : undefined
                            }
                            title={file.type === 'image' ? 'Kliknij aby powiększyć' : undefined}
                          >
                            {file.type === 'image' ? (
                              <Image
                                src={file.preview}
                                alt="Preview"
                                width={100}
                                height={100}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-white/50 text-xs">PDF</span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-white/70 truncate flex-1">
                            {file.file.name}
                          </span>
                          <button
                            onClick={() => removePedigreeFile(file.id)}
                            className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            title="Usuń"
                          >
                            <X className="w-2 h-2" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Podgląd plików */}
            {videos.length > 0 && (
              <div className="mt-1 space-y-1">
                <div>
                  <p className="text-xs text-white/50 mb-1">Filmy:</p>
                  <div className="space-y-1">
                    {videos.map(file => (
                      <div key={file.id} className="relative group flex items-center space-x-2">
                        <div className="w-8 h-8 relative rounded overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                          <Video className="w-4 h-4 text-white/50" />
                        </div>
                        <span className="text-xs text-white/70 truncate flex-1">
                          {file.file.name}
                        </span>
                        <button
                          onClick={() => removeVideo(file.id)}
                          className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          title="Usuń"
                        >
                          <X className="w-2 h-2" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="flex justify-end mt-2 pt-2 border-t border-white/10">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isSubmitting ? 'Publikuję...' : 'Opublikuj aukcję'}
            </button>
          </div>
        </form>

        {/* Modal z podglądem obrazu */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={closePreview}
          >
            <div className="relative max-w-4xl max-h-4xl p-4">
              <button
                onClick={closePreview}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center z-10"
                title="Zamknij"
              >
                <X className="w-4 h-4" />
              </button>
              <Image
                src={previewImage}
                alt="Podgląd"
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </UnifiedCard>
    </div>
  );
}
