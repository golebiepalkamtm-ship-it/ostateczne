'use client';

import CreateAuctionForm from '@/components/auctions/CreateAuctionForm';
import { FullscreenImageModal } from '@/components/ui/FullscreenImageModal';
import { UnifiedButton } from '@/components/ui/UnifiedButton';
import { UnifiedCard } from '@/components/ui/UnifiedCard';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore, useError, useFilteredAuctions, useLoading } from '@/store/useAppStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Gavel, Plus, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function AuctionsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { setAuctions, setSearchTerm, setLoading, setError } = useAppStore();
  const { auctions, searchTerm, selectedCategory, sortBy } = useFilteredAuctions();
  const isLoading = useLoading();
  const error = useError();

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
      <div className="min-h-screen flex items-center justify-center -mt-48">
        <UnifiedCard
          variant="glass"
          glow={true}
          hover={true}
          className="p-8 text-center"
        >
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Ładowanie aukcji...</h2>
          <p className="text-white/70">Przygotowujemy najlepsze oferty dla Ciebie</p>
        </UnifiedCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 -mt-48">
        <UnifiedCard
          variant="glass"
          glow={true}
          hover={true}
          className="p-8 text-center"
        >
          <p className="text-lg mb-4 text-red-400">{error}</p>
          <UnifiedButton
            variant="primary"
            onClick={() => window.location.reload()}
            intensity="high"
          >
            Spróbuj ponownie
          </UnifiedButton>
        </UnifiedCard>
      </div>
    );
  }

  return (
    <>
      <div className="pt-1 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full mx-auto text-center mb-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase tracking-[0.15em] text-white/80 mb-3">Nasze Aukcje</h1>
          <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-4 max-w-2xl mx-auto">
            Licytuj ekskluzywne gołębie pocztowe z rodowodami championów
          </p>
        </div>

        {/* Content */}
        <div className="relative z-10 px-2 sm:px-4 lg:px-6 xl:px-8 2xl:px-12">
          <div className="w-full">
            {/* Filters */}
            <motion.section
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <UnifiedCard
                variant="glass"
                glow={true}
                hover={true}
                className="p-6"
              >
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 z-10" />
                    <input
                      type="text"
                      placeholder=""
                      aria-label="Szukaj gołębi"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 solid-morphism rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 border-2 border-white bg-white/90"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex gap-2">
                    {['all', 'ACTIVE', 'PENDING', 'CANCELLED', 'ENDED'].map(status => (
                      <div key={status}>
                        <button
                          onClick={() => setFilterStatus(status as typeof filterStatus)}
                          className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                            filterStatus === status
                              ? 'bg-gradient-to-r from-blue-600/80 to-blue-800/80 text-white'
                              : 'glass-morphism text-white/70 hover:glass-morphism-strong hover:text-white'
                          } relative overflow-hidden`}
                        >
                          {status === 'all' && 'Wszystkie'}
                          {status === 'ACTIVE' && 'Aktywne'}
                          {status === 'PENDING' && 'Oczekujące'}
                          {status === 'CANCELLED' && 'Anulowane'}
                          {status === 'ENDED' && 'Zakończone'}
                        </button>
                      </div>
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
                    className="flex items-center gap-2 btn-primary"
                    aria-label="Dodaj nową aukcję"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Dodaj aukcję</span>
                  </button>
                </div>
              </UnifiedCard>
            </motion.section>

            {/* Auctions List View */}
            <div className="flex flex-col space-y-4">
              {statusFilteredAuctions.length > 0 ? (
                statusFilteredAuctions.map((auction, index) => (
                  <motion.div
                    key={auction.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    viewport={{ once: true, margin: '-50px' }}
                    className="group"
                  >
                    <Link href={`/auctions/${auction.id}`} className="block">
                      <UnifiedCard
                        variant="glass"
                        glow={true}
                        hover={true}
                        className="overflow-hidden hover:border-blue-500/30 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* Left: Image Section */}
                          <div
                            className="relative w-full md:w-64 lg:w-80 aspect-[4/3] md:aspect-auto md:h-auto bg-gray-900 flex-shrink-0 cursor-pointer group/image border-r border-white/10"
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              openFullscreen(auction);
                            }}
                          >
                            {auction.images?.[0] ? (
                              <>
                                <Image
                                  src={auction.images[0]}
                                  alt={auction.title}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, 320px"
                                  priority={index < 2}
                                />
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                                  <div className="bg-black/50 rounded-full p-2 backdrop-blur-sm">
                                    <Search className="w-5 h-5 text-white" />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/30">
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
                          <div className="flex-1 p-4 md:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-blue-400 font-bold text-lg">
                                  #{String(index + 1).padStart(2, '0')}
                                </span>
                                <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                                  {auction.title}
                                </h3>
                              </div>
                              
                              {/* Pigeon specific info if available (from description or fields) */}
                              <div className="mb-4">
                                <p className="text-lg font-mono text-white/90 mb-2 bg-white/10 inline-block px-2 py-0.5 rounded border border-white/10">
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
                            <div className="flex items-center gap-4 text-xs text-white/50 mt-auto pt-4 border-t border-white/10">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-white/70">Sprzedawca:</span>
                                <span>{auction.sellerId}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-white/70">ID:</span>
                                <span>{auction.id.substring(0, 8)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Price & Action Section */}
                          <div className="w-full md:w-72 lg:w-80 p-4 md:p-6 bg-black/20 flex flex-col justify-center gap-4">
                            {/* Timer */}
                            <div className="text-center pb-4 border-b border-white/10">
                              <div className="text-xs uppercase tracking-widest text-white/50 mb-1">Czas do końca</div>
                              <div className={`text-xl font-mono font-bold flex items-center justify-center gap-2 ${isEndingSoon(auction.endTime) ? 'text-red-400' : 'text-white'}`}>
                                <Calendar className="w-4 h-4" />
                                {formatTimeLeft(auction.endTime)}
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-center">
                              <div className="text-xs uppercase tracking-widest text-white/50 mb-1">Aktualna cena</div>
                              <div className="text-3xl font-bold text-white mb-1">
                                {`${Math.round(auction.currentPrice / useAppStore.getState().ratePLNperEUR)} EUR`}
                              </div>
                              <div className="text-xs text-white/40">
                                {auction.currentPrice.toLocaleString()} PLN
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-2" onClick={e => e.stopPropagation()}>
                              {auction.status === 'ENDED' ? (
                                <div className="w-full py-3 bg-gray-700/50 text-white/50 text-center rounded font-medium cursor-not-allowed">
                                  Aukcja zakończona
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <button
                                    onClick={() => router.push(`/auctions/${auction.id}`)}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors uppercase tracking-wide text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                                  >
                                    <Gavel className="w-4 h-4" />
                                    Licytuj teraz
                                  </button>
                                  
                                  {auction.buyNowPrice && (
                                    <button
                                      onClick={() => handleBuyNow(auction.id)}
                                      className="w-full py-2 bg-green-600/90 hover:bg-green-500/90 text-white font-semibold rounded transition-colors text-xs uppercase tracking-wide"
                                    >
                                      Kup teraz: {Math.round(auction.buyNowPrice / useAppStore.getState().ratePLNperEUR)} EUR
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </UnifiedCard>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-3 py-12">
                  <UnifiedCard
                    variant="glass"
                    glow={true}
                    hover={true}
                    className="p-12 text-center"
                  >
                    <Gavel className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold mb-2">Brak aukcji</h3>
                    <p className="text-white/70 mb-6">
                      Nie znaleziono aukcji spełniających kryteria wyszukiwania.
                    </p>
                    <UnifiedButton
                      variant="secondary"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                      }}
                    >
                      Wyczyść filtry
                    </UnifiedButton>
                  </UnifiedCard>
                </div>
              )}
            </div>
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
            className="fixed inset-0 z-[99999]"
            style={{ pointerEvents: 'auto' }}
          >
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto"
              onClick={() => setShowCreateForm(false)}
            />
            {/* Centered Form - only one container */}
            <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
              <div className="relative z-10 w-full max-w-6xl my-auto pointer-events-auto">
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
