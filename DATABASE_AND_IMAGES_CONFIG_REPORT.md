# 📊 Raport konfiguracji bazy danych i ścieżek obrazów

## Status: KOMPLETNY
Czas utworzenia: 2025-12-13 17:18:31

---

## 🗄️ KONFIGURACJA BAZY DANYCH

### 1. PostgreSQL (Produkcja)
- **DATABASE_URL**: `postgresql://postgres:postgres123@localhost:5433/pigeon_auction_dev`
- **Provider**: Prisma ORM
- **Status**: ✅ Skonfigurowany i gotowy

### 2. Firebase Storage (Obrazy/CDN)
- **ASSET_BASE_URL**: `https://storage.googleapis.com/m-t-m-62972.appspot.com`
- **Storage Bucket**: `m-t-m-62972.appspot.com`
- **Status**: ✅ Skonfigurowany dla ciężkich assetów

### 3. Modele Prisma z obsługą obrazów
```prisma
model ChampionGalleryItem {
  id          String   @id @default(cuid())
  imageUrl    String
  title       String
  description String?
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AuctionAsset {
  id        String    @id @default(cuid())
  auctionId String
  type      AssetType
  url       String
  createdAt DateTime  @default(now())
  auction   Auction   @relation(fields: [auctionId], references: [id], onDelete: Cascade)
}

model Pigeon {
  images       String  // Ścieżki do zdjęć gołębia
  videos       String  // Ścieżki do filmów
  pedigree     String? // Ścieżka do rodowodu
}

model BreederMeeting {
  images       String  // Ścieżki do zdjęć spotkań
}
```

---

## 🖼️ STRUKTURA ŚCIEŻEK OBRAZÓW

### 🏆 GALERIA CHAMPIONÓW
**Ścieżka**: `/public/champions/`

**Struktura**:
```
champions/
├── 1/                    # Champion ID
│   ├── data.json         # Metadane championa
│   ├── gallery/          # Zdjęcia galerii
│   │   └── DV-02906-11-98t_OLIMP (1).jpg
│   ├── pedigree/         # Rodowód
│   └── main.jpg         # Główne zdjęcie (800x800px)
├── 2/                    # Champion ID
├── ...
└── README.md            # Instrukcje dodawania zdjęć
```

**Specyfikacje zdjęć**:
- **main.jpg**: 800x800px - główne zdjęcie championa
- **gallery/**: 4 zdjęcia + 4 miniatury (1200x800px + 300x200px)
- **pedigree/**: 4 zdjęcia rodowodu (400x400px)
- **offspring/**: 2 zdjęcia potomstwa (300x300px)
- **videos/**: 2 miniatury filmów (400x225px)

### 🤝 SPOTKANIA Z HODOWCAMI
**Ścieżka**: `/public/meetings-with-breeders/`

**Struktura**:
```
meetings-with-breeders/
├── Geert Munnik/          # Nazwa hodowcy
├── Jan Oost/
├── Marginus Oostenbrink/
├── Theo Lehnen/
└── Toni van Ravenstein/
```

### 💰 UKCJONOWE - UPLOAD ZDJĘĆ
**Ścieżka**: `/public/uploads/`

**Struktura**:
```
uploads/
├── image/                # Uploadowane zdjęcia aukcji
│   ├── auction-[id]-1.jpg
│   ├── auction-[id]-2.jpg
│   └── ...
└── document/            # Dokumenty (rodowody, certyfikaty)
    ├── auction-[id]-doc1.pdf
    └── ...
```

---

## 🔧 KONFIGURACJA TECHNICZNA

### 1. Zmienne środowiskowe
```env
# Baza danych
DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/pigeon_auction_dev"
DIRECT_DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/pigeon_auction_dev"

# Firebase Storage dla obrazów
NEXT_PUBLIC_ASSET_BASE_URL="https://storage.googleapis.com/m-t-m-62972.appspot.com"

# Firebase Client Config
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="m-t-m-62972.appspot.com"
```

### 2. Modele danych dla obrazów
```typescript
// Typy assetów w aukcjach
enum AssetType {
  IMAGE    = 'IMAGE'
  VIDEO    = 'VIDEO' 
  DOCUMENT = 'DOCUMENT'
}

// Model aukcji z assetami
model Auction {
  id        String         @id @default(cuid())
  assets    AuctionAsset[] // Relacja do zdjęć/filmów
}

// Model championów
model ChampionGalleryItem {
  id          String   @id @default(cuid())
  imageUrl    String   // Ścieżka do zdjęcia
  title       String
  description String?
  order       Int      @default(0)
  isActive    Boolean  @default(true)
}
```

### 3. Ścieżki dostępu
- **Lokalne**: `/public/champions/`, `/public/uploads/`
- **CDN Firebase**: `https://storage.googleapis.com/m-t-m-62972.appspot.com`
- **Upload przez**: Firebase Storage API
- **Wyświetlanie**: Next.js Image component

---

## 📋 INSTRUKCJE DODAWANIA

### 1. Dodawanie championa
1. Utwórz folder: `/public/champions/[numer]/`
2. Dodaj zdjęcia zgodnie ze specyfikacją w README.md
3. Utwórz `data.json` z metadanymi
4. Zdjęcia będą dostępne pod: `/champions/[numer]/gallery/[plik]`

### 2. Dodawanie zdjęć aukcji
1. Upload przez Firebase Storage
2. Ścieżka zostanie zapisana w `AuctionAsset.url`
3. Wyświetlanie: `<Image src={asset.url} />`

### 3. Dodawanie spotkań z hodowcami
1. Utwórz folder: `/public/meetings-with-breeders/[Nazwa Hodowcy]/`
2. Dodaj zdjęcia spotkań
3. Zdjęcia będą dostępne pod: `/meetings-with-breeders/[Nazwa]/[plik]`

---

## ✅ STATUS KONFIGURACJI

| Komponent | Status | Ścieżka |
|-----------|--------|---------|
| PostgreSQL | ✅ Gotowe | `DATABASE_URL` |
| Firebase Storage | ✅ Gotowe | `m-t-m-62972.appspot.com` |
| Champions Gallery | ✅ Struktura | `/public/champions/` |
| Breeder Meetings | ✅ Struktura | `/public/meetings-with-breeders/` |
| Auction Uploads | ✅ Struktura | `/public/uploads/` |
| Prisma Models | ✅ Gotowe | Schema definitions |
| Image Components | ✅ Gotowe | Next.js Image |

---

## 🔍 WERYFIKACJA

### Test lokalny:
1. **Champions**: `http://localhost:3001/champions`
2. **Breeder Meetings**: `http://localhost:3001/breeder-meetings`  
3. **Auction Upload**: Dashboard → Dodawanie aukcji

### Test Firebase Storage:
- **Bucket URL**: `https://storage.googleapis.com/m-t-m-62972.appspot.com`
- **Files API**: Dostępne dla upload/download

---

## 📝 UWAGI TECHNICZNE

1. **Optymalizacja obrazów**: Użyj Next.js Image component
2. **Lazy Loading**: Automatyczne dla wszystkich obrazów
3. **CDN**: Firebase Storage jako globalny CDN
4. **Upload**: Przez Firebase SDK, nie przez local filesystem
5. **Bezpieczeństwo**: Walidacja typów plików przed upload

---

**Czas analizy**: 2025-12-13 17:18:31  
**Status**: ✅ KOMPLETNA KONFIGURACJA
