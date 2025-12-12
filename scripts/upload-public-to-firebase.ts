/**
 * Upload Public Folder to Firebase Storage
 * 
 * Skrypt do uploadowania całego folderu public/ do Firebase Storage.
 * Używany przed deploymentem aby zredukować rozmiar buildu.
 * 
 * @usage
 * ```bash
 * # Upload wszystkich plików
 * npx tsx scripts/upload-public-to-firebase.ts
 * 
 * # Dry run (tylko pokazuje co zostanie uploadowane)
 * npx tsx scripts/upload-public-to-firebase.ts --dry-run
 * 
 * # Force overwrite (nadpisz istniejące pliki)
 * npx tsx scripts/upload-public-to-firebase.ts --force
 * ```
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

// Kolory dla terminala
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}

// Parsuj argumenty CLI
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const forceOverwrite = args.includes('--force')

// Inicjalizacja Firebase Admin
function initFirebase() {
  try {
    // Opcja 1: Załaduj z firebase-key.json (jeśli istnieje)
    let serviceAccount: any
    try {
      serviceAccount = JSON.parse(readFileSync('firebase-key.json', 'utf8'))
    } catch {
      // Opcja 2: Użyj zmiennych środowiskowych (.env.prod)
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
      
      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
          'Firebase credentials not found. Either:\n' +
          '  1. Create firebase-key.json in project root, OR\n' +
          '  2. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env',
        )
      }
      
      serviceAccount = {
        project_id: projectId,
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'), // Konwertuj escaped newlines
      }
      
      console.log(`${colors.cyan}ℹ${colors.reset} Using Firebase credentials from environment variables`)
    }
    
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || serviceAccount.project_id + '.firebasestorage.app',
    })
    
    console.log(`${colors.green}✓${colors.reset} Firebase Admin SDK initialized`)
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Failed to initialize Firebase Admin SDK`)
    console.error(`  ${error instanceof Error ? error.message : 'Unknown error'}`)
    process.exit(1)
  }
}

// Pobierz wszystkie pliki rekursywnie
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = readdirSync(dirPath)

  files.forEach((file) => {
    const filePath = join(dirPath, file)
    
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles)
    } else {
      arrayOfFiles.push(filePath)
    }
  })

  return arrayOfFiles
}

// Określ Content-Type na podstawie rozszerzenia
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    // Documents
    pdf: 'application/pdf',
    json: 'application/json',
    xml: 'application/xml',
    // Text
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    // Fonts
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    // Other
    zip: 'application/zip',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
  }
  
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

// Upload pojedynczego pliku
async function uploadFile(
  localPath: string,
  storagePath: string,
  bucket: any,
): Promise<boolean> {
  try {
    const fileBuffer = readFileSync(localPath)
    const file = bucket.file(storagePath)
    
    // Sprawdź czy plik już istnieje
    if (!forceOverwrite) {
      const [exists] = await file.exists()
      if (exists) {
        console.log(`  ${colors.yellow}⊘${colors.reset} ${storagePath} (already exists, use --force to overwrite)`)
        return false
      }
    }
    
    if (isDryRun) {
      console.log(`  ${colors.cyan}⊙${colors.reset} ${storagePath} (dry run)`)
      return true
    }
    
    // Upload pliku
    await file.save(fileBuffer, {
      metadata: {
        contentType: getContentType(localPath),
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
      public: true, // Make file publicly accessible
    })
    
    console.log(`  ${colors.green}✓${colors.reset} ${storagePath}`)
    return true
  } catch (error) {
    console.error(`  ${colors.red}✗${colors.reset} ${storagePath}`)
    console.error(`    Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

// Main function
async function main() {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.blue}   Upload Public Folder to Firebase Storage${colors.reset}`)
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)
  
  if (isDryRun) {
    console.log(`${colors.yellow}ℹ Dry run mode - no files will be uploaded${colors.reset}\n`)
  }
  
  if (forceOverwrite) {
    console.log(`${colors.yellow}⚠ Force mode - existing files will be overwritten${colors.reset}\n`)
  }
  
  // Inicjalizuj Firebase
  initFirebase()
  
  const bucket = getStorage().bucket()
  const publicDir = join(process.cwd(), 'public')
  
  // Pobierz wszystkie pliki
  console.log(`\n${colors.cyan}Scanning public/ folder...${colors.reset}`)
  const allFiles = getAllFiles(publicDir)
  console.log(`Found ${allFiles.length} files\n`)
  
  if (allFiles.length === 0) {
    console.log(`${colors.yellow}No files to upload${colors.reset}`)
    return
  }
  
  // Upload wszystkich plików
  console.log(`${colors.cyan}Uploading files...${colors.reset}\n`)
  
  let uploaded = 0
  let skipped = 0
  let failed = 0
  
  for (const localPath of allFiles) {
    const relativePath = relative(process.cwd(), localPath)
    const storagePath = relativePath.replace(/\\/g, '/') // Windows path fix
    
    const success = await uploadFile(localPath, storagePath, bucket)
    
    if (success) {
      uploaded++
    } else if (!forceOverwrite) {
      skipped++
    } else {
      failed++
    }
  }
  
  // Podsumowanie
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.blue}   Summary${colors.reset}`)
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)
  console.log(`  ${colors.green}Uploaded:${colors.reset} ${uploaded}`)
  if (skipped > 0) {
    console.log(`  ${colors.yellow}Skipped:${colors.reset}  ${skipped}`)
  }
  if (failed > 0) {
    console.log(`  ${colors.red}Failed:${colors.reset}   ${failed}`)
  }
  console.log()
  
  if (!isDryRun) {
    console.log(`${colors.green}✓ Upload complete!${colors.reset}`)
    console.log(`\nFiles are now publicly accessible via Firebase Storage`)
    console.log(`Your app will automatically load images from Firebase Storage\n`)
  } else {
    console.log(`${colors.cyan}ℹ Dry run complete - run without --dry-run to upload${colors.reset}\n`)
  }
}

// Run script
main().catch((error) => {
  console.error(`\n${colors.red}✗ Upload failed:${colors.reset}`, error)
  process.exit(1)
})
