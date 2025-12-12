"use client";

import { useState, useEffect } from 'react';
import { useDragAndDropFileUpload } from '@/app/hooks/useFileUpload';
import { 
  uploadSystemBackgroundImage,
  type FileUploadResult, 
} from '@/app/actions/admin-storage';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface SystemSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
}

interface BackgroundImageManagerProps {
  currentBackgroundUrl?: string | null;
  onBackgroundUpdate?: (newUrl: string) => void;
}

export default function BackgroundImageManager({
  currentBackgroundUrl,
  onBackgroundUpdate,
}: BackgroundImageManagerProps) {
  const [setting, setSetting] = useState<SystemSetting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    dragActive,
    selectedFiles,
    isUploading,
    progress,
    error,
    success,
    handleDrag,
    handleDragIn,
    handleDragOut,
    handleDrop,
    handleFileSelect,
    uploadSelectedFiles,
    clearSelectedFiles,
    resetState,
  } = useDragAndDropFileUpload({
    maxFiles: 1,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    onUploadStart: () => {
      setIsUpdating(true);
      resetState();
    },
    onUploadProgress: (progress) => {
      // Progress is handled by the hook
    },
    onUploadSuccess: (files) => {
      if (files.length > 0) {
        const newUrl = files[0];
        if (onBackgroundUpdate) {
          onBackgroundUpdate(newUrl);
        }
        toast.success('Tło strony zostało zaktualizowane!');
      }
      setIsUpdating(false);
      clearSelectedFiles();
    },
    onUploadError: (error) => {
      toast.error(`Błąd: ${error}`);
      setIsUpdating(false);
      clearSelectedFiles();
    },
  });

  // Load current background setting
  useEffect(() => {
    loadBackgroundSetting();
  }, []);

  const loadBackgroundSetting = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/settings/background');
      
      if (response.ok) {
        const data = await response.json();
        setSetting(data.setting);
      } else {
        console.error('Failed to load background setting:', await response.text());
      }
    } catch (error) {
      console.error('Error loading background setting:', error);
      toast.error('Błąd ładowania ustawień tła');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBackground = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Wybierz obraz do przesłania');
      return;
    }

    try {
      // Use server action directly for better control
      const file = selectedFiles[0];
      const result = await uploadSystemBackgroundImage(file, 'admin');
      
      if (result.success && result.url) {
        if (onBackgroundUpdate) {
          onBackgroundUpdate(result.url);
        }
        toast.success('Tło strony zostało zaktualizowane!');
        clearSelectedFiles();
      } else {
        toast.error(result.error || 'Błąd podczas aktualizacji tła');
      }
    } catch (error) {
      console.error('Error updating background:', error);
      toast.error('Błąd podczas aktualizacji tła');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Zarządzanie Tłem Strony
        </h2>
        <p className="text-gray-600">
          Zaktualizuj tło strony głównej. Obraz zostanie automatycznie zoptymalizowany.
        </p>
      </div>

      {/* Current Background Preview */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Aktualne Tło
        </h3>
        {currentBackgroundUrl || setting?.value ? (
          <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={currentBackgroundUrl || setting?.value || ''}
              alt="Current background"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200"></div>
          </div>
        ) : (
          <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <span className="text-gray-500">Brak tła strony</span>
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Nowe Tło
        </h3>
        
        {/* Drag & Drop Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors duration-200 ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading || isUpdating}
          />
          
          <div className="text-center">
            {selectedFiles.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-600 font-medium">Plik wybrany</span>
                </div>
                <p className="text-sm text-gray-600">
                  {selectedFiles[0].name} ({formatFileSize(selectedFiles[0].size)})
                </p>
              </div>
            ) : (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium text-blue-600 hover:text-blue-500">
                    Kliknij aby wybrać plik
                  </span>{' '}
                  lub przeciągnij i upuść
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, WebP do 5MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Selected File Info */}
        {selectedFiles.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {selectedFiles[0].name}
                </p>
                <p className="text-xs text-blue-700">
                  {formatFileSize(selectedFiles[0].size)}
                </p>
              </div>
              <button
                onClick={clearSelectedFiles}
                disabled={isUploading || isUpdating}
                className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-700">Tło strony zostało zaktualizowane!</p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {(isUploading || isUpdating) && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Przesyłanie...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleUpdateBackground}
          disabled={selectedFiles.length === 0 || isUploading || isUpdating}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {isUploading || isUpdating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Aktualizowanie...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Zaktualizuj Tło
            </>
          )}
        </button>
        
        <button
          onClick={loadBackgroundSetting}
          disabled={isLoading || isUploading || isUpdating}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
        >
          Odśwież
        </button>
      </div>
    </div>
  );
}