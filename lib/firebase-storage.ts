/**
 * Firebase Storage Helpers
 * 
 * Zapewnia funkcje do generowania publicznych URL dla plików w Firebase Storage.
 * Używane gdy folder public/ nie jest deployowany z buildem (optymalizacja rozmiaru).
 * 
 * @module lib/firebase-storage
 */

import { getStorage, ref, getDownloadURL } from 'firebase/storage'
import { app } from '@/lib/firebase'

/**
 * Zwraca publiczny URL dla pliku w Firebase Storage
 * 
 * @param storagePath - Ścieżka do pliku w Firebase Storage (np. 'images/logo.png')
 * @returns Promise z publicznym URL do pliku
 * 
 * @example
 * ```typescript
 * const logoUrl = await getFirebaseStorageUrl('images/logo.png')
 * // Returns: https://firebasestorage.googleapis.com/v0/b/...
 * ```
 */
export async function getFirebaseStorageUrl(storagePath: string): Promise<string> {
  try {
    const storage = getStorage(app ?? undefined)
    const fileRef = ref(storage, storagePath)
    const url = await getDownloadURL(fileRef)
    return url
  } catch (error) {
    console.error(`[Firebase Storage] Error getting URL for ${storagePath}:`, error)
    throw new Error(`Failed to get Firebase Storage URL: ${storagePath}`)
  }
}

/**
 * Synchroniczna wersja - zwraca konstruowany URL bez weryfikacji
 * Używaj tylko gdy wiesz, że plik istnieje w Storage
 * 
 * @param storagePath - Ścieżka do pliku w Firebase Storage
 * @returns Publiczny URL (bez weryfikacji istnienia pliku)
 * 
 * @example
 * ```typescript
 * const logoUrl = getFirebaseStorageUrlSync('images/logo.png')
 * // Returns: https://firebasestorage.googleapis.com/v0/b/.../o/images%2Flogo.png?alt=media
 * ```
 */
export function getFirebaseStorageUrlSync(storagePath: string): string {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  const publicAssetBase = process.env.NEXT_PUBLIC_ASSET_BASE_URL || ''

  // If a public CDN/base URL is configured (e.g. storage.googleapis.com/<bucket>),
  // use it to construct a simple, predictable URL without calling Firebase APIs.
  if (publicAssetBase) {
    // Ensure no trailing slash on base
    const base = publicAssetBase.replace(/\/$/, '')
    // Remove leading slash from storagePath
    const path = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath
    return `${base}/${path}`
  }

  if (!bucketName) {
    console.error('[Firebase Storage] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not configured')
    return ''
  }

  // Encode path for Firebase Storage API URL
  const encodedPath = encodeURIComponent(storagePath)

  // Construct public URL via Firebase Storage HTTP endpoint
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`
}

/**
 * Konwertuje lokalną ścieżkę /public/... na Firebase Storage URL
 * 
 * @param publicPath - Ścieżka zaczynająca się od /public/ lub /
 * @returns Firebase Storage URL
 * 
 * @example
 * ```typescript
 * const url = convertPublicPathToStorageUrl('/public/images/logo.png')
 * // Returns: https://firebasestorage.googleapis.com/.../public/images/logo.png
 * 
 * const url2 = convertPublicPathToStorageUrl('/logo.png')
 * // Returns: https://firebasestorage.googleapis.com/.../public/logo.png
 * ```
 */
export function convertPublicPathToStorageUrl(publicPath: string): string {
  // Remove leading slash if present
  let cleanPath = publicPath.startsWith('/') ? publicPath.slice(1) : publicPath

  // If path doesn't start with 'public/', add it
  if (!cleanPath.startsWith('public/')) {
    cleanPath = `public/${cleanPath}`
  }

  // In development, use local URLs from public/ folder
  if (process.env.NODE_ENV === 'development') {
    const localPath = cleanPath.replace('public/', '')
    // Ensure proper URL encoding for spaces and special characters
    return `/${encodeURIComponent(localPath).replace(/%2F/g, '/')}`
  }

  return getFirebaseStorageUrlSync(cleanPath)
}

/**
 * Hook React do ładowania URL z Firebase Storage
 * 
 * @param storagePath - Ścieżka do pliku w Firebase Storage
 * @returns { url: string | null, loading: boolean, error: Error | null }
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { url, loading, error } = useFirebaseStorageUrl('images/logo.png')
 *   
 *   if (loading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   
 *   return <img src={url} alt="Logo" />
 * }
 * ```
 */
export function useFirebaseStorageUrl(storagePath: string | null) {
  const [url, setUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  
  React.useEffect(() => {
    if (!storagePath) {
      setUrl(null)
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    getFirebaseStorageUrl(storagePath)
      .then(setUrl)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [storagePath])
  
  return { url, loading, error }
}

// Re-export React for hook
import React from 'react'
