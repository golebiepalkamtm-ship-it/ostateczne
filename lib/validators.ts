/**
 * Walidatory Zod dla Pałka MTM Auctions
 * Oparte na rzeczywistych formularzach używanych w aplikacji
 */

import { z } from 'zod'

// ============================================
// USER SCHEMAS
// ============================================

export const userRegistrationSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  firstName: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki').optional(),
  lastName: z.string().min(2, 'Nazwisko musi mieć co najmniej 2 znaki').optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Nieprawidłowy numer telefonu')
    .optional(),
})

export const userUpdateSchema = z.object({
  firstName: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki').optional(),
  lastName: z.string().min(2, 'Nazwisko musi mieć co najmniej 2 znaki').optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Nieprawidłowy numer telefonu')
    .optional(),
  address: z.string().min(5, 'Adres musi mieć co najmniej 5 znaków').optional(),
  city: z.string().min(2, 'Miasto musi mieć co najmniej 2 znaki').optional(),
  postalCode: z
    .string()
    .regex(/^\d{2}-\d{3}$/, 'Nieprawidłowy kod pocztowy')
    .optional(),
})

// ============================================
// AUCTION SCHEMAS (Z FORMULARZA)
// ============================================

export const auctionCreateSchema = z
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
    startingPrice: z.number().positive('Cena startowa musi być większa od 0').optional(),
    buyNowPrice: z.number().positive('Cena kup teraz musi być większa od 0').optional(),
    reservePrice: z.number().min(0, 'Cena rezerwowa nie może być ujemna').optional(),
    startTime: z.string().datetime('Nieprawidłowa data rozpoczęcia').optional(),
    endTime: z.string().datetime('Nieprawidłowa data zakończenia').optional(),
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
        // Charakterystyka
        dnaCertificate: z.string().optional(),
        size: z.string().optional(),
        bodyStructure: z.string().optional(),
        vitality: z.string().optional(),
        colorDensity: z.string().optional(),
        length: z.string().optional(),
        endurance: z.string().optional(),
        forkStrength: z.string().optional(),
        forkAlignment: z.string().optional(),
        muscles: z.string().optional(),
        balance: z.string().optional(),
        back: z.string().optional(),
        // Opis skrzydła
        breedingFeathers: z.string().optional(),
        flightFeathers: z.string().optional(),
        plumage: z.string().optional(),
        featherQuality: z.string().optional(),
        secondaryFlightFeathers: z.string().optional(),
        flexibility: z.string().optional(),
      })
      .optional(),
    csrfToken: z.string().min(1, 'Token CSRF jest wymagany').optional(),
  })
  .refine(
    data => {
      // Musi być przynajmniej jedna opcja: licytacja LUB kup teraz
      const hasStartingPrice = data.startingPrice !== undefined && data.startingPrice !== null && data.startingPrice > 0
      const hasBuyNowPrice = data.buyNowPrice !== undefined && data.buyNowPrice !== null && data.buyNowPrice > 0
      return hasStartingPrice || hasBuyNowPrice
    },
    {
      message: 'Musisz ustawić cenę startową (licytacja) lub cenę kup teraz (lub obie)',
      path: ['startingPrice'],
    }
  )
  .refine(
    data => {
      // Jeśli są obie ceny, buyNowPrice musi być >= startingPrice
      const hasStartingPrice = data.startingPrice !== undefined && data.startingPrice !== null && data.startingPrice > 0
      const hasBuyNowPrice = data.buyNowPrice !== undefined && data.buyNowPrice !== null && data.buyNowPrice > 0
      
      if (hasStartingPrice && hasBuyNowPrice) {
        return (data.buyNowPrice ?? 0) >= (data.startingPrice ?? 0)
      }
      return true
    },
    {
      message: 'Cena kup teraz musi być większa lub równa cenie startowej',
      path: ['buyNowPrice'],
    }
  )
  .refine(
    data => {
      if (data.category === 'Pigeon') {
        return data.pigeon && data.pigeon.ringNumber && data.pigeon.bloodline && data.pigeon.sex
      }
      return true
    },
    {
      message: 'Dla aukcji gołębia wymagane są: numer obrączki, linia krwi i płeć',
      path: ['pigeon'],
    }
  )

const baseAuctionSchema = z.object({
  title: z
    .string()
    .min(5, 'Tytuł musi mieć co najmniej 5 znaków')
    .max(200, 'Tytuł może mieć maksymalnie 200 znaków'),
  description: z
    .string()
    .min(20, 'Opis musi mieć co najmniej 20 znaków')
    .max(2000, 'Opis może mieć maksymalnie 2000 znaków'),
  category: z.string().min(1, 'Kategoria jest wymagana'),
  startingPrice: z.number().min(0, 'Cena startowa nie może być ujemna').optional(),
  buyNowPrice: z.number().min(0, 'Cena kup teraz nie może być ujemna').optional(),
  reservePrice: z.number().min(0, 'Cena rezerwowa nie może być ujemna').optional(),
  startTime: z.string().datetime('Nieprawidłowa data rozpoczęcia'),
  endTime: z.string().datetime('Nieprawidłowa data zakończenia'),
  images: z.array(z.string().min(1, 'URL obrazu nie może być pusty')).optional(),
  videos: z.array(z.string().min(1, 'URL wideo nie może być pusty')).optional(),
  documents: z.array(z.string().min(1, 'URL dokumentu nie może być pusty')).optional(),
  location: z.string().optional(),
  pigeon: z
    .object({
      ringNumber: z.string().min(1, 'Numer obrączki jest wymagany dla gołębia'),
      bloodline: z.string().min(1, 'Linia krwi jest wymagana dla gołębia'),
      sex: z.enum(['male', 'female'], { message: 'Płeć jest wymagana dla gołębia' }),
      eyeColor: z.string().optional(),
      featherColor: z.string().optional(),
      purpose: z.array(z.string()).optional(),
      dnaCertificate: z.string().optional(),
      size: z.string().optional(),
      bodyStructure: z.string().optional(),
      vitality: z.string().optional(),
      colorDensity: z.string().optional(),
      length: z.string().optional(),
      endurance: z.string().optional(),
      forkStrength: z.string().optional(),
      forkAlignment: z.string().optional(),
      muscles: z.string().optional(),
      balance: z.string().optional(),
      back: z.string().optional(),
      breedingFeathers: z.string().optional(),
      flightFeathers: z.string().optional(),
      plumage: z.string().optional(),
      featherQuality: z.string().optional(),
      secondaryFlightFeathers: z.string().optional(),
      flexibility: z.string().optional(),
    })
    .optional(),
})

export const auctionUpdateSchema = baseAuctionSchema.partial()

// ============================================
// BID SCHEMAS
// ============================================

export const bidCreateSchema = z.object({
  auctionId: z.string().min(1, 'ID aukcji jest wymagane'),
  amount: z.number().min(0, 'Kwota licytacji nie może być ujemna'),
})

// ============================================
// SEARCH SCHEMAS
// ============================================

export const searchSchema = z
  .object({
    query: z
      .string()
      .min(1, 'Zapytanie wyszukiwania nie może być puste')
      .max(100, 'Zapytanie może mieć maksymalnie 100 znaków'),
    category: z.string().optional(),
    minPrice: z.number().min(0, 'Minimalna cena nie może być ujemna').optional(),
    maxPrice: z.number().min(0, 'Maksymalna cena nie może być ujemna').optional(),
    sortBy: z.enum(['newest', 'oldest', 'price-low', 'price-high', 'ending-soon']).optional(),
    status: z.enum(['ACTIVE', 'ENDED', 'CANCELLED', 'PENDING']).optional(),
  })
  .refine(
    data => {
      if (data.minPrice && data.maxPrice) {
        return data.maxPrice >= data.minPrice
      }
      return true
    },
    {
      message: 'Maksymalna cena musi być większa lub równa minimalnej cenie',
      path: ['maxPrice'],
    }
  )

// ============================================
// FILE UPLOAD SCHEMAS
// ============================================

export const fileUploadSchema = z.object({
  files: z
    .array(z.any())
    .min(1, 'Przynajmniej jeden plik jest wymagany')
    .max(10, 'Maksymalnie 10 plików'),
  allowedTypes: z.array(z.string()).optional(),
  maxSize: z.number().optional(),
})

// ============================================
// CONTACT SCHEMAS
// ============================================

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Imię musi mieć co najmniej 2 znaki')
    .max(100, 'Imię może mieć maksymalnie 100 znaków'),
  email: z.string().email('Nieprawidłowy adres email'),
  subject: z
    .string()
    .min(5, 'Temat musi mieć co najmniej 5 znaków')
    .max(200, 'Temat może mieć maksymalnie 200 znaków'),
  message: z
    .string()
    .min(20, 'Wiadomość musi mieć co najmniej 20 znaków')
    .max(1000, 'Wiadomość może mieć maksymalnie 1000 znaków'),
})

// ============================================
// PASSWORD SCHEMAS
// ============================================

export const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Nowe hasło musi mieć co najmniej 8 znaków')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Nowe hasło musi zawierać małą literę, wielką literę i cyfrę'
      ),
    confirmPassword: z.string().min(1, 'Potwierdzenie hasła jest wymagane'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmPassword'],
  })

// ============================================
// EXPORTED SCHEMAS
// ============================================

export const schemas = {
  user: {
    registration: userRegistrationSchema,
    update: userUpdateSchema,
  },
  auction: {
    create: auctionCreateSchema,
    update: auctionUpdateSchema,
  },
  bid: {
    create: bidCreateSchema,
  },
  search: searchSchema,
  fileUpload: fileUploadSchema,
  contactForm: contactFormSchema,
  password: passwordSchema,
}
