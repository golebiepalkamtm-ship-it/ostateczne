'use client';

import { FullscreenImageModal } from '@/components/ui/FullscreenImageModal';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileVerification } from '@/hooks/useProfileVerification';
import { useAppStore, useRatePLNperEUR } from '@/store/useAppStore';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { AlertCircle, Calendar, Eye, MapPin, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';

// Hook for scroll reveal animations
const useScrollReveal = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { ref, isVisible };
};

// Props for GoldenCard
interface GoldenCardProps {
  children: React.ReactNode;
  className?: string;
}

function GoldenCard({ children, className = '' }: GoldenCardProps) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div className="relative">
      {/* 3D Shadow layers - solid depth effect */}
      {[...Array(11)].map((_, i) => {
        const layer = 11 - i;
        const offset = layer * 1.5;
        const opacity = Math.max(0.2, 0.7 - layer * 0.05);

        return (
          <div
            key={i}
            className="absolute inset-0 rounded-3xl border-4"
            style={{
              borderColor: `rgba(0, 0, 0, ${opacity})`,
              backgroundColor: `rgba(0, 0, 0, ${opacity * 0.8})`,
              transform: `translateX(${offset}px) translateY(${offset / 2}px) translateZ(-${offset}px)`,
              zIndex: i + 1,
            }}
            aria-hidden="true"
          />
        );
      })}

      <article
        ref={ref}
        className={`card-glow-edge relative z-[12] w-full rounded-3xl border-4 p-8 text-white transition-all duration-[2000ms] overflow-hidden ${className}`}
        style={{
          transform: !isVisible ? 'translateZ(-200px) scale(0.5)' : 'translateZ(0) scale(1)',
          transition: 'all 2000ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          opacity: isVisible ? 1 : 0,
          background:
            'linear-gradient(135deg, rgba(139, 117, 66, 1) 0%, rgba(133, 107, 56, 1) 25%, rgba(107, 91, 49, 1) 50%, rgba(89, 79, 45, 1) 75%, rgba(71, 61, 38, 1) 100%)',
          borderColor: 'rgba(218, 182, 98, 1)',
          boxShadow:
            '0 0 30px rgba(218, 182, 98, 1), 0 0 50px rgba(189, 158, 88, 1), 0 0 70px rgba(165, 138, 78, 0.8), inset 0 0 40px rgba(71, 61, 38, 0.5), inset 0 2px 0 rgba(218, 182, 98, 1), inset 0 -2px 0 rgba(61, 51, 33, 0.6)',
        }}
      >
        {/* Inner light effects - solid overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-3xl"
          style={{
            background: `
              radial-gradient(ellipse 800px 600px at 20% 30%, rgba(255, 245, 200, 0.25) 0%, transparent 50%),
              radial-gradient(ellipse 600px 500px at 80% 70%, rgba(218, 182, 98, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse 400px 300px at 50% 50%, rgba(255, 235, 180, 0.15) 0%, transparent 60%)
            `,
            zIndex: 1,
          }}
        />
        <div className="relative z-10">{children}</div>
      </article>
    </div>
  );
}

interface AuctionDetailsProps {
  auctionId: string;
}

interface Bid {
  id: string;
  amount: number;
  bidder: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  isWinning: boolean;
}

interface Auction {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  buyNowPrice?: number;
  reservePrice?: number;
  endTime: Date;
  originalEndTime?: Date;
  snipeThresholdMinutes?: number;
  snipeExtensionMinutes?: number;
  minBidIncrement?: number;
  status: 'active' | 'ending' | 'ended';
  reserveMet?: boolean;
  category: string;
  bloodline: string;
  age: number;
  sex: 'male' | 'female';
  location: string;
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    avatar?: string;
    rating: number;
    salesCount: number;
  };
  pigeon?: {
    eyeColor?: string;
    featherColor?: string;
    vitality?: string;
    length?: string;
    endurance?: string;
    forkStrength?: string;
    forkAlignment?: string;
    muscles?: string;
    balance?: string;
    back?: string;
    purpose?: string;
  };
  images: string[];
  videos?: string[];
  documents?: string[];
  bids: Bid[];
  watchersCount: number;
  viewsCount: number;
}

// Funkcja do pobierania aukcji z API
const getAuctionById = async (id: string): Promise<Auction | null> => {
  try {
    const response = await fetch(`/api/auctions/${id}`);
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Aukcja nie jest jeszcze zatwierdzona przez administratora');
      }
      if (response.status === 404) {
        throw new Error('Aukcja nie została znaleziona');
      }
      throw new Error('Błąd podczas pobierania aukcji');
    }

    const auction = await response.json();
    if (!auction) return null;

    // const now = new Date() // unused
    const end = new Date(auction.endTime);

    return {
      id: auction.id,
      title: auction.title,
      description: auction.description,
      startingPrice: auction.startingPrice,
      currentPrice: auction.currentPrice,
      buyNowPrice: auction.buyNowPrice,
      endTime: end,
      status: auction.status.toLowerCase(),
      category: auction.category,
      bloodline: auction.pigeon?.bloodline || '',
      age: 0, // Domyślny wiek
      sex: auction.pigeon?.gender || 'male',
      location: 'Brak lokalizacji', // Domyślna lokalizacja
      pigeon: auction.pigeon ? {
        eyeColor: auction.pigeon.eyeColor,
        featherColor: auction.pigeon.featherColor,
        vitality: auction.pigeon.vitality,
        length: auction.pigeon.length,
        endurance: auction.pigeon.endurance,
        forkStrength: auction.pigeon.forkStrength,
        forkAlignment: auction.pigeon.forkAlignment,
        muscles: auction.pigeon.muscles,
        balance: auction.pigeon.balance,
        back: auction.pigeon.back,
        purpose: auction.pigeon.purpose,
      } : undefined,
      seller: {
        id: auction.seller.id,
        firstName: auction.seller.firstName,
        lastName: auction.seller.lastName,
        email: auction.seller.email,
        phoneNumber: auction.seller.phoneNumber,
        avatar: auction.seller.image || null,
        rating: 0, // Brak systemu ocen
        salesCount: 0, // Brak danych o sprzedaży
      },
      images:
        auction.assets
          ?.filter((a: { type: string; url: string }) => a.type === 'IMAGE')
          .map((a: { url: string }) => a.url) || [],
      videos:
        auction.assets
          ?.filter((a: { type: string; url: string }) => a.type === 'VIDEO')
          .map((a: { url: string }) => a.url) || [],
      documents:
        auction.assets
          ?.filter((a: { type: string; url: string }) => a.type === 'DOCUMENT')
          .map((a: { url: string }) => a.url) || [],
      bids:
        auction.bids?.map(
          (
            bid: {
              id: string;
              amount: number;
              bidder: { id: string; firstName?: string; lastName?: string };
              createdAt: string;
            },
            index: number,
          ) => ({
            id: bid.id,
            amount: bid.amount,
            bidder: {
              id: bid.bidder.id,
              name:
                `${bid.bidder.firstName || ''} ${bid.bidder.lastName || ''}`.trim() ||
                bid.bidder.id,
            },
            timestamp: new Date(bid.createdAt),
            isWinning: index === 0,
          }),
        ) || [],
      watchersCount: auction._count?.watchlist || 0,
      viewsCount: 0,
    };
  } catch (error) {
    console.error('Error fetching auction:', error);
    return null;
  }
};

export default function AuctionDetails({ auctionId }: AuctionDetailsProps) {
  const { user } = useAuth();
  const { canBid, missingFields } = useProfileVerification();
  const ratePLNperEUR = useRatePLNperEUR();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [maxBidAmount, setMaxBidAmount] = useState('');
  const [useAutoBid, setUseAutoBid] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isBidding, setIsBidding] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const [isPedigreeFullscreen, setIsPedigreeFullscreen] = useState(false);
  const [wasExtended, setWasExtended] = useState(false);
  const [isInSnipeWindow, setIsInSnipeWindow] = useState(false);

  // Funkcje do obsługi pełnoekranowego widoku
  const openFullscreen = (index: number) => {
    setFullscreenImageIndex(index);
    setIsFullscreenOpen(true);
    setIsPedigreeFullscreen(false);
  };

  const openFullscreenPedigree = () => {
    setIsPedigreeFullscreen(true);
    setIsFullscreenOpen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreenOpen(false);
    setIsPedigreeFullscreen(false);
  };

  // Ładowanie aukcji
  useEffect(() => {
    const loadAuction = async () => {
      try {
        const loadedAuction = await getAuctionById(auctionId);
        setAuction(loadedAuction);
        setError(null);
        if (!loadedAuction) {
          toast.error('Aukcja nie została znaleziona', {
            duration: 4000,
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Błąd podczas ładowania aukcji';
        setError(errorMessage);
        setAuction(null);
        toast.error(errorMessage, {
          duration: 5000,
        });
      }
    };
    loadAuction();
  }, [auctionId]);

  // Timer effect with snipe protection detection
  useEffect(() => {
    if (!auction) return;
    const interval = setInterval(() => {
      const now = new Date();
      const endTime = auction.endTime;
      const diff = endTime.getTime() - now.getTime();
      const snipeThreshold = (auction.snipeThresholdMinutes || 5) * 60 * 1000;

      // Check if we're in snipe protection window
      if (diff > 0 && diff <= snipeThreshold) {
        setIsInSnipeWindow(true);
      } else {
        setIsInSnipeWindow(false);
      }

      if (diff <= 0) {
        setTimeLeft('Aukcja zakończona');
        setAuction(prev => (prev ? { ...prev, status: 'ended' } : null));

        // Sprawdź czy użytkownik wygrał licytację
        const winningBid = auction.bids.find(bid => bid.isWinning);
        if (winningBid && user?.displayName === winningBid.bidder.name) {
          const successData = {
            type: 'auction_won',
            auctionId: auction.id,
            auctionTitle: auction.title,
            price: winningBid.amount,
            reserveMet: auction.reserveMet !== false,
            seller: {
              name: `${auction.seller.firstName} ${auction.seller.lastName}`,
              id: auction.seller.id,
              rating: 0,
              salesCount: 0,
              avatar: null,
              location: auction.location || 'Brak lokalizacji',
              phone: auction.seller.phoneNumber || 'Brak numeru telefonu',
              email: auction.seller.email,
            },
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem('auctionSuccess', JSON.stringify(successData));
          setTimeout(() => {
            window.location.href = '/auctions/success';
          }, 2000);
        }

        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
        if (minutes <= 5) {
          setAuction(prev => (prev ? { ...prev, status: 'ending' } : null));
        }
      } else {
        setTimeLeft(`${seconds}s`);
        setAuction(prev => (prev ? { ...prev, status: 'ending' } : null));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [auction?.endTime, auction, user?.displayName]);

  if (!auction && error) {
    return (
      <div className="pt-[320px] min-h-screen flex items-center justify-center px-4">
        <GoldenCard className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">Aukcja niedostępna</h1>
          <p className="text-white/70 mb-6">{error}</p>
          <Link
            href="/auctions"
            className="inline-block px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-lg hover:from-amber-500 hover:to-amber-600 transition-all duration-300"
          >
            Powrót do aukcji
          </Link>
        </GoldenCard>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="pt-[320px] min-h-screen flex items-center justify-center px-4">
        <GoldenCard className="text-center max-w-md">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-4">Ładowanie...</h1>
          <p className="text-white/70 mb-6">Pobieranie danych aukcji...</p>
        </GoldenCard>
      </div>
    );
  }

  const isOwner = user?.email === auction.seller.email;

  const handleBid = async () => {
    if (!user) {
      toast.error('Zaloguj się, aby licytować', { duration: 4000 });
      return;
    }

    if (isOwner) {
      toast.error('Nie możesz licytować we własnej aukcji', { duration: 4000 });
      return;
    }

    if (!canBid) {
      toast.error(
        `Aby licytować, musisz uzupełnić profil i zweryfikować numer telefonu. Brakujące pola: ${missingFields.join(', ')}`,
        {
          duration: 5000,
        },
      );
      return;
    }

    const bidValue = parseFloat(bidAmount);
    if (!bidAmount || bidValue <= auction.currentPrice) {
      toast.error(`Oferta musi być wyższa od aktualnej ceny ${formatPrice(auction.currentPrice)}`, {
        duration: 4000,
      });
      return;
    }

    setIsBidding(true);

    try {
      // Przygotuj dane do wysłania z opcjonalnym maxBid
      const bidData: { amount: number; maxBid?: number } = {
        amount: bidValue,
      };

      // Dodaj maxBid jeśli użytkownik wybrał auto-licytację
      if (useAutoBid && maxBidAmount) {
        const maxBidValue = parseFloat(maxBidAmount);
        if (maxBidValue > bidValue) {
          bidData.maxBid = maxBidValue;
        }
      }

      // Get Firebase ID token for authentication
      const token = await user.getIdToken(true);

      const response = await fetch(`/api/auctions/${auction.id}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bidData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Sprawdź czy aukcja została przedłużona (snipe protection)
        if (result.meta?.wasExtended) {
          setWasExtended(true);
          toast.success(`🕐 Aukcja przedłużona! Nowy czas zakończenia: ${new Date(result.meta.newEndTime).toLocaleString('pl-PL')}`, {
            duration: 6000,
          });
        }

        // Sprawdź czy był auto-bid
        if (result.meta?.autoBidTriggered) {
          toast.success(`🤖 Auto-licytacja aktywna! Twoja oferta: ${formatPrice(result.bid.amount)}`, {
            duration: 5000,
          });
        }

        // Odśwież dane aukcji
        const auctionResponse = await fetch(`/api/auctions/${auction.id}`);
        if (auctionResponse.ok) {
          const updatedAuctionData = await auctionResponse.json();
          // Mapuj dane z API do formatu komponentu
          const end = new Date(updatedAuctionData.endTime);
          setAuction({
            ...auction,
            currentPrice: updatedAuctionData.currentPrice,
            endTime: end,
            bids: updatedAuctionData.bids?.map(
              (bid: any, index: number) => ({
                id: bid.id,
                amount: bid.amount,
                bidder: {
                  id: bid.bidder.id,
                  name: `${bid.bidder.firstName || ''} ${bid.bidder.lastName || ''}`.trim() || bid.bidder.id,
                },
                timestamp: new Date(bid.createdAt),
                isWinning: index === 0,
              }),
            ) || [],
          });
        }

        setBidAmount('');
        setMaxBidAmount('');
        if (!result.meta?.wasExtended && !result.meta?.autoBidTriggered) {
          toast.success(`Licytacja ${formatPrice(bidValue)} została złożona!`, {
            duration: 4000,
          });
        }
      } else {
        // Obsługa błędów z serwera
        const errorData = await response.json(); // Pobierz dane błędu
        console.error('Błąd licytacji (serwer):', errorData);

        if (errorData.missingFields) {
          toast.error(
            `${errorData.message || 'Profil niekompletny'}. Brakujące pola: ${errorData.missingFields.join(', ')}`,
            { duration: 5000 },
          );
        } else {
          toast.error(errorData.error || 'Błąd podczas składania licytacji', {
            duration: 4000,
          });
        }
      }
    } catch (error) {
      console.error('Błąd podczas składania licytacji (catch):', error);
      toast.error('Wystąpił błąd podczas składania licytacji', {
        duration: 4000,
      });
    } finally {
      setIsBidding(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error('Zaloguj się, aby kupić', { duration: 4000 });
      return;
    }

    if (isOwner) {
      toast.error('Nie możesz kupić własnej aukcji', { duration: 4000 });
      return;
    }

    if (!auction.buyNowPrice) {
      toast.error('Cena "Kup teraz" nie jest dostępna', {
        duration: 3000,
      });
      return;
    }

    toast.success('Przekierowywanie do podsumowania zakupu...', {
      duration: 2000,
    });

    // Przekierowanie do strony podsumowującej zakup
    const successData = {
      type: 'buy_now',
      auctionId: auction.id,
      auctionTitle: auction.title,
      price: auction.buyNowPrice,
      seller: {
        name: `${auction.seller.firstName} ${auction.seller.lastName}`,
        id: auction.seller.id,
        rating: 0, // Brak systemu ocen
        salesCount: 0, // Brak danych o sprzedaży
        avatar: null, // Brak awatara
        location: auction.location || 'Brak lokalizacji',
        phone: auction.seller.phoneNumber || 'Brak numeru telefonu',
        email: auction.seller.email,
      },
      timestamp: new Date().toISOString(),
    };

    // Zapisanie danych do localStorage dla strony sukcesu
    localStorage.setItem('auctionSuccess', JSON.stringify(successData));

    // Przekierowanie do strony sukcesu
    setTimeout(() => {
      window.location.href = '/auctions/success';
    }, 1000);
  };

  const minBidAmount = auction.currentPrice + (auction.minBidIncrement || 100);
  const formatPrice = (value: number) => {
    // Zawsze pokazuj w EUR jako domyślnie, ponieważ nie używamy currency z store
    const eur = Math.round(value / ratePLNperEUR);
    return `${eur.toLocaleString('pl-PL')} EUR`;
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12 pt-[320px] pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 relative z-20">
          {/* Główna zawartość */}
          <div className="lg:col-span-3 space-y-8">
            {/* Galeria zdjęć */}
            <GoldenCard className="p-4">
              <div
                className="relative w-full h-[500px] rounded-2xl overflow-hidden bg-black/30 cursor-pointer group"
                onClick={() => auction.images && auction.images[0] && openFullscreen(0)}
              >
                {auction.images && auction.images[0] ? (
                  <>
                    {/* Rozmyte tło wypełniające całość */}
                    <Image
                      src={auction.images[0]}
                      alt="Background"
                      fill
                      className="object-cover blur-xl opacity-50 scale-110"
                      sizes="50vw"
                      priority
                    />
                    {/* Właściwe zdjęcie - w całości */}
                    <Image
                      src={auction.images[0]}
                      alt={auction.title}
                      fill
                      className="object-contain z-10 hover:scale-[1.02] transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                      priority
                      onError={e => {
                        console.error('Image failed to load:', auction.images[0]);
                        console.error('Image error event:', e);
                        // Zamiast ukrywać obraz, pokaż komunikat o błędzie
                        const target = e.currentTarget as HTMLImageElement;
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center text-amber-500/50">
                              <div class="text-center">
                                <div class="text-4xl mb-2">❌</div>
                                <p>Błąd ładowania zdjęcia</p>
                                <p class="text-xs mt-2">URL: ${auction.images[0]}</p>
                              </div>
                            </div>
                          `;
                        }
                      }}
                    />
                    {/* Overlay z ikoną powiększenia */}
                    <div className="absolute inset-0 z-20 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-amber-600/80 rounded-full p-3 backdrop-blur-sm">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-500/50">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📷</div>
                      <p>Brak zdjęcia</p>
                      <p className="text-xs mt-2">URL: {auction.images?.[0] || 'brak'}</p>
                      {auction.images?.[0] && (
                        <Image
                          src={auction.images[0]}
                          alt="test image"
                          width={100}
                          height={100}
                          className="max-w-[100px] max-h-[100px] object-cover rounded"
                          onError={e => console.error('Next.js Image failed:', auction.images[0])}
                        />
                      )}
                    </div>
                  </div>
                )}
                {auction.status === 'ending' && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Kończy się wkrótce!
                  </div>
                )}
              </div>

              {auction.images.length > 1 && (
                <div className="p-4 grid grid-cols-4 gap-2">
                  {auction.images.slice(1).map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square relative rounded-lg overflow-hidden cursor-pointer group hover:ring-2 hover:ring-amber-500/50 transition-all"
                      onClick={() => openFullscreen(index + 1)}
                    >
                      <Image
                        src={image}
                        alt={`${auction.title} ${index + 2}`}
                        fill
                        className="object-cover hover:scale-110 transition-transform duration-300"
                        sizes="200px"
                      />
                      {/* Overlay z ikoną powiększenia */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-amber-600/80 rounded-full p-2">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GoldenCard>

            {/* Szczegóły aukcji */}
            <GoldenCard>
              <h1 className="text-3xl font-bold text-white mb-6">{auction.title}</h1>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 rounded-xl border border-white/5 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  {auction.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  {auction.age} lat
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Users className="w-4 h-4 text-amber-500" />
                  {auction.sex === 'male' ? 'Samiec' : 'Samica'}
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Eye className="w-4 h-4 text-amber-500" />
                  {auction.viewsCount} wyświetleń
                </div>
              </div>

              <div className="prose max-w-none">
                <p className="text-white/80 leading-relaxed">{auction.description}</p>
              </div>
            </GoldenCard>

            {/* Rodowód */}
            <GoldenCard>
              <h2 className="text-2xl font-bold text-white mb-6">Rodowód</h2>
              <div
                className="relative w-full h-96 border border-amber-600/30 rounded-xl overflow-hidden bg-black/30 cursor-pointer group"
                onClick={() =>
                  auction.documents && auction.documents[0] && openFullscreenPedigree()
                }
              >
                {auction.documents && auction.documents.length > 0 ? (
                  <>
                    <Image
                      src={auction.documents[0]}
                      alt={`${auction.title} pedigree`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 800px"
                    />
                    {/* Overlay z ikoną powiększenia */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-amber-600/80 rounded-full p-3">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-500/50">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📄</div>
                      <p className="text-lg mb-2">Brak rodowodu</p>
                      <p className="text-sm">Rodowód nie został jeszcze dodany</p>
                    </div>
                  </div>
                )}
              </div>
            </GoldenCard>

            {/* Historia licytacji */}
            <GoldenCard>
              <h2 className="text-2xl font-bold text-white mb-6">Historia licytacji</h2>

              <div className="space-y-3">
                {auction.bids.map((bid, index) => (
                  <div
                    key={bid.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      bid.isWinning ? 'bg-emerald-900/30 border border-emerald-500/30' : 'bg-black/20 border border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-600/30 rounded-full flex items-center justify-center text-sm font-medium text-amber-400">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white">{bid.bidder.name}</p>
                        <p className="text-sm text-white/60">
                          {format(bid.timestamp, 'dd.MM.yyyy HH:mm', { locale: pl })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-amber-400">{bid.amount.toLocaleString()} zł</p>
                      {bid.isWinning && (
                        <p className="text-sm text-emerald-400 font-medium">Wygrywa</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GoldenCard>
          </div>

          {/* Prawa kolumna */}
          <div className="lg:col-span-2 space-y-8">
            {/* Panel licytacji + Odliczanie */}
            {auction.status !== 'ended' && (
              <GoldenCard>
                {/* Countdown */}
                <div className="text-center mb-8 rounded-xl border border-white/5 bg-black/20 p-4">
                  <div className="text-base text-amber-500/80 mb-2 uppercase tracking-widest text-sm">Pozostało czasu</div>
                  <div
                    className={`text-3xl font-bold ${auction.status === 'ending' ? 'text-red-400' : 'text-white'}`}
                  >
                    {timeLeft || '—'}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-6">Złóż ofertę</h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="bid-amount-input"
                      className="block text-sm font-medium text-white/80 mb-2"
                    >
                      Twoja oferta (min. {formatPrice(minBidAmount)})
                    </label>
                    <input
                      id="bid-amount-input"
                      type="number"
                      value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                      min={minBidAmount}
                      step="50"
                      className="w-full px-3 py-2 border border-amber-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-black/30 text-white placeholder-white/40"
                      placeholder="Wprowadź kwotę oferty"
                      title="Wprowadź kwotę swojej oferty"
                      aria-describedby="bid-amount-help"
                    />
                  </div>

                  <button
                    onClick={handleBid}
                    disabled={!bidAmount || parseFloat(bidAmount) < minBidAmount || isBidding || isOwner}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                      isOwner
                        ? 'bg-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-500 hover:to-amber-600 disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg shadow-amber-900/30'
                    }`}
                    title={isOwner ? 'To Twoja aukcja' : 'Złóż ofertę'}
                  >
                    {isBidding ? 'Licytuję...' : isOwner ? 'To Twoja aukcja' : 'Złóż ofertę'}
                  </button>

                  {auction.buyNowPrice && (
                    <button
                      onClick={handleBuyNow}
                      disabled={isOwner}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                        isOwner
                          ? 'bg-gray-600 cursor-not-allowed opacity-50 text-white'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500'
                      }`}
                      title={isOwner ? 'To Twoja aukcja' : 'Kup teraz'}
                    >
                      {isOwner ? 'To Twoja aukcja' : `Kup teraz za ${formatPrice(auction.buyNowPrice)}`}
                    </button>
                  )}
                </div>
              </GoldenCard>
            )}

            {/* Oferty */}
            <GoldenCard>
              <h3 className="text-xl font-bold text-white mb-6">Oferty</h3>
              <div className="space-y-4">
                {auction.bids.slice(0, 5).map(bid => (
                  <div key={bid.id} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-amber-500"></span>
                    <div className="flex-1">
                      <div className="text-xs text-white/60">
                        {format(bid.timestamp, 'dd MMM • HH:mm', { locale: pl })}
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-amber-400">{formatPrice(bid.amount)}</span>
                        <span className="text-white/60"> od {bid.bidder.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full bg-black/20 border border-amber-600/30 text-amber-400 py-2 px-4 rounded-lg text-sm font-medium hover:bg-amber-600/20 transition-colors">
                Pokaż wszystkie oferty
              </button>
            </GoldenCard>

            {/* Breeder/Supplier */}
            <GoldenCard>
              <h4 className="text-lg font-bold text-white">Breeder(s)</h4>
              <p className="text-sm text-white/80 mt-1">{`${auction.seller.firstName} ${auction.seller.lastName}`}</p>
              <div className="h-px bg-amber-600/30 my-4" />
              <h4 className="text-sm font-semibold text-white">Supplier(s)</h4>
              <p className="text-sm text-white/80 mt-1">{`${auction.seller.firstName} ${auction.seller.lastName}`}</p>
            </GoldenCard>

            {/* Charakterystyka i Ocena jakości */}
            <GoldenCard>
              <h4 className="text-xl font-bold text-white mb-6">Charakterystyka</h4>
              <div className="text-base divide-y divide-amber-600/20 mb-6 rounded-xl border border-white/5 bg-black/20">
                {[
                  ['Płeć', auction.sex === 'male' ? 'Samiec' : 'Samica'],
                  ['Kolor oka', auction.pigeon?.eyeColor || 'Nie podano'],
                  ['Barwa upierzenia', auction.pigeon?.featherColor || 'Nie podano'],
                  ['Dyscypliny', auction.pigeon?.purpose ? JSON.parse(auction.pigeon.purpose).join(', ') : 'Nie podano'],
                  ['Certyfikat DNA', 'Nie podano'],
                  ['Wielkość', 'średni'],
                  ['Budowa korpusu', 'normalny'],
                  ['Witalność', auction.pigeon?.vitality || 'Nie podano'],
                  ['Gęstość barwy', 'bardzo silny'],
                  ['Długość', auction.pigeon?.length || 'Nie podano'],
                  ['Wytrzymałość', auction.pigeon?.endurance || 'Nie podano'],
                  ['Siła widełek', auction.pigeon?.forkStrength || 'Nie podano'],
                  ['Układ widełek', auction.pigeon?.forkAlignment || 'Nie podano'],
                  ['Mięśnie', auction.pigeon?.muscles || 'Nie podano'],
                  ['Balans', auction.pigeon?.balance || 'Nie podano'],
                  ['Plecy', auction.pigeon?.back || 'Nie podano'],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex items-center justify-between py-3 px-4">
                    <span className="text-white/70 font-medium text-base">{label as string}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-semibold text-base">{value as string}</span>
                      <span className="h-4 w-4 rounded-full bg-amber-500" aria-hidden="true" />
                    </div>
                  </div>
                ))}
              </div>

              <h5 className="text-base font-bold text-amber-500/80 uppercase tracking-[0.2em] mb-4 mt-8">
                Opis skrzydła
              </h5>
              <div className="text-base divide-y divide-amber-600/20 rounded-xl border border-white/5 bg-black/20">
                {[
                  ['Pióra rozpłodowe', 'za młody'],
                  ['Lotki', 'długi, normalny'],
                  ['Upierzenie', 'normalne upierzenie'],
                  ['Jakość piór', 'miękki'],
                  ['Lotki II-go rzędu', 'normalny'],
                  ['Elastyczność', 'bardzo giętki'],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex items-center justify-between py-3 px-4">
                    <span className="text-white/70 font-medium text-base">{label as string}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-semibold text-base">{value as string}</span>
                      <span className="h-4 w-4 rounded-full bg-amber-500" aria-hidden="true" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-amber-600/30 text-sm text-white/60 flex items-center justify-between">
                <span className="font-medium">Data aukcji</span>
                <span className="text-amber-400 font-semibold">
                  {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: pl })}
                </span>
              </div>
            </GoldenCard>
          </div>
        </div>
      </div>

      {/* Dodatkowy odstęp na dole */}
      <div className="h-20"></div>

      {/* Modal pełnoekranowy */}
      {auction && (
        <FullscreenImageModal
          isOpen={isFullscreenOpen}
          onClose={closeFullscreen}
          images={isPedigreeFullscreen ? auction.documents || [] : auction.images}
          currentIndex={isPedigreeFullscreen ? 0 : fullscreenImageIndex}
          title={isPedigreeFullscreen ? `${auction.title} - Rodowód` : auction.title}
        />
      )}
    </div>
  );
}
