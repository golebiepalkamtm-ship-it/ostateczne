/**
 * Centralne Typy TypeScript dla Pałka MTM Auctions
 * 
 * Single Source of Truth - typy inferowane z schematów Zod
 */

import { z } from 'zod'
import { Role, AuctionStatus, AssetType } from '@prisma/client'
import {
  userRegistrationSchema,
  userUpdateSchema,
  auctionCreateSchema,
  auctionUpdateSchema,
  bidCreateSchema,
  searchSchema,
  contactFormSchema,
  passwordSchema,
  fileUploadSchema,
} from '@/lib/validators'

/**
 * ========================================
 * TYPY INFEROWANE Z SCHEMATÓW ZOD
 * ========================================
 */

// User Types
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>
export type UserUpdateInput = z.infer<typeof userUpdateSchema>

// Auction Types  
export type AuctionCreateInput = z.infer<typeof auctionCreateSchema>
export type AuctionUpdateInput = z.infer<typeof auctionUpdateSchema>

// Bid Types
export type BidCreateInput = z.infer<typeof bidCreateSchema>

// Search Types
export type SearchInput = z.infer<typeof searchSchema>

// Contact Types
export type ContactFormInput = z.infer<typeof contactFormSchema>

// Password Types
export type PasswordInput = z.infer<typeof passwordSchema>

// File Upload Types
export type FileUploadInput = z.infer<typeof fileUploadSchema>

/**
 * ========================================
 * ENUMY Z BAZY DANYCH
 * ========================================
 * Re-export enums z Prisma Client dla type safety
 */

export { Role, AuctionStatus, AssetType } from '@prisma/client'

/**
 * ========================================
 * TYPY ODPOWIEDZI API
 * ========================================
 * Standardowe wrappery odpowiedzi dla endpointów API
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
  timestamp: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    field?: string
    details?: unknown
  }
  timestamp: string
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * ========================================
 * TYPY PAGINACJI
 * ========================================
 */

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * ========================================
 * TYPY KONTEKSTU AUTORYZACJI
 * ========================================
 */

export interface AuthUser {
  id: string
  firebaseUid: string | null
  email: string
  firstName: string | null
  lastName: string | null
  role: Role
  isActive: boolean
  emailVerified: boolean
  phoneVerified: boolean
  breederName: string | null
  breederLocation: string | null
  avatarUrl: string | null
}

export interface AuthContextValue {
  user: AuthUser | null
  dbUser: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  refetchDbUser: () => Promise<void>
}

/**
 * ========================================
 * ROZSZERZONE TYPY AUKCJI
 * ========================================
 * Typy dla aukcji z relacjami
 */

export interface AuctionWithRelations {
  id: string
  title: string
  description: string
  category: string
  startingPrice: number
  currentPrice: number
  reservePrice: number | null
  buyNowPrice: number | null
  status: AuctionStatus
  isApproved: boolean
  startTime: Date
  endTime: Date
  createdAt: Date
  updatedAt: Date
  seller: {
    id: string
    firstName: string | null
    lastName: string | null
    breederName: string | null
    avatarUrl: string | null
  }
  pigeon: {
    id: string
    name: string
    ringNumber: string
    gender: string
    birthDate: Date
    color: string
    bloodline: string
    images: string
    isChampion: boolean
  } | null
  bids: {
    id: string
    amount: number
    createdAt: Date
    isWinning: boolean
    bidder: {
      id: string
      firstName: string | null
      lastName: string | null
    }
  }[]
  assets: {
    id: string
    type: AssetType
    url: string
    createdAt: Date
  }[]
}

/**
 * ========================================
 * ROZSZERZONE TYPY GOŁĘBI
 * ========================================
 */

export interface PigeonWithOwner {
  id: string
  name: string
  ringNumber: string
  bloodline: string
  gender: string
  birthDate: Date
  color: string
  weight: number
  breeder: string
  description: string | null
  images: string
  videos: string
  pedigree: string | null
  achievements: string | null
  isChampion: boolean
  createdAt: Date
  updatedAt: Date
  auctions: {
    id: string
    title: string
    currentPrice: number
    status: AuctionStatus
    endTime: Date
  }[]
}

/**
 * ========================================
 * TYPY FILTRÓW
 * ========================================
 */

export interface AuctionFilters extends PaginationParams {
  status?: AuctionStatus | AuctionStatus[]
  category?: string
  minPrice?: number
  maxPrice?: number
  sellerId?: string
  searchQuery?: string
  isApproved?: boolean
}

export interface PigeonFilters extends PaginationParams {
  gender?: 'MALE' | 'FEMALE'
  ownerId?: string
  bloodline?: string
  isChampion?: boolean
  searchQuery?: string
}

export interface UserFilters extends PaginationParams {
  role?: Role
  isActive?: boolean
  emailVerified?: boolean
  phoneVerified?: boolean
  searchQuery?: string
}

/**
 * ========================================
 * TYPY STATYSTYK
 * ========================================
 */

export interface DashboardStats {
  totalAuctions: number
  activeAuctions: number
  endedAuctions: number
  totalBids: number
  totalUsers: number
  totalRevenue: number
  revenueGrowth: number
  userGrowth: number
  auctionGrowth: number
}

export interface UserStats {
  totalAuctions: number
  activeAuctions: number
  wonAuctions: number
  totalBids: number
  totalSpent: number
  averageRating: number
  totalReviews: number
}

/**
 * ========================================
 * TYPY POWIADOMIEŃ
 * ========================================
 */

export interface NotificationData {
  type: 'bid' | 'auction_end' | 'message' | 'review' | 'system'
  title: string
  message: string
  link?: string
  data?: Record<string, unknown>
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data: string | null
  isRead: boolean
  isSent: boolean
  createdAt: Date
  sentAt: Date | null
  readAt: Date | null
}

/**
 * ========================================
 * TYPY UTILITY
 * ========================================
 */

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Nullable<T> = T | null

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * ========================================
 * TYPY BŁĘDÓW
 * ========================================
 */

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface AppError extends Error {
  statusCode: number
  code?: string
  field?: string
  details?: unknown
}

/**
 * ========================================
 * TYPY SESJI I CACHE
 * ========================================
 */

export interface CacheOptions {
  ttl?: number
  prefix?: string
}

export interface SessionData {
  userId: string
  firebaseUid: string
  role: Role
  email: string
  expiresAt: number
}

/**
 * ========================================
 * TYPY METRYK (PROMETHEUS)
 * ========================================
 */

export interface MetricLabels {
  method?: string
  route?: string
  status?: string
  [key: string]: string | undefined
}

export interface HttpMetrics {
  requestCount: number
  requestDuration: number
  errorCount: number
  activeConnections: number
}
