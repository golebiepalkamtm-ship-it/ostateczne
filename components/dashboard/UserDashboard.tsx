'use client';

import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { CountrySelect } from '@/components/ui/CountrySelect';
import { UnifiedCard } from '@/components/ui/UnifiedCard';
import { getPhoneCodeForCountry } from '@/lib/country-codes';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { GlowingEdgeCard } from '@/components/ui/GlowingEdgeCard';
import { InteractiveCard } from '@/components/ui/InteractiveCard';
// ...existing code...
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { sendEmailVerification } from 'firebase/auth';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle,
  Edit3,
  Gavel,
  Heart,
  Key,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Shield,
  Trophy,
  User,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { debug, info, error, isDev } from '@/lib/logger';
import CreateAuctionForm from '@/components/auctions/CreateAuctionForm';

export function UserDashboard() {
  const { user, dbUser, signOut, refetchDbUser, error: authError, clearError } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [auctionsSubTab, setAuctionsSubTab] = useState<
    'my-auctions' | 'watched' | 'bids' | 'ended' | 'sold'
  >('my-auctions');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    phoneNumber: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Polska',
    phoneCode: '+48',
  });
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [showSmsVerification, setShowSmsVerification] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [isVerifyingSms, setIsVerifyingSms] = useState(false);
  const [showCreateAuctionForm, setShowCreateAuctionForm] = useState(false);
  
  interface Auction {
    id: string;
    title: string;
    description: string;
    category: string;
    startingPrice: number;
    currentPrice: number;
    buyNowPrice?: number | null;
    endTime: string;
    status: string;
    createdAt: string;
    sellerId?: string;
    images?: string[];
  }
  
  interface Bid {
    id: string;
    auctionId: string;
    amount: number;
    createdAt: string;
    auction?: Auction;
  }
  
  const [auctionsData, setAuctionsData] = useState<{
    myAuctions: Auction[];
    watchedAuctions: Auction[];
    myBids: Bid[];
    endedAuctions: Auction[];
    soldAuctions: Auction[];
  }>({
    myAuctions: [],
    watchedAuctions: [],
    myBids: [],
    endedAuctions: [],
    soldAuctions: [],
  });

  // Funkcja do pobierania danych aukcji
  const fetchUserAuctions = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/auctions/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAuctionsData(data);
      }
    } catch (error) {
      console.error('Błąd pobierania aukcji:', error);
    }
  }, [user]);

  // Pobierz aukcje gdy zakładka 'auctions' jest aktywna
  useEffect(() => {
    if (activeTab === 'auctions') {
      fetchUserAuctions();
    }
  }, [activeTab, fetchUserAuctions]);

  // Usunięto console.log aby zmniejszyć spam w konsoli

  const tabs = useMemo(
    () => [
      { id: 'profile', label: 'Profil', icon: User, requiresVerification: false },
      { id: 'auctions', label: 'Moje aukcje', icon: Gavel, requiresVerification: true },
      { id: 'messages', label: 'Wiadomości', icon: MessageSquare, requiresVerification: false },
      { id: 'security', label: 'Bezpieczeństwo', icon: Shield, requiresVerification: false },
      { id: 'notifications', label: 'Powiadomienia', icon: Bell, requiresVerification: false },
    ],
    [],
  );

  // Używamy ref do śledzenia czy już pobraliśmy profil (zapisujemy UID użytkownika)
  const hasFetchedProfile = useRef<string | false>(false);

  const fetchUserProfile = useCallback(async () => {
    if (!user?.uid) return;

    // ⚠️ Sprawdź czy fetch już trwa (zabezpieczenie przed wielokrotnym wywołaniem)
    if (hasFetchedProfile.current === user.uid) {
      if (isDev) debug('⏭️ Fetch już wykonany dla tego użytkownika, pomijam');
      return;
    }

    try {
      hasFetchedProfile.current = user.uid; // Zapisz UID aby zaznaczyć że fetch jest w trakcie
      const token = await user.getIdToken();
      const response = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user;

        // ✅ AKTUALIZUJ profileData z danymi z bazy
        setProfileData({
          displayName:
            userData.firstName && userData.lastName
              ? `${userData.firstName} ${userData.lastName}`
              : user.displayName || '',
          phoneNumber: userData.phoneNumber || '',
          address: userData.address || '',
          city: userData.city || '',
          postalCode: userData.postalCode || '',
          country: 'Polska', // Domyślnie Polska (brak pola w bazie)
          phoneCode: '+48', // Domyślnie +48
        });

        setIsProfileComplete(userData.isProfileVerified);

        if (isDev) debug('✅ Zaktualizowano profileData z API:', userData);
      }
    } catch (err) {
      error('Błąd podczas pobierania profilu:', err instanceof Error ? err.message : err);
      hasFetchedProfile.current = false; // Reset przy błędzie
    }
  }, [user]);

  // Obsługa parametru tab z URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    }

    // Automatyczne otwarcie trybu edycji gdy jest parametr edit=true
    const editParam = searchParams.get('edit');
    if (editParam === 'true' && tab === 'profile') {
      setIsEditingProfile(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // tabs jest memoized z pustą tablicą, więc nie jest potrzebny

  // Inicjalizacja danych profilu - tylko raz przy załadowaniu
  useEffect(() => {
    if (!user?.uid) return;

    // Reset ref gdy zmieni się użytkownik
    if (hasFetchedProfile.current !== false && hasFetchedProfile.current !== user.uid) {
      hasFetchedProfile.current = false;
    }

    if (user && dbUser && hasFetchedProfile.current !== user.uid) {
      // Określ kod kierunkowy na podstawie kraju w danych lub domyślnie Polska
      const country = (dbUser as any)?.country || 'Polska';
      const phoneCode = getPhoneCodeForCountry(country);

      const newDisplayName =
        dbUser.firstName && dbUser.lastName
          ? `${dbUser.firstName} ${dbUser.lastName}`
          : user.displayName || '';

      setProfileData({
        displayName: newDisplayName,
        phoneNumber: dbUser.phoneNumber || user.phoneNumber || '',
        address: dbUser.address || '',
        city: dbUser.city || '',
        postalCode: dbUser.postalCode || '',
        country: country,
        phoneCode: phoneCode,
      });
      if (isDev) debug('Zainicjalizowano dane profilu z bazy:', dbUser);

      // Pobierz dane profilu z bazy danych tylko raz
      fetchUserProfile();
    } else if (user && !dbUser && hasFetchedProfile.current !== user.uid) {
      setProfileData({
        displayName: user.displayName || '',
        phoneNumber: user.phoneNumber || '',
        address: '',
        city: '',
        postalCode: '',
        country: 'Polska',
        phoneCode: '+48',
      });
      fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, dbUser?.id]); // Używamy tylko konkretnych identyfikatorów

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Nie jesteś zalogowany</h1>
          <Link
            href="/auth/register"
            className="px-6 py-3 bg-gradient-to-r from-amber-600/80 to-yellow-600/80 hover:from-amber-700/90 hover:to-yellow-700/90 text-white rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/40 border border-amber-400/50 font-medium"
          >
            Zaloguj się
          </Link>
        </div>
      </div>
    );
  }

  // Jeśli użytkownik jest zalogowany w Firebase, ale nie ma danych z bazy (błąd synchronizacji)
  if (user && !dbUser && authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <h2 className="text-xl font-bold text-red-300 mb-2">Problem z połączeniem</h2>
            <p className="text-red-200 text-sm mb-4">{authError}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  clearError();
                  refetchDbUser();
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-600/80 to-yellow-600/80 hover:from-amber-700/90 hover:to-yellow-700/90 text-white rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/40 border border-amber-400/50 font-medium"
              >
                Spróbuj ponownie
              </button>
              <button
                onClick={signOut}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
              >
                Wyloguj się
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-r from-amber-500/80 to-yellow-600/80 rounded-xl flex items-center justify-center shadow-lg border border-amber-400/50">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
              Panel Użytkownika
              <InfoTooltip
                text="To jest Twoje centrum dowodzenia. Tutaj możesz edytować dane, sprawdzać aukcje i wiadomości."
                position="bottom"
              />
            </h1>
            <p className="text-white text-sm">Zarządzaj swoim kontem i ustawieniami</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <article
            className="glass-morphism relative z-[12] w-full rounded-3xl border-2 p-8 text-white transition-all duration-[2000ms] overflow-hidden backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.9) 0%, rgba(133, 107, 56, 0.85) 25%, rgba(107, 91, 49, 0.8) 50%, rgba(89, 79, 45, 0.75) 75%, rgba(71, 61, 38, 0.7) 100%)',
              borderColor: 'rgba(218, 182, 98, 1)',
              boxShadow: '0 0 20px rgba(218, 182, 98, 1), 0 0 35px rgba(189, 158, 88, 0.8), 0 0 50px rgba(165, 138, 78, 0.5), inset 0 0 40px rgba(71, 61, 38, 0.3), inset 0 2px 0 rgba(218, 182, 98, 0.6), inset 0 -2px 0 rgba(61, 51, 33, 0.4)',
            }}
          >
            {/* Radial gradient overlay jak w AchievementTimeline */}
            <div 
              className="absolute inset-0 pointer-events-none rounded-3xl"
              style={{
                background: `
                  radial-gradient(ellipse 800px 600px at 20% 30%, rgba(255, 245, 200, 0.15) 0%, transparent 50%),
                  radial-gradient(ellipse 600px 500px at 80% 70%, rgba(218, 182, 98, 0.1) 0%, transparent 50%),
                  radial-gradient(ellipse 400px 300px at 50% 50%, rgba(255, 235, 180, 0.08) 0%, transparent 60%)
                `,
                backdropFilter: 'blur(80px)',
                mixBlendMode: 'soft-light',
                zIndex: 1,
              }}
            />
            <div className="relative z-10">
            {/* User Info */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-center mb-6 pb-6 border-b border-white/10"
            >
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-full blur-lg opacity-60"></div>
                <div className="relative w-24 h-24 bg-gradient-to-r from-yellow-500/80 to-amber-600/80 rounded-full flex items-center justify-center shadow-xl border-2 border-amber-400/50">
                  <User className="w-12 h-12 text-white drop-shadow-lg" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {user.displayName || 'Użytkownik'}
              </h2>
              <p className="text-white text-sm mb-3">{user.email}</p>
              <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full w-fit mx-auto">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs font-medium">Aktywne</span>
              </div>
            </motion.div>

            {/* Navigation */}
            <nav className="space-y-2">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isDisabled = tab.requiresVerification && !isProfileComplete;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => !isDisabled && setActiveTab(tab.id)}
                    disabled={isDisabled}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-500/60 border-2 border-amber-400'
                        : isDisabled
                          ? 'text-white/50 cursor-not-allowed opacity-60'
                          : 'text-white hover:bg-amber-900/50 hover:text-white hover:border-2 hover:border-amber-500/60'
                    }`}
                    title={
                      isDisabled
                        ? 'Wymaga uzupełnienia profilu i weryfikacji telefonu przez SMS'
                        : ''
                    }
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-xl"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-white' : ''}`} />
                    <span className="relative z-10 font-medium">{tab.label}</span>
                    {isDisabled && (
                      <Shield className="w-4 h-4 ml-auto text-yellow-400 relative z-10" />
                    )}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-2 w-2 h-2 bg-white rounded-full"
                      />
                    )}
                  </motion.button>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <button
                onClick={signOut}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all duration-300 border border-red-500/30 hover:border-red-500/50"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Wyloguj się</span>
              </button>
            </div>
            </div>
          </article>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <article
            className="glass-morphism relative z-[12] w-full rounded-3xl border-2 p-8 text-white transition-all duration-[2000ms] overflow-hidden backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.9) 0%, rgba(133, 107, 56, 0.85) 25%, rgba(107, 91, 49, 0.8) 50%, rgba(89, 79, 45, 0.75) 75%, rgba(71, 61, 38, 0.7) 100%)',
              borderColor: 'rgba(218, 182, 98, 1)',
              boxShadow: '0 0 20px rgba(218, 182, 98, 1), 0 0 35px rgba(189, 158, 88, 0.8), 0 0 50px rgba(165, 138, 78, 0.5), inset 0 0 40px rgba(71, 61, 38, 0.3), inset 0 2px 0 rgba(218, 182, 98, 0.6), inset 0 -2px 0 rgba(61, 51, 33, 0.4)',
            }}
          >
            {/* Radial gradient overlay jak w AchievementTimeline */}
            <div 
              className="absolute inset-0 pointer-events-none rounded-3xl"
              style={{
                background: `
                  radial-gradient(ellipse 800px 600px at 20% 30%, rgba(255, 245, 200, 0.15) 0%, transparent 50%),
                  radial-gradient(ellipse 600px 500px at 80% 70%, rgba(218, 182, 98, 0.1) 0%, transparent 50%),
                  radial-gradient(ellipse 400px 300px at 50% 50%, rgba(255, 235, 180, 0.08) 0%, transparent 60%)
                `,
                backdropFilter: 'blur(80px)',
                mixBlendMode: 'soft-light',
                zIndex: 1,
              }}
            />
            <div className="relative z-10">
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                      <User className="w-6 h-6 text-amber-400" />
                      Informacje o profilu
                    </h3>
                    <p className="text-white text-sm">Zarządzaj swoimi danymi osobowymi</p>
                  </div>
                  <button
                    onClick={() => {
                      if (isDev) debug('Kliknięto edytuj profil, aktualny stan:', isEditingProfile);
                      if (isDev) debug('Aktualne dane profilu:', profileData);
                      setIsEditingProfile(!isEditingProfile);
                      if (isDev) debug('Nowy stan edycji:', !isEditingProfile);
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-medium ${
                      isEditingProfile
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gradient-to-r from-amber-600/80 to-yellow-600/80 hover:from-amber-700/90 hover:to-yellow-700/90 text-white shadow-lg shadow-amber-500/40 border border-amber-400/50'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{isEditingProfile ? 'Anuluj' : 'Edytuj profil'}</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Podstawowe informacje */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-white text-sm font-semibold">Imię i nazwisko</label>
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={profileData.displayName}
                          onChange={e =>
                            setProfileData({ ...profileData, displayName: e.target.value })
                          }
                          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                          placeholder="Wpisz imię i nazwisko"
                          title="Wpisz imię i nazwisko"
                        />
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-xl">
                          <User className="w-5 h-5 text-amber-400" />
                          <span className="text-white">
                            {profileData.displayName || 'Nie ustawiono'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-white text-sm font-semibold flex items-center">
                        Email
                        <InfoTooltip text="Twój adres email służy do logowania i komunikacji. Nie można go zmienić samodzielnie." />
                      </label>
                      <div className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-xl">
                        <Mail className="w-5 h-5 text-amber-400" />
                        <span className="text-white">{user.email}</span>
                        {user.emailVerified ? (
                          <div title="Email zweryfikowany" className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-xs">Zweryfikowany</span>
                          </div>
                        ) : (
                          <div title="Email niezweryfikowany" className="flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 text-xs">Niezweryfikowany</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Numer telefonu */}
                  <div className="space-y-2">
                    <label className="text-white text-sm font-semibold flex items-center">
                      Numer telefonu
                      <InfoTooltip text="Numer służy do weryfikacji konta i kontaktu z kupującymi. Po wpisaniu numeru, kliknij przycisk 'Zweryfikuj', aby otrzymać kod SMS." />
                    </label>
                    <div className="flex items-center gap-3">
                      {isEditingProfile ? (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-white text-sm whitespace-nowrap">
                            {profileData.phoneCode}
                          </span>
                          <input
                            type="tel"
                            value={profileData.phoneNumber
                              .replace(profileData.phoneCode, '')
                              .trim()}
                            onChange={e => {
                              const value = e.target.value.replace(/\D/g, '');
                              setProfileData({
                                ...profileData,
                                phoneNumber: `${profileData.phoneCode} ${value}`.trim(),
                              });
                            }}
                            className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                            placeholder="123 456 789"
                            title="Wpisz numer telefonu"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 flex-1 bg-gray-800 border border-gray-700 rounded-xl">
                          <Phone className="w-5 h-5 text-green-400" />
                          <span className="text-white">
                            {profileData.phoneNumber || 'Nie ustawiono'}
                          </span>
                        </div>
                      )}
                      {profileData.phoneNumber && (
                        <button
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300"
                          title="Zweryfikuj numer telefonu"
                          onClick={async e => {
                            e.preventDefault();
                            e.stopPropagation();

                            // ⚠️ Walidacja: sprawdź czy numer telefonu jest wypełniony
                            if (!profileData.phoneNumber || profileData.phoneNumber.trim() === '') {
                              toast.error('❌ Najpierw wprowadź numer telefonu w profilu!', {
                                duration: 5000,
                                position: 'top-center',
                              });
                              return;
                            }

                            try {
                              if (isDev)
                                debug(
                                  'Rozpocznij weryfikację SMS dla numeru:',
                                  profileData.phoneNumber,
                                );

                              // Wyślij kod weryfikacyjny SMS
                              const token = await user!.getIdToken();
                              const response = await fetch('/api/auth/send-verification-code', {
                                method: 'POST',
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  phoneNumber: profileData.phoneNumber,
                                }),
                              });

                              if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || 'Błąd wysyłania kodu SMS');
                              }

                              const data = await response.json();

                              // ✅ W DEV mode - pokaż kod w toaście
                              if (isDev && data.code) {
                                toast.success(
                                  `📱 [DEV] Kod weryfikacyjny: ${data.code}\n\nWpisz ten kod w polu poniżej!`,
                                  {
                                    duration: 15000, // 15 sekund
                                    position: 'top-center',
                                    icon: '🔑',
                                    style: {
                                      fontSize: '18px',
                                      fontWeight: 'bold',
                                      padding: '20px',
                                    },
                                  },
                                );
                                info(`🔑 DEV MODE - Kod SMS: ${data.code}`);
                              } else {
                                // Production - tylko info o wysłaniu
                                toast.success(
                                  '📱 Kod weryfikacyjny został wysłany na Twój telefon!',
                                  {
                                    duration: 6000,
                                    position: 'top-center',
                                    icon: '✉️',
                                  },
                                );
                              }

                              // Pokaż modal z polem do wpisania kodu
                              setShowSmsVerification(true);
                              setSmsCode('');
                            } catch (err) {
                              error(
                                'Błąd weryfikacji telefonu:',
                                err instanceof Error ? err.message : err,
                              );
                              toast.error(
                                `❌ ${err instanceof Error ? err.message : 'Nie udało się wysłać kodu SMS'}`,
                                {
                                  duration: 5000,
                                  position: 'top-center',
                                },
                              );
                            }
                          }}
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Adres zamieszkania */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white flex items-center">
                      Adres zamieszkania
                      <InfoTooltip text="Twój adres jest potrzebny do faktur i dokumentacji aukcyjnej." />
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-white text-sm font-semibold">Ulica i numer</label>
                        {isEditingProfile ? (
                          <AddressAutocomplete
                            value={profileData.address}
                            onChange={value => setProfileData({ ...profileData, address: value })}
                            placeholder="Wpisz nazwę ulicy..."
                            type="street"
                            country={profileData.country}
                            onCityChange={
                              profileData.country === 'Polska'
                                ? city => setProfileData({ ...profileData, city })
                                : undefined
                            }
                            onPostalCodeChange={
                              profileData.country === 'Polska'
                                ? postalCode => setProfileData({ ...profileData, postalCode })
                                : undefined
                            }
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-3">
                            <MapPin className="w-4 h-4 text-amber-400" />
                            <span className="text-white">
                              {profileData.address || 'Nie ustawiono'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-white text-sm font-semibold">Miasto</label>
                        {isEditingProfile ? (
                          <AddressAutocomplete
                            value={profileData.city}
                            onChange={value => setProfileData({ ...profileData, city: value })}
                            placeholder="Wpisz nazwę miasta..."
                            type="city"
                            country={profileData.country}
                            onPostalCodeChange={
                              profileData.country === 'Polska'
                                ? postalCode => setProfileData({ ...profileData, postalCode })
                                : undefined
                            }
                            onStreetChange={
                              profileData.country === 'Polska'
                                ? street => setProfileData({ ...profileData, address: street })
                                : undefined
                            }
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-3">
                            <MapPin className="w-4 h-4 text-amber-400" />
                            <span className="text-white">
                              {profileData.city || 'Nie ustawiono'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-white text-sm font-semibold">Kod pocztowy</label>
                        {isEditingProfile ? (
                          <input
                            type="text"
                            value={profileData.postalCode}
                            onChange={e =>
                              setProfileData({ ...profileData, postalCode: e.target.value })
                            }
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                            placeholder="00-000"
                            title="Wpisz kod pocztowy"
                            pattern="[0-9]{2}-[0-9]{3}"
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-3">
                            <MapPin className="w-4 h-4 text-amber-400" />
                            <span className="text-white">
                              {profileData.postalCode || 'Nie ustawiono'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-white text-sm font-semibold">Kraj</label>
                        {isEditingProfile ? (
                          <CountrySelect
                            value={profileData.country}
                            onChange={(country, phoneCode) => {
                              // Wyciągnij numer bez kodu kierunkowego
                              let numberWithoutCode = profileData.phoneNumber;
                              if (numberWithoutCode.startsWith('+')) {
                                // Usuń istniejący kod kierunkowy (wszystkie cyfry po + do pierwszej spacji lub końca)
                                numberWithoutCode = numberWithoutCode
                                  .replace(/^\+\d+\s*/, '')
                                  .trim();
                              }

                              setProfileData({
                                ...profileData,
                                country,
                                phoneCode,
                                phoneNumber: numberWithoutCode
                                  ? `${phoneCode} ${numberWithoutCode}`
                                  : '',
                              });
                            }}
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-3">
                            <MapPin className="w-4 h-4 text-amber-400" />
                            <span className="text-white">{profileData.country}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informacje o koncie */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white flex items-center">
                      Informacje o koncie
                      <InfoTooltip text="Szczegóły dotyczące Twojego konta w systemie." />
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-white text-sm font-semibold flex items-center">
                          Data utworzenia konta
                          <InfoTooltip text="Dzień, w którym dołączyłeś do naszej społeczności." />
                        </label>
                        <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          <span className="text-white">
                            {user.metadata?.creationTime
                              ? new Date(user.metadata.creationTime).toLocaleDateString('pl-PL')
                              : 'Nieznana'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-white text-sm font-semibold flex items-center">
                          Ostatnie logowanie
                          <InfoTooltip text="Data ostatniej aktywności na Twoim koncie." />
                        </label>
                        <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                          <Calendar className="w-4 h-4 text-orange-400" />
                          <span className="text-white">
                            {user.metadata?.lastSignInTime
                              ? new Date(user.metadata.lastSignInTime).toLocaleDateString('pl-PL')
                              : 'Nieznane'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Przyciski akcji */}
                {isEditingProfile && (
                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={async () => {
                        try {
                          if (isDev) debug('Zapisywanie profilu:', profileData);

                          // Parsuj imię i nazwisko z displayName
                          const nameParts = profileData.displayName.trim().split(' ');
                          const firstName = nameParts[0] || '';
                          const lastName = nameParts.slice(1).join(' ') || '';

                          if (!firstName || !lastName) {
                            toast.error('Podaj imię i nazwisko', { duration: 4000 });
                            return;
                          }

                          const token = await user!.getIdToken();
                          const response = await fetch('/api/profile', {
                            method: 'PATCH',
                            headers: {
                              Authorization: `Bearer ${token}`,
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              firstName,
                              lastName,
                              address: profileData.address,
                              city: profileData.city,
                              postalCode: profileData.postalCode,
                              phoneNumber: profileData.phoneNumber,
                            }),
                          });

                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Błąd zapisywania profilu');
                          }

                          const data = await response.json();

                          // ✅ Komunikat sukcesu z informacją o zapisaniu do Prisma
                          toast.success('✅ Profil został zapisany w bazie danych!', {
                            duration: 5000,
                            position: 'top-center',
                            icon: '💾',
                          });

                          setIsEditingProfile(false);

                          // ✅ WYMUŚ ponowne pobranie profilu z bazy
                          hasFetchedProfile.current = false;
                          await fetchUserProfile();

                          // Odśwież dane profilu
                          if (data.user) {
                            setIsProfileComplete(data.user.isProfileVerified);
                          }
                        } catch (err) {
                          error(
                            'Błąd zapisywania profilu:',
                            err instanceof Error ? err.message : err,
                          );
                          toast.error(
                            `❌ Błąd: ${err instanceof Error ? err.message : 'Nie udało się zapisać profilu'}`,
                            {
                              duration: 5000,
                              position: 'top-center',
                            },
                          );
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Zapisz zmiany</span>
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
                    >
                      <span>Anuluj</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'auctions' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {user?.emailVerified ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-white flex items-center">
                        Moje aukcje
                        <InfoTooltip
                          text="Zarządzaj swoimi aukcjami, licytacjami i obserwowanymi przedmiotami."
                          position="bottom"
                        />
                      </h3>
                      <div className="flex gap-2">
                        <Link
                          href="/auctions"
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 font-medium"
                          title="Przeglądaj wszystkie dostępne aukcje"
                        >
                          <Search className="w-4 h-4" />
                          <span>Przeglądaj</span>
                        </Link>
                        <button
                          onClick={() => setShowCreateAuctionForm(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300"
                          title="Wystaw nowego gołębia na sprzedaż"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Utwórz</span>
                        </button>
                      </div>
                    </div>

                    {/* Statystyki */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div
                        className="p-4 rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.9) 0%, rgba(133, 107, 56, 0.85) 25%, rgba(107, 91, 49, 0.8) 50%, rgba(89, 79, 45, 0.75) 75%, rgba(71, 61, 38, 0.7) 100%)',
                          border: '1px solid rgba(218, 182, 98, 1)',
                          boxShadow: '0 0 20px rgba(218, 182, 98, 0.6), inset 0 1px 0 rgba(218, 182, 98, 0.8)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Gavel className="w-5 h-5 text-amber-400" />
                          <div>
                            <h4 className="text-white font-semibold">Moje aukcje</h4>
                            <p className="text-white text-sm font-bold">
                              {auctionsData.myAuctions.length}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div
                        className="p-4 rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.9) 0%, rgba(133, 107, 56, 0.85) 25%, rgba(107, 91, 49, 0.8) 50%, rgba(89, 79, 45, 0.75) 75%, rgba(71, 61, 38, 0.7) 100%)',
                          border: '1px solid rgba(218, 182, 98, 1)',
                          boxShadow: '0 0 20px rgba(218, 182, 98, 0.6), inset 0 1px 0 rgba(218, 182, 98, 0.8)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Heart className="w-5 h-5 text-pink-400" />
                          <div>
                            <h4 className="text-white font-semibold">Obserwowane</h4>
                            <p className="text-white text-sm font-bold">
                              {auctionsData.watchedAuctions.length}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div
                        className="p-4 rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.9) 0%, rgba(133, 107, 56, 0.85) 25%, rgba(107, 91, 49, 0.8) 50%, rgba(89, 79, 45, 0.75) 75%, rgba(71, 61, 38, 0.7) 100%)',
                          border: '1px solid rgba(218, 182, 98, 1)',
                          boxShadow: '0 0 20px rgba(218, 182, 98, 0.6), inset 0 1px 0 rgba(218, 182, 98, 0.8)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                          <div>
                            <h4 className="text-white font-semibold">Moje licytacje</h4>
                            <p className="text-white text-sm font-bold">{auctionsData.myBids.length}</p>
                          </div>
                        </div>
                      </div>
                      <div
                        className="p-4 rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.9) 0%, rgba(133, 107, 56, 0.85) 25%, rgba(107, 91, 49, 0.8) 50%, rgba(89, 79, 45, 0.75) 75%, rgba(71, 61, 38, 0.7) 100%)',
                          border: '1px solid rgba(218, 182, 98, 1)',
                          boxShadow: '0 0 20px rgba(218, 182, 98, 0.6), inset 0 1px 0 rgba(218, 182, 98, 0.8)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <BarChart3 className="w-5 h-5 text-purple-400" />
                          <div>
                            <h4 className="text-white font-semibold">Sprzedane</h4>
                            <p className="text-white text-sm font-bold">
                              {auctionsData.soldAuctions.length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Podzakładki */}
                    <div className="flex gap-2 mb-6 border-b border-white/10">
                      {[
                        { id: 'my-auctions', label: 'Moje aukcje', icon: Gavel },
                        { id: 'watched', label: 'Obserwowane', icon: Heart },
                        { id: 'bids', label: 'Moje licytacje', icon: TrendingUp },
                        { id: 'ended', label: 'Zakończone', icon: Clock },
                        { id: 'sold', label: 'Sprzedane', icon: Trophy },
                      ].map(subTab => {
                        const Icon = subTab.icon;
                        return (
                          <button
                            key={subTab.id}
                            onClick={() => setAuctionsSubTab(subTab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all ${
                              auctionsSubTab === subTab.id
                                ? 'border-amber-500 text-amber-400'
                                : 'border-transparent text-white hover:text-white'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{subTab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Zawartość podzakładki */}
                    <div className="space-y-4">
                      {auctionsSubTab === 'my-auctions' && (
                        <div>
                          <h4 className="text-xl font-semibold text-white mb-4">
                            Moje aktywne aukcje
                          </h4>
                          {auctionsData.myAuctions.length > 0 ? (
                            <div className="space-y-3">
                              {auctionsData.myAuctions.map((auction: any) => (
                                <div
                                  key={auction.id}
                                  className="p-4 rounded-xl"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.85) 0%, rgba(107, 91, 49, 0.8) 50%, rgba(71, 61, 38, 0.75) 100%)',
                                    border: '1px solid rgba(218, 182, 98, 1)',
                                    boxShadow: '0 0 15px rgba(218, 182, 98, 0.5)',
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="text-white font-semibold">{auction.title}</h5>
                                      <p className="text-white text-sm font-semibold">
                                        Aktualna cena: {auction.currentPrice} zł
                                      </p>
                                    </div>
                                    <Link
                                      href={`/auctions/${auction.id}`}
                                      className="px-4 py-2 bg-gradient-to-r from-amber-600/80 to-yellow-600/80 hover:from-amber-700/90 hover:to-yellow-700/90 text-white rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/40 border border-amber-400/50 font-medium"
                                    >
                                      Zobacz
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <Gavel className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <p className="text-white mb-4 font-semibold">
                                Nie masz jeszcze żadnych aktywnych aukcji
                              </p>
                              <Link
                                href="/seller/create-auction"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                              >
                                <Plus className="w-4 h-4" />
                                Utwórz pierwszą aukcję
                              </Link>
                            </div>
                          )}
                        </div>
                      )}

                      {auctionsSubTab === 'watched' && (
                        <div>
                          <h4 className="text-xl font-semibold text-white mb-4">
                            Obserwowane aukcje
                          </h4>
                          {auctionsData.watchedAuctions.length > 0 ? (
                            <div className="space-y-3">
                              {auctionsData.watchedAuctions.map((auction: any) => (
                                <div
                                  key={auction.id}
                                  className="p-4 rounded-xl"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.85) 0%, rgba(107, 91, 49, 0.8) 50%, rgba(71, 61, 38, 0.75) 100%)',
                                    border: '1px solid rgba(218, 182, 98, 1)',
                                    boxShadow: '0 0 15px rgba(218, 182, 98, 0.5)',
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="text-white font-semibold">{auction.title}</h5>
                                      <p className="text-white text-sm font-semibold">
                                        Aktualna cena: {auction.currentPrice} zł
                                      </p>
                                    </div>
                                    <Link
                                      href={`/auctions/${auction.id}`}
                                      className="px-4 py-2 bg-gradient-to-r from-amber-600/80 to-yellow-600/80 hover:from-amber-700/90 hover:to-yellow-700/90 text-white rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/40 border border-amber-400/50 font-medium"
                                    >
                                      Zobacz
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <p className="text-white font-semibold">
                                Nie obserwujesz jeszcze żadnych aukcji
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {auctionsSubTab === 'bids' && (
                        <div>
                          <h4 className="text-xl font-semibold text-white mb-4">
                            Aukcje w których biorę udział
                          </h4>
                          {auctionsData.myBids.length > 0 ? (
                            <div className="space-y-3">
                              {auctionsData.myBids.map((bid: any) => (
                                <div
                                  key={bid.id}
                                  className="p-4 rounded-xl"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.85) 0%, rgba(107, 91, 49, 0.8) 50%, rgba(71, 61, 38, 0.75) 100%)',
                                    border: '1px solid rgba(218, 182, 98, 1)',
                                    boxShadow: '0 0 15px rgba(218, 182, 98, 0.5)',
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="text-white font-semibold">
                                        {bid.auction?.title || 'Aukcja'}
                                      </h5>
                                      <p className="text-white text-sm font-semibold">
                                        Moja oferta: {bid.amount} zł
                                        {bid.isWinning && (
                                          <span className="ml-2 text-green-400">• Wygrywam</span>
                                        )}
                                      </p>
                                    </div>
                                    <Link
                                      href={`/auctions/${bid.auctionId}`}
                                      className="px-4 py-2 bg-gradient-to-r from-amber-600/80 to-yellow-600/80 hover:from-amber-700/90 hover:to-yellow-700/90 text-white rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/40 border border-amber-400/50 font-medium"
                                    >
                                      Zobacz
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <p className="text-white font-semibold">
                                Nie bierzesz jeszcze udziału w żadnych aukcjach
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {auctionsSubTab === 'ended' && (
                        <div>
                          <h4 className="text-xl font-semibold text-white mb-4">
                            Zakończone aukcje
                          </h4>
                          {auctionsData.endedAuctions.length > 0 ? (
                            <div className="space-y-3">
                              {auctionsData.endedAuctions.map((auction: any) => (
                                <div
                                  key={auction.id}
                                  className="p-4 rounded-xl"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.85) 0%, rgba(107, 91, 49, 0.8) 50%, rgba(71, 61, 38, 0.75) 100%)',
                                    border: '1px solid rgba(218, 182, 98, 1)',
                                    boxShadow: '0 0 15px rgba(218, 182, 98, 0.5)',
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="text-white font-semibold">{auction.title}</h5>
                                      <p className="text-white text-sm font-semibold">
                                        Zakończona:{' '}
                                        {new Date(auction.endTime).toLocaleDateString('pl-PL')}
                                      </p>
                                    </div>
                                    <Link
                                      href={`/auctions/${auction.id}`}
                                      className="px-4 py-2 bg-gradient-to-r from-amber-600/80 to-yellow-600/80 hover:from-amber-700/90 hover:to-yellow-700/90 text-white rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/40 border border-amber-400/50 font-medium"
                                    >
                                      Zobacz
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <p className="text-white font-semibold">Brak zakończonych aukcji</p>
                            </div>
                          )}
                        </div>
                      )}

                      {auctionsSubTab === 'sold' && (
                        <div>
                          <h4 className="text-xl font-semibold text-white mb-4">
                            Sprzedane aukcje
                          </h4>
                          {auctionsData.soldAuctions.length > 0 ? (
                            <div className="space-y-3">
                              {auctionsData.soldAuctions.map((auction: any) => (
                                <div
                                  key={auction.id}
                                  className="p-4 rounded-xl"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.85) 0%, rgba(107, 91, 49, 0.8) 50%, rgba(71, 61, 38, 0.75) 100%)',
                                    border: '1px solid rgba(218, 182, 98, 1)',
                                    boxShadow: '0 0 15px rgba(218, 182, 98, 0.5)',
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="text-white font-semibold">{auction.title}</h5>
                                      <p className="text-white text-sm font-semibold">
                                        Sprzedane za: {auction.currentPrice} zł
                                      </p>
                                    </div>
                                    <Link
                                      href={`/auctions/${auction.id}`}
                                      className="px-4 py-2 bg-gradient-to-r from-amber-600/80 to-yellow-600/80 hover:from-amber-700/90 hover:to-yellow-700/90 text-white rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/40 border border-amber-400/50 font-medium"
                                    >
                                      Zobacz
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <p className="text-white font-semibold">Brak sprzedanych aukcji</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-4">🔒 Wymagana weryfikacja Poziomu 3</h3>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6 max-w-2xl mx-auto">
                      <p className="text-white mb-4">
                        Aby uzyskać dostęp do tworzenia aukcji i licytowania, musisz osiągnąć <strong className="text-blue-400">Poziom 3</strong>.
                      </p>
                      <div className="space-y-2 text-left text-sm text-white">
                        <p>📧 <strong className="text-green-400">Poziom 1:</strong> Rejestracja - Ukończone ✓</p>
                        <p>✅ <strong className="text-green-400">Poziom 2:</strong> Weryfikacja email - Ukończone ✓</p>
                        <p>🚀 <strong className="text-yellow-400">Poziom 3:</strong> Profil + Telefon - <strong className="text-yellow-400">Wymagane</strong></p>
                      </div>
                    </div>
                    <Link
                      href="?tab=profile&edit=true"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <User className="w-4 h-4" />
                      <span>Kontynuuj weryfikację</span>
                    </Link>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl font-bold text-white mb-6">Wiadomości</h3>

                <div className="space-y-6">
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.4) 0%, rgba(133, 107, 56, 0.35) 25%, rgba(107, 91, 49, 0.32) 50%, rgba(89, 79, 45, 0.3) 75%, rgba(71, 61, 38, 0.28) 100%)',
                      border: '1px solid rgba(218, 182, 98, 0.6)',
                      boxShadow: '0 0 15px rgba(218, 182, 98, 0.3), inset 0 1px 0 rgba(218, 182, 98, 0.4)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                      <div>
                        <h4 className="text-white font-semibold">Skrzynka odbiorcza</h4>
                        <p className="text-white text-sm font-semibold">Komunikuj się z innymi hodowcami</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div
                      className="p-4 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.35) 0%, rgba(107, 91, 49, 0.3) 50%, rgba(71, 61, 38, 0.25) 100%)',
                        border: '1px solid rgba(218, 182, 98, 0.5)',
                        boxShadow: '0 0 10px rgba(218, 182, 98, 0.2)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-semibold">Brak nowych wiadomości</h4>
                          <p className="text-white text-sm font-semibold">Sprawdź ponownie później</p>
                        </div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Link
                      href="/messages"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Otwórz wiadomości</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  Bezpieczeństwo
                  <InfoTooltip text="Zarządzaj zabezpieczeniami swojego konta." position="bottom" />
                </h3>

                {showChangePassword ? (
                  <ChangePasswordForm
                    onSuccess={() => setShowChangePassword(false)}
                    onCancel={() => setShowChangePassword(false)}
                  />
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div
                        className="flex items-center justify-between p-4 rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.85) 0%, rgba(107, 91, 49, 0.8) 50%, rgba(71, 61, 38, 0.75) 100%)',
                          border: '1px solid rgba(218, 182, 98, 1)',
                          boxShadow: '0 0 15px rgba(218, 182, 98, 0.5)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-blue-400" />
                          <div>
                            <h4 className="text-white font-semibold flex items-center">
                              Weryfikacja email
                              <InfoTooltip text="Potwierdzenie adresu email zwiększa bezpieczeństwo konta." />
                            </h4>
                            <p className="text-white text-sm font-semibold">
                              {user.emailVerified
                                ? 'Email zweryfikowany'
                                : 'Email niezweryfikowany'}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs ${
                            user.emailVerified
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {user.emailVerified ? 'Zweryfikowany' : 'Niezweryfikowany'}
                        </div>
                      </div>

                      {!user.emailVerified && (
                        <div
                          className="flex items-center justify-between p-4 rounded-xl"
                          style={{
                            background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.35) 0%, rgba(107, 91, 49, 0.3) 50%, rgba(71, 61, 38, 0.25) 100%)',
                            border: '1px solid rgba(218, 182, 98, 0.5)',
                            boxShadow: '0 0 10px rgba(218, 182, 98, 0.2)',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-yellow-400" />
                            <div>
                              <h4 className="text-white font-semibold">Weryfikacja email</h4>
                              <p className="text-white text-sm font-semibold">
                                Wyślij ponownie email weryfikacyjny
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                await sendEmailVerification(user);
                                debug('Email weryfikacyjny wysłany pomyślnie');
                                toast.success('Email weryfikacyjny został wysłany ponownie!', {
                                  duration: 4000,
                                  position: 'bottom-right',
                                });
                              } catch (err) {
                                error(
                                  'Błąd wysyłania email:',
                                  err instanceof Error ? err.message : err,
                                );
                                toast.error(
                                  'Wystąpił błąd podczas wysyłania email. Spróbuj ponownie.',
                                  {
                                    duration: 4000,
                                    position: 'bottom-right',
                                  },
                                );
                              }
                            }}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all duration-300"
                          >
                            Wyślij ponownie
                          </button>
                        </div>
                      )}

                      <div
                        className="p-4 rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.9) 0%, rgba(133, 107, 56, 0.85) 25%, rgba(107, 91, 49, 0.8) 50%, rgba(89, 79, 45, 0.75) 75%, rgba(71, 61, 38, 0.7) 100%)',
                          border: '1px solid rgba(218, 182, 98, 1)',
                          boxShadow: '0 0 20px rgba(218, 182, 98, 0.6), inset 0 1px 0 rgba(218, 182, 98, 0.8)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-green-400" />
                          <div>
                            <h4 className="text-white font-semibold">Konto zabezpieczone</h4>
                            <p className="text-white text-sm font-semibold">
                              Twoje konto jest chronione przez Firebase Authentication
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        className="flex items-center justify-between p-4 rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.85) 0%, rgba(107, 91, 49, 0.8) 50%, rgba(71, 61, 38, 0.75) 100%)',
                          border: '1px solid rgba(218, 182, 98, 1)',
                          boxShadow: '0 0 15px rgba(218, 182, 98, 0.5)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Key className="w-4 h-4 text-purple-400" />
                          <div>
                            <h4 className="text-white font-semibold flex items-center">
                              Hasło
                              <InfoTooltip text="Regularna zmiana hasła chroni Twoje konto przed włamaniem." />
                            </h4>
                            <p className="text-white text-sm font-semibold">Zarządzaj swoim hasłem</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowChangePassword(true)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-600/80 to-yellow-600/80 hover:from-amber-700/90 hover:to-yellow-700/90 text-white rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/40 border border-amber-400/50 font-medium"
                        >
                          Zmień hasło
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  Powiadomienia
                  <InfoTooltip
                    text="Wybierz, jakie informacje chcesz otrzymywać od serwisu."
                    position="bottom"
                  />
                </h3>

                <div className="space-y-4">
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 117, 66, 0.4) 0%, rgba(133, 107, 56, 0.35) 25%, rgba(107, 91, 49, 0.32) 50%, rgba(89, 79, 45, 0.3) 75%, rgba(71, 61, 38, 0.28) 100%)',
                      border: '1px solid rgba(218, 182, 98, 0.6)',
                      boxShadow: '0 0 15px rgba(218, 182, 98, 0.3), inset 0 1px 0 rgba(218, 182, 98, 0.4)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-blue-400" />
                      <div>
                        <h4 className="text-white font-semibold">Powiadomienia email</h4>
                        <p className="text-white text-sm font-semibold">
                          Otrzymuj powiadomienia o nowych aukcjach i aktualizacjach
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3">
                      <span className="text-white flex items-center">
                        Nowe aukcje
                        <InfoTooltip text="Otrzymuj email, gdy pojawią się nowe gołębie na sprzedaż." />
                      </span>
                      <input
                        type="checkbox"
                        className="toggle"
                        defaultChecked
                        aria-label="Włącz powiadomienia o nowych aukcjach"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3">
                      <span className="text-white flex items-center">
                        Aktualizacje konta
                        <InfoTooltip text="Informacje o zmianach w regulaminie, statusie weryfikacji itp." />
                      </span>
                      <input
                        type="checkbox"
                        className="toggle"
                        defaultChecked
                        aria-label="Włącz powiadomienia o aktualizacjach konta"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3">
                      <span className="text-white flex items-center">
                        Powiadomienia SMS
                        <InfoTooltip text="Otrzymuj ważne alerty (np. o wygranej aukcji) na telefon." />
                      </span>
                      <input
                        type="checkbox"
                        className="toggle"
                        aria-label="Włącz powiadomienia SMS"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            </div>
          </article>
        </div>
      </div>

      {/* Modal weryfikacji SMS */}
      {showSmsVerification && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-glass p-8 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Weryfikacja telefonu</h3>
              <p className="text-white text-sm">
                Wpisz 6-cyfrowy kod wysłany na numer <br />
                <span className="font-semibold text-white">{profileData.phoneNumber}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm mb-2 font-semibold">Kod weryfikacyjny</label>
                <input
                  type="text"
                  value={smsCode}
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setSmsCode(value);
                  }}
                  className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white text-center text-2xl font-mono tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (smsCode.length !== 6) {
                      toast.error('Kod musi mieć 6 cyfr', { duration: 3000 });
                      return;
                    }

                    setIsVerifyingSms(true);
                    try {
                      const token = await user!.getIdToken();
                      const response = await fetch('/api/auth/verify-sms-code', {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ code: smsCode }),
                      });

                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Nieprawidłowy kod');
                      }

                      // ✅ SUKCES - Telefon zweryfikowany!
                      toast.success(
                        '🎉 Gratulacje! Poziom 3 odblokowany! Masz teraz pełny dostęp - możesz tworzyć aukcje, licytować i korzystać ze wszystkich funkcji platformy!',
                        {
                          duration: 8000,
                          position: 'top-center',
                          icon: '🚀',
                        },
                      );

                      setShowSmsVerification(false);
                      setSmsCode('');
                      setIsProfileComplete(true);

                      // ✅ WYMUŚ ponowne pobranie profilu z bazy (z zaktualizowaną rolą)
                      hasFetchedProfile.current = false;
                      await fetchUserProfile();

                      // ✅ Odśwież również AuthContext aby mieć najnowszą rolę
                      await refetchDbUser();
                    } catch (err) {
                      error('Błąd weryfikacji SMS:', err instanceof Error ? err.message : err);
                      toast.error(
                        `❌ ${err instanceof Error ? err.message : 'Nieprawidłowy kod'}`,
                        {
                          duration: 5000,
                        },
                      );
                    } finally {
                      setIsVerifyingSms(false);
                    }
                  }}
                  disabled={isVerifyingSms || smsCode.length !== 6}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-300"
                >
                  {isVerifyingSms ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Weryfikacja...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Zweryfikuj</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowSmsVerification(false);
                    setSmsCode('');
                  }}
                  disabled={isVerifyingSms}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-all duration-300"
                >
                  Anuluj
                </button>
              </div>

              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-white text-xs mb-2">Nie otrzymałeś kodu?</p>
                <button
                  onClick={async () => {
                    // ⚠️ Walidacja: sprawdź czy numer telefonu jest wypełniony
                    if (!profileData.phoneNumber || profileData.phoneNumber.trim() === '') {
                      toast.error('❌ Brak numeru telefonu w profilu!', {
                        duration: 4000,
                        position: 'top-center',
                      });
                      return;
                    }

                    try {
                      const token = await user!.getIdToken();
                      const response = await fetch('/api/auth/send-verification-code', {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ phoneNumber: profileData.phoneNumber }),
                      });

                      const data = await response.json();

                      // ✅ W DEV mode - pokaż nowy kod w toaście
                      if (isDev && data.code) {
                        toast.success(`🔑 [DEV] Nowy kod: ${data.code}`, {
                          duration: 12000,
                          position: 'top-center',
                          style: {
                            fontSize: '18px',
                            fontWeight: 'bold',
                          },
                        });
                        info(`🔑 DEV MODE - Nowy kod SMS: ${data.code}`);
                      } else {
                        toast.success('📱 Nowy kod został wysłany!', {
                          duration: 4000,
                        });
                      }
                    } catch {
                      toast.error('Błąd wysyłania kodu', { duration: 3000 });
                    }
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  Wyślij ponownie
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal formularza tworzenia aukcji */}
      {showCreateAuctionForm && (
        <div className="fixed inset-0 z-[999999] flex items-start justify-center px-4 pt-32 pointer-events-none overflow-y-auto" style={{ minHeight: '100vh', paddingBottom: '400px' }}>
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 pointer-events-none"
          />
          {/* Formularz */}
          <div className="relative z-[999999] w-full max-w-6xl mt-16 mb-96 pointer-events-auto" style={{ paddingBottom: '400px' }}>
            <CreateAuctionForm
              showHeader={true}
              onCancel={() => setShowCreateAuctionForm(false)}
              onSuccess={() => {
                setShowCreateAuctionForm(false);
                // Odśwież dane aukcji jeśli potrzeba
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
