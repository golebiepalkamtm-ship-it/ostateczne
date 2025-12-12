'use client';

import CreateAuctionForm from '@/components/auctions/CreateAuctionForm';
import { FullscreenImageModal } from '@/components/ui/FullscreenImageModal';
import { SmartImage } from '@/components/ui/SmartImage';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore, useError, useFilteredAuctions, useLoading, useRatePLNperEUR } from '@/store/useAppStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Gavel, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';

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
      { threshold: 0.35 }
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

// GoldenCard Component with solid styling and 3D depth
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
            className="absolute inset-0 rounded-3xl border-2"
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
        className={`card-glow-edge relative z-[12] w-full rounded-3xl border-2 p-8 text-white transition-all duration-[2000ms] overflow-hidden ${className}`}
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

export function AuctionsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { setAuctions, setSearchTerm, setLoading, setError } = useAppStore();
  const { auctions, searchTerm, selectedCategory, sortBy } = useFilteredAuctions();
  const isLoading = useLoading();
  const error = useError();
  const ratePLNperEUR = useRatePLNperEUR();

  // Compute filtered auctions with useMemo to prevent infinite loops
  const filteredAuctions = useMemo(() => {
    const filtered = auctions.filter(auction => {
      const matchesSearch =
        auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || auction.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort
    const sortedFiltered = [...filtered];
    switch (sortBy) {
      case 'newest':
        sortedFiltered.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'oldest':
        sortedFiltered.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'price-low':
        sortedFiltered.sort((a, b) => a.currentPrice - b.currentPrice);
        break;
      case 'price-high':
        sortedFiltered.sort((a, b) => b.currentPrice - a.currentPrice);
        break;
      case 'ending-soon':
        sortedFiltered.sort(
          (a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime()
        );
        break;
    }

    return sortedFiltered;
  }, [auctions, searchTerm, selectedCategory, sortBy]);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'ACTIVE' | 'ENDED' | 'CANCELLED' | 'PENDING'
  >('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [nowTs, setNowTs] = useState<number>(Date.now());
  // const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({}) // unused
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImages, setFullscreenImages] = useState<string[]>([]);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [fullscreenTitle, setFullscreenTitle] = useState('');

  // Wydzielenie fetchAuctions jako osobna funkcja, którą można wywołać w innych miejscach
  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auctions');
      if (response.ok) {
        const data = await response.json();
        // Mapuj assets na images dla kompatybilności
        const auctionsWithImages = (data.auctions || []).map(
          (auction: {
            assets?: Array<{ type: string; url: string }>;
            [key: string]: unknown;
          }) => ({
            ...auction,
            images:
              auction.assets
                ?.filter((asset: { type: string; url: string }) => asset.type === 'IMAGE')
                .map((asset: { type: string; url: string }) => asset.url) || [],
            documents:
              auction.assets
                ?.filter((asset: { type: string; url: string }) => asset.type === 'DOCUMENT')
                .map((asset: { type: string; url: string }) => asset.url) || [],
          })
        );
        setAuctions(auctionsWithImages);
      } else {
        setError('Błąd podczas ładowania aukcji');
      }
    } catch {
      setError('Błąd podczas ładowania aukcji');
    } finally {
      setLoading(false);
    }
  }, [setAuctions, setLoading, setError]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // Live ticking for countdowns
  useEffect(() => {
    const interval = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeLeft = (endTimeStr: string) => {
    const endTime = new Date(endTimeStr);
    const diff = endTime.getTime() - nowTs;
    if (diff <= 0) return 'Zakończona';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  const isEndingSoon = (endTimeStr: string) => {
    const endTime = new Date(endTimeStr);
    const diff = endTime.getTime() - nowTs;
    return diff > 0 && diff <= 3600000; // < 1h
  };

  // const formatPrice = (price: number) => {
  //     return `${price.toLocaleString()} zł`
  // } // unused

  const openFullscreen = (auction: { images?: string[]; title: string }) => {
    if (auction.images && auction.images.length > 0) {
      setFullscreenImages(auction.images);
      setFullscreenIndex(0);
      setFullscreenTitle(auction.title);
      setIsFullscreen(true);
    }
  };

  const handleBuyNow = (auctionId: string) => {
    const auction = filteredAuctions.find(a => a.id === auctionId);
    if (!auction || !auction.buyNowPrice) return;

    const successData = {
      type: 'buy_now',
      auctionId: auction.id,
      auctionTitle: auction.title,
      price: auction.buyNowPrice,
      seller: {
        name: auction.sellerId, // Używamy sellerId jako nazwy
        id: auction.sellerId,
        rating: 0, // Brak systemu ocen
        salesCount: 0, // Brak danych o sprzedaży
        avatar: null, // Brak awatara
        location: 'Brak lokalizacji',
        phone: 'Brak numeru telefonu',
        email: 'Brak email',
      },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('auctionSuccess', JSON.stringify(successData));
    window.location.href = '/auctions/success';
  };

  // Filter by status - memoize to prevent infinite loops
  const statusFilteredAuctions = useMemo(
    () =>
      filteredAuctions.filter(auction => filterStatus === 'all' || auction.status === filterStatus),
    [filteredAuctions, filterStatus]
  );

  if (isLoading) {
    return (
      <div className="pt-[250px] min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <GoldenCard className="p-8 text-center max-w-md">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Ładowanie aukcji...</h2>
          <p className="text-white/70">Przygotowujemy najlepsze oferty dla Ciebie</p>
        </GoldenCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-[250px] min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <GoldenCard className="p-8 text-center max-w-md">
          <p className="text-lg mb-4 text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-lg hover:from-amber-500 hover:to-amber-600 transition-all duration-300 shadow-lg shadow-amber-900/30"
          >
            Spróbuj ponownie
          </button>
        </GoldenCard>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section - z padding-top dla miejsca na logo i nawigację, delay 0.8s czeka na animację fade-in-fwd logo/nawigacji */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="relative z-10 pt-44 pb-12 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16"
      >
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl font-bold uppercase tracking-[0.5em] text-white/60 mb-6">Nasze Aukcje</h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-lg md:text-xl text-white/90 mb-8 max-w-4xl mx-auto"
          >
            Licytuj ekskluzywne gołębie pocztowe z rodowodami championów
          </motion.p>
        </div>
      </motion.section>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pb-20">
        <div className="max-w-[1600px] mx-auto">
            {/* Filters */}
            <section className="mb-12">
              <GoldenCard className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-5 h-5 z-10" />
                    <input
                      type="text"
                      placeholder="Szukaj aukcji..."
                      aria-label="Szukaj gołębi"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-full text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300 border-2 border-amber-600/50 bg-black/30"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex gap-2 flex-wrap justify-center">
                    {['all', 'ACTIVE', 'PENDING', 'CANCELLED', 'ENDED'].map(status => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status as typeof filterStatus)}
                        className={`px-4 py-2 rounded-xl transition-all duration-300 border ${
                          filterStatus === status
                            ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500 shadow-lg shadow-amber-900/30'
                            : 'bg-black/20 text-white/70 border-white/10 hover:border-amber-500/50 hover:text-white'
                        }`}
                      >
                        {status === 'all' && 'Wszystkie'}
                        {status === 'ACTIVE' && 'Aktywne'}
                        {status === 'PENDING' && 'Oczekujące'}
                        {status === 'CANCELLED' && 'Anulowane'}
                        {status === 'ENDED' && 'Zakończone'}
                      </button>
                    ))}
                  </div>

                  {/* Create Auction Button */}
                  <button
                    onClick={() => {
                      if (user) {
                        setShowCreateForm(true);
                      } else {
                        router.push('/auth/register');
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-lg hover:from-amber-500 hover:to-amber-600 transition-all duration-300 shadow-lg shadow-amber-900/30"
                    aria-label="Dodaj nową aukcję"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Dodaj aukcję</span>
                  </button>
                </div>
              </GoldenCard>
            </section>

            {/* Auctions List View */}
            <div className="flex flex-col space-y-6">
              {statusFilteredAuctions.length > 0 ? (
                statusFilteredAuctions.map((auction, index) => (
                  <div key={auction.id} className="group">
                    <Link href={`/auctions/${auction.id}`} className="block">
                      <GoldenCard className="overflow-hidden p-0">
                        <div className="flex flex-col md:flex-row">
                          {/* Left: Image Section */}
                          <div
                            className="relative w-full md:w-64 lg:w-80 aspect-[4/3] md:aspect-auto md:h-auto bg-black/30 flex-shrink-0 cursor-pointer group/image border-r border-amber-600/30"
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              openFullscreen(auction);
                            }}
                          >
                            {auction.images?.[0] ? (
                              <>
                                <SmartImage
                                  src={auction.images[0]}
                                  alt={auction.title}
                                  fill
                                  className="object-cover"
                                  priority={index < 2}
                                />
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                                  <div className="bg-amber-600/80 rounded-full p-2 backdrop-blur-sm">
                                    <Search className="w-5 h-5 text-white" />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-amber-500/30">
                                <div className="text-center">
                                  <div className="text-3xl mb-2">📷</div>
                                  <p className="text-xs">Brak zdjęcia</p>
                                </div>
                              </div>
                            )}
                            {/* Status Badge - Absolute on image */}
                            <div className="absolute top-2 left-2">
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-bold text-white shadow-md uppercase tracking-wider
                                  ${auction.status === 'ACTIVE' ? 'bg-emerald-600' : ''}
                                  ${auction.status === 'PENDING' ? 'bg-amber-600' : ''}
                                  ${auction.status === 'CANCELLED' ? 'bg-gray-500' : ''}
                                  ${auction.status === 'ENDED' ? 'bg-rose-600' : ''}
                                `}
                              >
                                {auction.status === 'ACTIVE' && 'Aktywna'}
                                {auction.status === 'PENDING' && 'Oczekuje'}
                                {auction.status === 'CANCELLED' && 'Anulowana'}
                                {auction.status === 'ENDED' && 'Zakończona'}
                              </span>
                            </div>
                          </div>

                          {/* Middle: Info Section */}
                          <div className="flex-1 p-4 md:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-amber-600/20 bg-gradient-to-r from-black/10 to-transparent">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-amber-500 font-bold text-lg">
                                  #{String(index + 1).padStart(2, '0')}
                                </span>
                                <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                                  {auction.title}
                                </h3>
                              </div>
                              
                              {/* Pigeon specific info if available (from description or fields) */}
                              <div className="mb-4">
                                <p className="text-lg font-mono text-white/90 mb-2 bg-black/20 inline-block px-2 py-0.5 rounded border border-amber-600/30">
                                  {/* Próba wyciągnięcia nr obrączki z opisu lub pola - placeholder */}
                                  {/* W przyszłości warto dodać pole ringNumber do obiektu aukcji na liście */}
                                  PL-DE-BE-NL
                                </p>
                                <p className="text-sm text-white/70 line-clamp-2 md:line-clamp-3 leading-relaxed">
                                  {auction.description}
                                </p>
                              </div>
                            </div>

                            {/* Footer Info */}
                            <div className="flex items-center gap-4 text-xs text-white/50 mt-auto pt-4 border-t border-amber-600/20">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-amber-500/70">Sprzedawca:</span>
                                <span>{auction.sellerId}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-amber-500/70">ID:</span>
                                <span>{auction.id.substring(0, 8)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Price & Action Section */}
                          <div className="w-full md:w-72 lg:w-80 p-4 md:p-6 bg-black/20 flex flex-col justify-center gap-4">
                            {/* Timer */}
                            <div className="text-center pb-4 border-b border-amber-600/20">
                              <div className="text-xs uppercase tracking-widest text-amber-500/60 mb-1">Czas do końca</div>
                              <div className={`text-xl font-mono font-bold flex items-center justify-center gap-2 ${isEndingSoon(auction.endTime) ? 'text-red-400' : 'text-white'}`}>
                                <Calendar className="w-4 h-4" />
                                {formatTimeLeft(auction.endTime)}
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-center">
                              <div className="text-xs uppercase tracking-widest text-amber-500/60 mb-1">Aktualna cena</div>
                              <div className="text-3xl font-bold text-amber-400 mb-1">
                                {`${Math.round(auction.currentPrice / ratePLNperEUR)} EUR`}
                              </div>
                              <div className="text-xs text-white/40">
                                {auction.currentPrice.toLocaleString()} PLN
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-2" onClick={e => e.stopPropagation()}>
                              {auction.status === 'ENDED' ? (
                                <div className="w-full py-3 bg-gray-700/50 text-white/50 text-center rounded-lg font-medium cursor-not-allowed">
                                  Aukcja zakończona
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <button
                                    onClick={() => router.push(`/auctions/${auction.id}`)}
                                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-lg transition-all duration-300 uppercase tracking-wide text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30"
                                  >
                                    <Gavel className="w-4 h-4" />
                                    Licytuj teraz
                                  </button>
                                  
                                  {auction.buyNowPrice && (
                                    <button
                                      onClick={() => handleBuyNow(auction.id)}
                                      className="w-full py-2 bg-emerald-600/90 hover:bg-emerald-500/90 text-white font-semibold rounded-lg transition-colors text-xs uppercase tracking-wide"
                                    >
                                      Kup teraz: {Math.round(auction.buyNowPrice / ratePLNperEUR)} EUR
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </GoldenCard>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-12">
                  <GoldenCard className="p-12 text-center">
                    <Gavel className="w-16 h-16 text-amber-500/30 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold text-white mb-2">Brak aukcji</h3>
                    <p className="text-white/70 mb-6">
                      Nie znaleziono aukcji spełniających kryteria wyszukiwania.
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                      }}
                      className="px-6 py-3 bg-black/30 border border-amber-600/50 text-amber-400 font-semibold rounded-lg hover:bg-amber-600/20 transition-all duration-300"
                    >
                      Wyczyść filtry
                    </button>
                  </GoldenCard>
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Modal aukcji w stylu panelu dashboardu */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[999999]"
            style={{ pointerEvents: 'auto' }}
          >
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-none"
            />
            {/* Centered Form - only one container */}
            <div className="absolute inset-0 flex items-start justify-center px-4 pt-32 pointer-events-none overflow-y-auto" style={{ minHeight: '100vh', paddingBottom: '400px' }}>
              <div className="relative z-[999999] w-full max-w-6xl mt-16 mb-96 pointer-events-auto" style={{ paddingBottom: '400px' }}>
                <CreateAuctionForm
                  showHeader={true}
                  onSuccess={() => {
                    setShowCreateForm(false);
                    fetchAuctions(); // Odśwież listę aukcji po utworzeniu
                  }}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Modal */}
      <FullscreenImageModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        images={fullscreenImages}
        currentIndex={fullscreenIndex}
        title={fullscreenTitle}
      />
    </>
  );
}
