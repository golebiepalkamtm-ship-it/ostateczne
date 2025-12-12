"use client";

import { useState, useEffect } from 'react';
import { useDragAndDropFileUpload } from '@/app/hooks/useFileUpload';
import {
  updateChampionGalleryItem,
  deleteChampionGalleryItem,
  reorderChampionGalleryItems,
  type FileUploadResult,
} from '@/app/actions/admin-storage';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface ChampionGalleryItem {
  id: string;
  imageUrl: string;
  title: string;
  description: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChampionGalleryManagerProps {
  items: ChampionGalleryItem[];
  onItemsChange?: (items: ChampionGalleryItem[]) => void;
}

interface NewItemData {
  title: string;
  description: string;
  file?: File;
}

export default function ChampionGalleryManager({
  items,
  onItemsChange,
}: ChampionGalleryManagerProps) {
  const [galleryItems, setGalleryItems] = useState<ChampionGalleryItem[]>(items);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // New items being added
  const [newItems, setNewItems] = useState<NewItemData[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

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
    maxFiles: 10,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    onUploadStart: () => {
      setIsLoading(true);
      resetState();
    },
    onUploadProgress: (progress) => {
      // Progress is handled by the hook
    },
    onUploadSuccess: async (files) => {
      if (files.length > 0) {
        toast.success(`Przesłano ${files.length} obrazów championów!`);
        
        // Reload gallery items
        await loadGalleryItems();
        setNewItems([]);
        setShowAddForm(false);
      }
      setIsLoading(false);
      clearSelectedFiles();
    },
    onUploadError: (error) => {
      toast.error(`Błąd: ${error}`);
      setIsLoading(false);
      clearSelectedFiles();
    },
  });

  // Update local state when props change
  useEffect(() => {
    setGalleryItems(items);
  }, [items]);

  const loadGalleryItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/gallery');
      
      if (response.ok) {
        const data = await response.json();
        const loadedItems = data.items as ChampionGalleryItem[];
        setGalleryItems(loadedItems);
        if (onItemsChange) {
          onItemsChange(loadedItems);
        }
      } else {
        console.error('Failed to load gallery items:', await response.text());
        toast.error('Błąd ładowania elementów galerii');
      }
    } catch (error) {
      console.error('Error loading gallery items:', error);
      toast.error('Błąd ładowania elementów galerii');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = async (id: string, title: string, description: string, isActive: boolean) => {
    try {
      const result = await updateChampionGalleryItem(id, title, description, isActive);
      
      if (result.success) {
        // Update local state
        setGalleryItems(prev => prev.map(item => 
          item.id === id 
            ? { ...item, title, description, isActive }
            : item,
        ));
        
        if (onItemsChange) {
          onItemsChange(galleryItems);
        }
        
        setEditingItem(null);
        toast.success('Element galerii został zaktualizowany');
      } else {
        toast.error(result.error || 'Błąd podczas aktualizacji');
      }
    } catch (error) {
      console.error('Error updating gallery item:', error);
      toast.error('Błąd podczas aktualizacji');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten element galerii?')) {
      return;
    }

    try {
      const result = await deleteChampionGalleryItem(id);
      
      if (result.success) {
        // Update local state
        setGalleryItems(prev => prev.filter(item => item.id !== id));
        
        if (onItemsChange) {
          onItemsChange(galleryItems.filter(item => item.id !== id));
        }
        
        toast.success('Element galerii został usunięty');
      } else {
        toast.error(result.error || 'Błąd podczas usuwania');
      }
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      toast.error('Błąd podczas usuwania');
    }
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDragEnd = async () => {
    if (dragIndex === null || dragOverIndex === null) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder items in local state
    const newItems = [...galleryItems];
    const draggedItem = newItems[dragIndex];
    newItems.splice(dragIndex, 1);
    newItems.splice(dragOverIndex, 0, draggedItem);

    // Update orders
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setGalleryItems(reorderedItems);

    // Save order to server
    try {
      const result = await reorderChampionGalleryItems(reorderedItems.map(item => item.id));
      
      if (result.success) {
        if (onItemsChange) {
          onItemsChange(reorderedItems);
        }
        toast.success('Kolejność została zaktualizowana');
      } else {
        toast.error(result.error || 'Błąd podczas zapisywania kolejności');
        // Reload original order on error
        await loadGalleryItems();
      }
    } catch (error) {
      console.error('Error reordering gallery items:', error);
      toast.error('Błąd podczas zapisywania kolejności');
      await loadGalleryItems();
    }

    setDragIndex(null);
    setDragOverIndex(null);
  };

  const addNewItemField = () => {
    setNewItems(prev => [...prev, { title: '', description: '' }]);
  };

  const updateNewItem = (index: number, field: keyof NewItemData, value: string | File) => {
    setNewItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item,
    ));
  };

  const removeNewItem = (index: number) => {
    setNewItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadNewItems = async () => {
    const validItems = newItems.filter(item => item.file && item.title.trim());
    
    if (validItems.length === 0) {
      toast.error('Dodaj przynajmniej jeden obraz z tytułem');
      return;
    }

    try {
      const files = validItems.map(item => item.file!);
      const titles = validItems.map(item => item.title);
      const descriptions = validItems.map(item => item.description);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: createFormData(files, 'champion', { titles, descriptions }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Przesłano ${result.summary?.successful || 0} obrazów`);
        await loadGalleryItems();
        setNewItems([]);
        setShowAddForm(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Błąd podczas przesyłania');
      }
    } catch (error) {
      console.error('Error uploading new items:', error);
      toast.error('Błąd podczas przesyłania plików');
    }
  };

  const createFormData = (files: File[], type: string, additionalData: Record<string, any>) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('type', type);
    
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
    });
    
    return formData;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Galeria Championów
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Dodaj Nowe
          </button>
        </div>
        
        <p className="text-gray-600">
          Zarządzaj galerią championów. Możesz dodawać nowe obrazy, edytować istniejące i zmieniać kolejność.
        </p>
      </div>

      {/* Add New Items Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Dodaj Nowe Elementy
          </h3>
          
          <div className="space-y-4">
            {newItems.map((item, index) => (
              <div key={index} className="flex space-x-4 p-3 bg-white rounded border">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Tytuł championa"
                    value={item.title}
                    onChange={(e) => updateNewItem(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <textarea
                    placeholder="Opis championa (opcjonalny)"
                    value={item.description}
                    onChange={(e) => updateNewItem(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                    rows={2}
                  />
                </div>
                <div className="w-48">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        updateNewItem(index, 'file', file);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  {item.file && (
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {item.file.name} ({formatFileSize(item.file.size)})
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeNewItem(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            
            <div className="flex space-x-2">
              <button
                onClick={addNewItemField}
                className="px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200"
              >
                Dodaj Kolejny
              </button>
              
              <button
                onClick={handleUploadNewItems}
                disabled={newItems.length === 0 || isUploading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors duration-200"
              >
                {isUploading ? 'Przesyłanie...' : 'Prześlij'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryItems.map((item, index) => (
          <div
            key={item.id}
            className={`bg-white border rounded-lg overflow-hidden shadow-sm transition-all duration-200 ${
              dragIndex === index ? 'opacity-50 transform scale-95' : ''
            } ${dragOverIndex === index ? 'border-blue-400 bg-blue-50' : ''}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => {
              e.preventDefault();
              handleDragOver(index);
            }}
            onDragEnd={handleDragEnd}
          >
            {/* Image */}
            <div className="relative h-48 bg-gray-100">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2">
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  #{item.order}
                </span>
              </div>
              {!item.isActive && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
                  <span className="text-white font-medium">Nieaktywny</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              {editingItem === item.id ? (
                <EditForm
                  item={item}
                  onSave={(title, description, isActive) => 
                    handleEditItem(item.id, title, description, isActive)
                  }
                  onCancel={() => setEditingItem(null)}
                />
              ) : (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {item.description}
                    </p>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingItem(item.id)}
                      className="flex-1 text-blue-600 hover:text-blue-800 text-sm font-medium py-1 px-2 border border-blue-600 rounded transition-colors duration-200"
                    >
                      Edytuj
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="flex-1 text-red-600 hover:text-red-800 text-sm font-medium py-1 px-2 border border-red-600 rounded transition-colors duration-200"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Drag Handle */}
            <div className="absolute top-2 left-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
              <div className="bg-white rounded p-1 shadow-sm cursor-move">
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z"></path>
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {galleryItems.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Brak elementów galerii</h3>
          <p className="mt-1 text-sm text-gray-500">Dodaj pierwszy element galerii championów.</p>
        </div>
      )}

      {/* Drag Instructions */}
      {galleryItems.length > 1 && (
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>Wskazówka:</strong> Przeciągnij elementy aby zmienić ich kolejność w galerii.
          </p>
        </div>
      )}
    </div>
  );
}

// Edit Form Component
function EditForm({
  item,
  onSave,
  onCancel,
}: {
  item: ChampionGalleryItem;
  onSave: (title: string, description: string, isActive: boolean) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || '');
  const [isActive, setIsActive] = useState(item.isActive);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(title, description, isActive);
    setIsSaving(false);
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
        placeholder="Tytuł"
      />
      
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
        rows={2}
        placeholder="Opis"
      />
      
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="mr-2"
        />
        <span className="text-sm text-gray-700">Aktywny</span>
      </label>
      
      <div className="flex space-x-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs py-1 px-2 rounded transition-colors duration-200"
        >
          {isSaving ? 'Zapisywanie...' : 'Zapisz'}
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 text-xs py-1 px-2 rounded transition-colors duration-200"
        >
          Anuluj
        </button>
      </div>
    </div>
  );
}