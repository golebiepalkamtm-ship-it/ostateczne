// Use single prisma import (from lib) and avoid duplicate type names
type SimpleBidResult = { status: number; code: string; message: string };

export async function placeBidTransaction(
  auctionId: string,
  newBid: number,
  userId: string,
  currentKnownBid: number,
  minStep: number
): Promise<SimpleBidResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({ where: { id: auctionId } });

      if (!auction) throw new Error('Auction not found (404).');
      if (auction.sellerId === userId) throw new Error('Cannot bid on own auction (403).');
      if (new Date() > new Date(auction.deadline)) throw new Error('Auction has ended (400).');
      if (newBid < Number(auction.currentBid || 0) + minStep) throw new Error(`Bid must be at least ${minStep} higher (400).`);

      const updateResult = await tx.auction.updateMany({
        where: { id: auctionId, currentBid: currentKnownBid },
        data: { currentBid: newBid, currentBidderId: userId },
      });

      if (updateResult.count === 0) {
        throw new Error('Bid update failed. Race condition detected (409).');
      }

      await tx.bidHistory.create({ data: { auctionId, userId, amount: newBid } });
    });

    return { status: 200, code: 'AUCTION_BID_OK', message: 'Bid placed successfully.' };
  } catch (err) {
    const msg = (err as Error).message || 'Unknown error';
    const match = msg.match(/\((\d{3})\)/);
    const status = match ? parseInt(match[1], 10) : 500;
    return { status, code: 'AUCTION_BID_FAIL', message: msg };
  }
}
/**
 * Auction Service - Obsługa zaawansowanej logiki aukcji
 * 
 * Funkcjonalności:
 * - Snipe Protection: Automatyczne przedłużanie aukcji przy licytacji w ostatnich minutach
 * - Auto-outbid: Automatyczne podbijanie do maksymalnej kwoty użytkownika
 * - Powiadomienia: Informowanie użytkowników o przebiciu
 * - Reserve Price: Walidacja ceny minimalnej przy zakończeniu aukcji
 */

import { prisma } from '@/lib/prisma';
import { Prisma, Auction, Bid } from '@prisma/client';

// Stałe konfiguracyjne
export const AUCTION_CONFIG = {
  DEFAULT_SNIPE_THRESHOLD_MINUTES: 5,  // Domyślny próg czasowy dla snipe protection
  DEFAULT_SNIPE_EXTENSION_MINUTES: 5,  // Domyślne przedłużenie przy snipe protection
  DEFAULT_MIN_BID_INCREMENT: 100,      // Domyślne minimalne podbicie w PLN
  MAX_AUTO_BID_ITERATIONS: 10,         // Maksymalna liczba iteracji auto-bidu (zabezpieczenie)
};

// Typy
export interface BidResult {
  success: boolean;
  bid?: Bid;
  auction?: Auction;
  message: string;
  wasExtended?: boolean;
  newEndTime?: Date;
  autoBidTriggered?: boolean;
  outbidNotificationsSent?: number;
}

export interface CreateBidParams {
  auctionId: string;
  bidderId: string;
  amount: number;
  maxBid?: number;  // Opcjonalna maksymalna kwota dla auto-outbid
}

/**
 * Sprawdza czy aukcja jest w fazie snipe protection
 */
export function isInSnipeWindow(auction: Auction): boolean {
  const now = new Date();
  const endTime = new Date(auction.endTime);
  const thresholdMinutes = auction.snipeThresholdMinutes ?? AUCTION_CONFIG.DEFAULT_SNIPE_THRESHOLD_MINUTES;
  const thresholdMs = thresholdMinutes * 60 * 1000;
  
  const timeUntilEnd = endTime.getTime() - now.getTime();
  return timeUntilEnd > 0 && timeUntilEnd <= thresholdMs;
}

/**
 * Oblicza nowy czas zakończenia przy snipe protection
 */
export function calculateExtendedEndTime(auction: Auction): Date {
  const extensionMinutes = auction.snipeExtensionMinutes ?? AUCTION_CONFIG.DEFAULT_SNIPE_EXTENSION_MINUTES;
  const currentEndTime = new Date(auction.endTime);
  return new Date(currentEndTime.getTime() + extensionMinutes * 60 * 1000);
}

/**
 * Oblicza minimalną wymaganą kwotę licytacji
 */
export function calculateMinimumBid(auction: Auction & { bids: Bid[] }): number {
  const currentPrice = auction.bids.length > 0 
    ? Math.max(...auction.bids.map(b => b.amount))
    : auction.startingPrice;
  const minIncrement = auction.minBidIncrement ?? AUCTION_CONFIG.DEFAULT_MIN_BID_INCREMENT;
  return currentPrice + minIncrement;
}

/**
 * Sprawdza czy cena minimalna (reserve price) została osiągnięta
 */
export function isReservePriceMet(auction: Auction): boolean {
  if (!auction.reservePrice) return true; // Brak reserve price = zawsze OK
  return auction.currentPrice >= auction.reservePrice;
}

/**
 * Tworzy powiadomienie o przebiciu dla poprzedniego licytanta
 */
async function createOutbidNotification(
  tx: Prisma.TransactionClient,
  previousBidderId: string,
  auction: Auction,
  newBidAmount: number
): Promise<void> {
  await tx.notification.create({
    data: {
      userId: previousBidderId,
      type: 'OUTBID',
      title: 'Twoja oferta została przebita!',
      message: `Ktoś przebił Twoją ofertę w aukcji "${auction.title}". Nowa cena: ${newBidAmount.toLocaleString('pl-PL')} PLN`,
      data: JSON.stringify({
        auctionId: auction.id,
        auctionTitle: auction.title,
        newBidAmount,
        auctionEndTime: auction.endTime,
      }),
      isRead: false,
      isSent: false,
    },
  });
}

/**
 * Tworzy powiadomienie o przedłużeniu aukcji
 */
async function createAuctionExtendedNotification(
  tx: Prisma.TransactionClient,
  auction: Auction,
  newEndTime: Date,
  watcherIds: string[]
): Promise<void> {
  const notifications = watcherIds.map(userId => ({
    userId,
    type: 'AUCTION_EXTENDED',
    title: 'Aukcja została przedłużona!',
    message: `Aukcja "${auction.title}" została przedłużona do ${newEndTime.toLocaleString('pl-PL')}`,
    data: JSON.stringify({
      auctionId: auction.id,
      auctionTitle: auction.title,
      newEndTime: newEndTime.toISOString(),
    }),
    isRead: false,
    isSent: false,
  }));

  if (notifications.length > 0) {
    await tx.notification.createMany({ data: notifications });
  }
}

/**
 * Znajduje najwyższy aktywny auto-bid (maxBid) konkurenta
 */
async function findCompetingAutoBid(
  tx: Prisma.TransactionClient,
  auctionId: string,
  excludeBidderId: string,
  minAmount: number
): Promise<Bid | null> {
  const competingBid = await tx.bid.findFirst({
    where: {
      auctionId,
      bidderId: { not: excludeBidderId },
      maxBid: { gte: minAmount },
    },
    orderBy: { maxBid: 'desc' },
  });
  return competingBid;
}

/**
 * Główna funkcja składania licytacji z wszystkimi funkcjonalnościami
 */
export async function createBidWithFeatures(params: CreateBidParams): Promise<BidResult> {
  const { auctionId, bidderId, amount, maxBid } = params;

  return await prisma.$transaction(async (tx) => {
    // 1. Pobierz aukcję z wszystkimi potrzebnymi danymi
    const auction = await tx.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          include: { bidder: { select: { id: true, firstName: true } } },
        },
        watchlist: { select: { userId: true } },
        seller: { select: { id: true } },
      },
    });

    if (!auction) {
      return { success: false, message: 'Aukcja nie została znaleziona' };
    }

    if (auction.status !== 'ACTIVE') {
      return { success: false, message: 'Aukcja nie jest aktywna' };
    }

    if (!auction.isApproved) {
      return { success: false, message: 'Aukcja nie została zatwierdzona' };
    }

    if (bidderId === auction.sellerId) {
      return { success: false, message: 'Nie możesz licytować w swojej aukcji' };
    }

    const now = new Date();
    if (now > auction.endTime) {
      return { success: false, message: 'Aukcja już się zakończyła' };
    }

    // 2. Sprawdź minimalną kwotę licytacji
    const minimumBid = calculateMinimumBid(auction);
    const effectiveMaxBid = maxBid ?? amount;

    if (amount < minimumBid) {
      return { 
        success: false, 
        message: `Minimalna kwota licytacji to ${minimumBid.toLocaleString('pl-PL')} PLN` 
      };
    }

    // 3. Sprawdź czy licytacja nie przekracza ceny "Kup teraz"
    if (auction.buyNowPrice && amount >= auction.buyNowPrice) {
      return { 
        success: false, 
        message: 'Użyj opcji "Kup teraz" zamiast licytacji' 
      };
    }

    // 4. Zapisz poprzedniego wygrywającego licytanta do powiadomień
    const previousWinningBid = auction.bids[0];
    const previousWinnerId = previousWinningBid?.bidderId;

    // 5. Sprawdź snipe protection
    let wasExtended = false;
    let newEndTime = auction.endTime;

    if (isInSnipeWindow(auction)) {
      newEndTime = calculateExtendedEndTime(auction);
      wasExtended = true;
    }

    // 6. Obsługa auto-outbid
    let finalBidAmount = amount;
    let autoBidTriggered = false;

    // Sprawdź czy jest konkurencyjny auto-bid
    const competingAutoBid = await findCompetingAutoBid(tx, auctionId, bidderId, amount);
    
    if (competingAutoBid && competingAutoBid.maxBid) {
      // Ktoś inny ma aktywny auto-bid
      const competitorMaxBid = competingAutoBid.maxBid;
      const minIncrement = auction.minBidIncrement ?? AUCTION_CONFIG.DEFAULT_MIN_BID_INCREMENT;

      if (effectiveMaxBid > competitorMaxBid) {
        // Nasz max bid jest wyższy - wygrywamy z kwotą minimalnie wyższą od konkurenta
        finalBidAmount = Math.min(effectiveMaxBid, competitorMaxBid + minIncrement);
        autoBidTriggered = true;

        // Utwórz auto-bid konkurenta (przegrywający)
        await tx.bid.create({
          data: {
            auctionId,
            bidderId: competingAutoBid.bidderId,
            amount: competitorMaxBid,
            maxBid: competitorMaxBid,
            isWinning: false,
            isAutoBid: true,
          },
        });
      } else {
        // Konkurent ma wyższy max bid - on wygrywa
        const newCompetitorBid = Math.min(competitorMaxBid, effectiveMaxBid + minIncrement);
        
        // Utwórz naszą ofertę (przegrywającą)
        await tx.bid.create({
          data: {
            auctionId,
            bidderId,
            amount,
            maxBid: maxBid,
            isWinning: false,
            isAutoBid: false,
          },
        });

        // Utwórz auto-bid konkurenta (wygrywający)
        const winningBid = await tx.bid.create({
          data: {
            auctionId,
            bidderId: competingAutoBid.bidderId,
            amount: newCompetitorBid,
            maxBid: competitorMaxBid,
            isWinning: true,
            isAutoBid: true,
          },
        });

        // Zaktualizuj aukcję
        const updatedAuction = await tx.auction.update({
          where: { id: auctionId },
          data: {
            currentPrice: newCompetitorBid,
            endTime: newEndTime,
            reserveMet: isReservePriceMet({ ...auction, currentPrice: newCompetitorBid }),
          },
        });

        // Wyślij powiadomienie o przebiciu do nas
        await createOutbidNotification(tx, bidderId, auction, newCompetitorBid);

        return {
          success: true,
          bid: winningBid,
          auction: updatedAuction,
          message: 'Twoja oferta została automatycznie przebita przez innego licytanta',
          wasExtended,
          newEndTime: wasExtended ? newEndTime : undefined,
          autoBidTriggered: true,
        };
      }
    }

    // 7. Utwórz wygrywającą licytację
    const newBid = await tx.bid.create({
      data: {
        auctionId,
        bidderId,
        amount: finalBidAmount,
        maxBid: maxBid,
        isWinning: true,
        isAutoBid: autoBidTriggered,
      },
      include: {
        bidder: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // 8. Oznacz poprzednie licytacje jako nie-wygrywające
    await tx.bid.updateMany({
      where: {
        auctionId,
        id: { not: newBid.id },
      },
      data: { isWinning: false },
    });

    // 9. Zaktualizuj aukcję
    const updatedAuction = await tx.auction.update({
      where: { id: auctionId },
      data: {
        currentPrice: finalBidAmount,
        endTime: newEndTime,
        originalEndTime: auction.originalEndTime ?? auction.endTime, // Zachowaj oryginalny czas
        reserveMet: isReservePriceMet({ ...auction, currentPrice: finalBidAmount }),
      },
    });

    // 10. Wyślij powiadomienia
    let outbidNotificationsSent = 0;

    // Powiadomienie o przebiciu dla poprzedniego wygrywającego
    if (previousWinnerId && previousWinnerId !== bidderId) {
      await createOutbidNotification(tx, previousWinnerId, auction, finalBidAmount);
      outbidNotificationsSent++;
    }

    // Powiadomienia o przedłużeniu aukcji
    if (wasExtended) {
      const watcherIds = auction.watchlist
        .map(w => w.userId)
        .filter(id => id !== bidderId); // Nie powiadamiaj obecnego licytanta
      
      await createAuctionExtendedNotification(tx, auction, newEndTime, watcherIds);
    }

    return {
      success: true,
      bid: newBid,
      auction: updatedAuction,
      message: wasExtended 
        ? `Licytacja złożona! Aukcja została przedłużona do ${newEndTime.toLocaleString('pl-PL')}`
        : 'Licytacja złożona pomyślnie',
      wasExtended,
      newEndTime: wasExtended ? newEndTime : undefined,
      autoBidTriggered,
      outbidNotificationsSent,
    };
  });
}

/**
 * Kończy aukcję i sprawdza reserve price
 */
export async function finalizeAuction(auctionId: string): Promise<{
  success: boolean;
  message: string;
  winnerId?: string;
  finalPrice?: number;
  reserveMet: boolean;
}> {
  return await prisma.$transaction(async (tx) => {
    const auction = await tx.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          where: { isWinning: true },
          include: { bidder: true },
        },
        seller: true,
      },
    });

    if (!auction) {
      return { success: false, message: 'Aukcja nie istnieje', reserveMet: false };
    }

    if (auction.status !== 'ACTIVE') {
      return { success: false, message: 'Aukcja już nie jest aktywna', reserveMet: false };
    }

    const winningBid = auction.bids[0];
    const reserveMet = isReservePriceMet(auction);

    // Zaktualizuj status aukcji
    await tx.auction.update({
      where: { id: auctionId },
      data: {
        status: 'ENDED',
        reserveMet,
      },
    });

    // Jeśli jest zwycięzca i reserve price jest osiągnięta
    if (winningBid && reserveMet) {
      // Utwórz transakcję
      const commission = winningBid.amount * 0.05; // 5% prowizji
      await tx.transaction.create({
        data: {
          auctionId,
          buyerId: winningBid.bidderId,
          sellerId: auction.sellerId,
          amount: winningBid.amount,
          commission,
          status: 'PENDING',
        },
      });

      // Powiadomienie dla zwycięzcy
      await tx.notification.create({
        data: {
          userId: winningBid.bidderId,
          type: 'AUCTION_WON',
          title: 'Wygrałeś aukcję!',
          message: `Gratulacje! Wygrałeś aukcję "${auction.title}" za ${winningBid.amount.toLocaleString('pl-PL')} PLN`,
          data: JSON.stringify({
            auctionId,
            auctionTitle: auction.title,
            finalPrice: winningBid.amount,
            sellerEmail: auction.seller.email,
          }),
        },
      });

      // Powiadomienie dla sprzedawcy
      await tx.notification.create({
        data: {
          userId: auction.sellerId,
          type: 'AUCTION_SOLD',
          title: 'Twoja aukcja została sprzedana!',
          message: `Aukcja "${auction.title}" zakończyła się. Cena finalna: ${winningBid.amount.toLocaleString('pl-PL')} PLN`,
          data: JSON.stringify({
            auctionId,
            auctionTitle: auction.title,
            finalPrice: winningBid.amount,
            buyerId: winningBid.bidderId,
          }),
        },
      });

      return {
        success: true,
        message: 'Aukcja zakończona - przedmiot sprzedany',
        winnerId: winningBid.bidderId,
        finalPrice: winningBid.amount,
        reserveMet: true,
      };
    }

    // Reserve price nie osiągnięta lub brak licytacji
    if (winningBid && !reserveMet) {
      // Powiadomienie dla licytanta
      await tx.notification.create({
        data: {
          userId: winningBid.bidderId,
          type: 'RESERVE_NOT_MET',
          title: 'Cena minimalna nie została osiągnięta',
          message: `Niestety, aukcja "${auction.title}" zakończyła się bez sprzedaży - cena minimalna nie została osiągnięta.`,
          data: JSON.stringify({
            auctionId,
            auctionTitle: auction.title,
            yourBid: winningBid.amount,
          }),
        },
      });
    }

    // Powiadomienie dla sprzedawcy
    await tx.notification.create({
      data: {
        userId: auction.sellerId,
        type: 'AUCTION_ENDED_NO_SALE',
        title: 'Aukcja zakończona bez sprzedaży',
        message: `Aukcja "${auction.title}" zakończyła się${!reserveMet ? ' - cena minimalna nie została osiągnięta' : ' bez żadnych ofert'}`,
        data: JSON.stringify({
          auctionId,
          auctionTitle: auction.title,
          reservePrice: auction.reservePrice,
          highestBid: winningBid?.amount,
        }),
      },
    });

    return {
      success: true,
      message: reserveMet 
        ? 'Aukcja zakończona bez ofert' 
        : 'Aukcja zakończona - cena minimalna nie została osiągnięta',
      winnerId: undefined,
      finalPrice: undefined,
      reserveMet,
    };
  });
}

/**
 * Aktualizuje maksymalną kwotę auto-bidu dla użytkownika
 */
export async function updateMaxBid(
  auctionId: string,
  bidderId: string,
  newMaxBid: number
): Promise<{ success: boolean; message: string }> {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  });

  if (!auction) {
    return { success: false, message: 'Aukcja nie istnieje' };
  }

  if (auction.status !== 'ACTIVE') {
    return { success: false, message: 'Aukcja nie jest aktywna' };
  }

  if (newMaxBid <= auction.currentPrice) {
    return { success: false, message: 'Maksymalna kwota musi być wyższa od aktualnej ceny' };
  }

  // Znajdź ostatnią licytację użytkownika
  const lastBid = await prisma.bid.findFirst({
    where: { auctionId, bidderId },
    orderBy: { createdAt: 'desc' },
  });

  if (!lastBid) {
    return { success: false, message: 'Najpierw musisz złożyć licytację' };
  }

  // Zaktualizuj maxBid
  await prisma.bid.update({
    where: { id: lastBid.id },
    data: { maxBid: newMaxBid },
  });

  return { success: true, message: 'Maksymalna kwota auto-licytacji została zaktualizowana' };
}