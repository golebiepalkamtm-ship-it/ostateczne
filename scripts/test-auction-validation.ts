/**
 * Skrypt diagnostyczny do testowania walidacji aukcji
 * Uruchom: npx tsx scripts/test-auction-validation.ts
 */

import { z } from 'zod';
import { auctionCreateSchema } from '../lib/validations/schemas';

// Import the API schema directly from the route file
// Since baseAuctionSchema is not exported, we'll recreate it here to match the API
const baseAuctionSchema = z
  .object({
    title: z
      .string()
      .min(5, 'Tytuł musi mieć co najmniej 5 znaków')
      .max(200, 'Tytuł może mieć maksymalnie 200 znaków'),
    description: z
      .string()
      .min(20, 'Opis musi mieć co najmniej 20 znaków')
      .max(2000, 'Opis może mieć maksymalnie 2000 znaków'),
    category: z.string().min(1, 'Kategoria jest wymagana'),
    startingPrice: z.number().min(0, 'Wartość nie może być ujemna').optional(),
    buyNowPrice: z.number().min(0, 'Wartość nie może być ujemna').optional(),
    reservePrice: z.number().min(0, 'Wartość nie może być ujemna').optional(),
    startTime: z.string().datetime('Nieprawidłowa data rozpoczęcia'),
    endTime: z.string().datetime('Nieprawidłowa data zakończenia'),
    images: z.array(z.string().min(1, 'URL obrazu nie może być pusty')).optional(),
    videos: z.array(z.string().min(1, 'URL wideo nie może być pusty')).optional(),
    documents: z.array(z.string().min(1, 'URL dokumentu nie może być pusty')).optional(),
    location: z.string().optional(),
    locationData: z.any().optional(),
    pigeon: z
      .object({
        ringNumber: z.string().min(1, 'Numer obrączki jest wymagany dla gołębia'),
        bloodline: z.string().min(1, 'Linia krwi jest wymagana dla gołębia'),
        sex: z.enum(['male', 'female'], { message: 'Płeć jest wymagana dla gołębia' }),
        eyeColor: z.string().optional(),
        featherColor: z.string().optional(),
        purpose: z.array(z.string()).optional(),
        // Additional characteristics
        vitality: z.string().optional(),
        length: z.string().optional(),
        endurance: z.string().optional(),
        forkStrength: z.string().optional(),
        forkAlignment: z.string().optional(),
        muscles: z.string().optional(),
        balance: z.string().optional(),
        back: z.string().optional(),
      })
      .optional(),
    csrfToken: z.string().min(1, 'Token CSRF jest wymagany'),
  })
  .refine(
    data => {
      if (data.buyNowPrice && data.startingPrice) {
        return data.buyNowPrice >= data.startingPrice;
      }
      return true;
    },
    {
      message: 'Cena kup teraz musi być większa lub równa cenie startowej',
      path: ['buyNowPrice'],
    },
  )
  .refine(
    data => {
      if (data.category === 'Pigeon') {
        return data.pigeon && data.pigeon.ringNumber && data.pigeon.bloodline && data.pigeon.sex;
      }
      return true;
    },
    {
      message: 'Dla aukcji gołębia wymagane są: numer obrączki, linia krwi i płeć',
      path: ['pigeon'],
    },
  );

console.log('\n🔍 DIAGNOSTYKA WALIDACJI AUKCJI\n');
console.log('='.repeat(60));

// Testowe dane z formularza (symulacja danych z CreateAuctionForm)
const now = new Date();
const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

const testData = {
  csrfToken: 'test-csrf-token',
  title: 'Test gołąb wyścigowy',
  description: 'To jest testowy opis aukcji który ma więcej niż 20 znaków',
  category: 'Pigeon',
  startingPrice: 100,
  buyNowPrice: 500,
  startTime: now.toISOString(),
  endTime: endTime.toISOString(),
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  videos: [],
  documents: ['https://example.com/doc1.pdf'],
  location: 'Warszawa',
  locationData: null,
  pigeon: {
    ringNumber: 'PL-12345-2023',
    bloodline: 'Van den Bulck',
    sex: 'male' as const,
    eyeColor: 'pearl',
    featherColor: 'blue',
    purpose: ['Krótki dystans'],
  },
};

console.log('\n📋 DANE TESTOWE:');
console.log(JSON.stringify(testData, null, 2));

console.log('\n' + '='.repeat(60));
console.log('\n✅ TEST 1: Walidacja schema klienta (auctionCreateSchema)\n');

try {
  const _clientResult = auctionCreateSchema.parse(testData);
  console.log('✅ SUKCES - dane przeszły walidację kliencką');
} catch (err) {
  if (err instanceof z.ZodError) {
    console.log('❌ BŁĄD - dane NIE przeszły walidacji klienta:');
    err.issues.forEach(issue => {
      console.log(`   - Pole: ${issue.path.join('.')} | Błąd: ${issue.message}`);
    });
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n✅ TEST 2: Walidacja schema API (baseAuctionSchema)\n');

try {
  const _apiResult = baseAuctionSchema.parse(testData);
  console.log('✅ SUKCES - dane przeszły walidację API');
} catch (err) {
  if (err instanceof z.ZodError) {
    console.log('❌ BŁĄD - dane NIE przeszły walidacji API:');
    err.issues.forEach(issue => {
      console.log(`   - Pole: ${issue.path.join('.')} | Błąd: ${issue.message}`);
    });
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n🔍 TEST 3: Porównanie schematów\n');

const clientFields = Object.keys(auctionCreateSchema.shape);
const apiFields = Object.keys(baseAuctionSchema.shape);

console.log('📝 Pola w schema klienta:', clientFields.length);
console.log('📝 Pola w schema API:', apiFields.length);

const missingInClient = apiFields.filter(f => !clientFields.includes(f));
const missingInApi = clientFields.filter(f => !apiFields.includes(f));

if (missingInClient.length > 0) {
  console.log('\n⚠️  Pola wymagane przez API, których BRAKUJE w kliencie:');
  missingInClient.forEach(field => console.log(`   - ${field}`));
}

if (missingInApi.length > 0) {
  console.log('\n⚠️  Pola w kliencie, których BRAKUJE w API:');
  missingInApi.forEach(field => console.log(`   - ${field}`));
}

console.log('\n' + '='.repeat(60));
console.log('\n📊 PODSUMOWANIE DIAGNOSTYKI\n');

// Test bez wymaganych pól
console.log('TEST 4: Dane bez startTime i endTime (starsze wersje)');
const dataWithoutDates = { ...testData };
delete (dataWithoutDates as any).startTime;
delete (dataWithoutDates as any).endTime;

try {
  baseAuctionSchema.parse(dataWithoutDates);
  console.log('✅ API akceptuje dane bez startTime/endTime');
} catch (err) {
  if (err instanceof z.ZodError) {
    console.log('❌ API WYMAGA startTime/endTime:');
    err.issues.forEach(issue => {
      console.log(`   - ${issue.path.join('.')}: ${issue.message}`);
    });
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n💡 REKOMENDACJE:\n');

if (missingInClient.length > 0) {
  console.log('1. Dodaj brakujące pola do schema klienta (lib/validations/schemas.ts)');
  console.log('2. Upewnij się, że formularz wysyła wszystkie wymagane pola');
}

console.log('3. Sprawdź czy formularz tworzy poprawne wartości startTime/endTime');
console.log('4. Zweryfikuj format dat (musi być ISO 8601 datetime)');
console.log('5. Sprawdź czy wszystkie pola są wysyłane w poprawnym formacie (string/number)');

console.log('\n' + '='.repeat(60) + '\n');
