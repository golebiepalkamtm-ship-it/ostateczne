import { useState, useCallback } from 'react';

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

export interface UseFileUploadOptions {
  maxFiles?: number;
  maxFileSize?: number;
  acceptedTypes?: string[];
  onUploadStart?: () => void;
  onUploadProgress?: (progress: number) => void;
  onUploadSuccess?: (files: string[]) => void;
  onUploadError?: (error: string) => void;
}

/**
 * Reusable hook for file upload operations with Firebase Storage integration
 */
export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    maxFiles = 10,
    maxFileSize = 5 * 1024 * 1024, // 5MB default
    acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    onUploadStart,
    onUploadProgress,
    onUploadSuccess,
    onUploadError,
  } = options;

  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
  });

  const validateFiles = useCallback((files: File[]): string | null => {
    if (files.length === 0) {
      return 'Nie wybrano żadnych plików';
    }

    if (files.length > maxFiles) {
      return `Maksymalna liczba plików: ${maxFiles}`;
    }

    for (const file of files) {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        return `Nieprawidłowy typ pliku: ${file.name}. Dozwolone typy: ${acceptedTypes.join(', ')}`;
      }

      // Check file size
      if (file.size > maxFileSize) {
        return `Plik ${file.name} jest za duży. Maksymalny rozmiar: ${Math.round(maxFileSize / (1024 * 1024))}MB`;
      }
    }

    return null;
  }, [maxFiles, maxFileSize, acceptedTypes]);

  const uploadFiles = useCallback(async (
    files: File[],
    type: 'background' | 'champion',
    additionalData?: Record<string, any>,
  ) => {
    const validationError = validateFiles(files);
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError, success: false }));
      onUploadError?.(validationError);
      return;
    }

    setState({
      isUploading: true,
      progress: 0,
      error: null,
      success: false,
    });

    onUploadStart?.();

    try {
      const formData = new FormData();
      
      // Add files
      files.forEach(file => {
        formData.append('files', file);
      });

      // Add metadata
      formData.append('type', type);
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }

      // Add titles and descriptions for champion images
      if (type === 'champion' && additionalData?.titles && additionalData?.descriptions) {
        formData.append('titles', JSON.stringify(additionalData.titles));
        formData.append('descriptions', JSON.stringify(additionalData.descriptions));
      }

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas przesyłania plików');
      }

      const result = await response.json();

      setState({
        isUploading: false,
        progress: 100,
        error: null,
        success: true,
      });

      onUploadSuccess?.(result.files);
      onUploadProgress?.(100);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Błąd podczas przesyłania plików';
      
      setState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
        success: false,
      });

      onUploadError?.(errorMessage);
    }
  }, [validateFiles, onUploadStart, onUploadProgress, onUploadSuccess, onUploadError]);

  const resetState = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      success: false,
    });
  }, []);

  return {
    ...state,
    uploadFiles,
    resetState,
    validateFiles,
  };
}

/**
 * Hook for managing drag and drop file uploads
 */
export function useDragAndDropFileUpload(options: UseFileUploadOptions = {}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const fileUpload = useFileUpload(options);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  }, []);

  const uploadSelectedFiles = useCallback((
    type: 'background' | 'champion',
    additionalData?: Record<string, any>,
  ) => {
    fileUpload.uploadFiles(selectedFiles, type, additionalData);
  }, [selectedFiles, fileUpload]);

  const clearSelectedFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  return {
    ...fileUpload,
    dragActive,
    selectedFiles,
    handleDrag,
    handleDragIn,
    handleDragOut,
    handleDrop,
    handleFileSelect,
    uploadSelectedFiles,
    clearSelectedFiles,
  };
}

/**
 * Hook for image compression (optional enhancement)
 */
export function useImageCompression() {
  const [isCompressing, setIsCompressing] = useState(false);

  const compressImage = useCallback(async (file: File): Promise<File> => {
    setIsCompressing(true);
    
    try {
      // Dynamic import of browser-image-compression
      const imageCompression = await import('browser-image-compression');
      
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression.default(file, options);
      return compressedFile;
    } catch (error) {
      console.warn('Image compression failed, using original file:', error);
      return file;
    } finally {
      setIsCompressing(false);
    }
  }, []);

  return {
    isCompressing,
    compressImage,
  };
}