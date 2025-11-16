'use client';

import { useAuth } from '@/contexts/AuthContext';
import { UnifiedCard } from '@/components/ui/UnifiedCard';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Camera,
  CheckCircle,
  DollarSign,
  Gavel,
  LogOut,
  Settings,
  Star,
  Trash2,
  Users,
  XCircle,
  Activity,
  FileText,
  Database,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Shield,
  Download,
  RefreshCw,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import AdminAuctions from './admin/AdminAuctions';
import AdminOverview from './admin/AdminOverview';
import AdminUsers from './admin/AdminUsers';

// Rozszerz Firebase User o właściwość role
declare module 'firebase/auth' {
  interface User {
    role?: string;
  }
}

interface StatsResponse {
  totalUsers: number;
  totalAuctions: number;
  totalTransactions: number;
  disputes: number;
}

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Auction {
  id: string;
  title: string;
  description: string;
  category: string;
  startingPrice: number;
  currentPrice: number;
  buyNowPrice: number | null;
  reservePrice: number | null;
  startTime: string;
  endTime: string;
  status: string;
  isApproved: boolean;
  createdAt: string;
  seller: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface Bidder {
  id: string;
  amount: number;
  bidder: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  createdAt: string;
}

interface Transaction {
  id: string;
  amount: number;
  commission: number;
  status: 'pending' | 'completed' | 'disputed';
  createdAt: string;
  auction?: { title: string };
  buyer?: { firstName: string; lastName: string; email: string };
  seller?: { firstName: string; lastName: string; email: string };
}

interface Reference {
  id: string;
  breederName: string;
  dogName: string;
  status: string;
  location: string;
  experience: string;
  rating: number;
  testimonial: string;
  createdAt: string;
  isApproved: boolean;
  achievements?: Array<{
    pigeon: string;
    ringNumber: string;
    results?: Array<{
      place: string;
      competition: string;
      date: string;
    }>;
  }>;
}

interface Meeting {
  id: string;
  breederName: string;
  date: string;
  status: string;
  title: string;
  location: string;
  isApproved: boolean;
  user: {
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  notes?: string;
  description?: string;
  images?: string[];
}

export default function AdminDashboard() {
  const { user: firebaseUser, dbUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(10);
  const [usersRole, setUsersRole] = useState<string>('');
  const [usersStatus, setUsersStatus] = useState<string>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<{
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
  }>({
    firstName: '',
    lastName: '',
    role: 'USER',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Auctions state
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [auctionsTotal, setAuctionsTotal] = useState(0);
  const [auctionsPage, setAuctionsPage] = useState(1);
  const [auctionsPageSize, setAuctionsPageSize] = useState(10);
  const [approving, setApproving] = useState<string | null>(null);
  const [auctionTab, setAuctionTab] = useState<'pending' | 'active'>('pending');
  const [activeAuctions, setActiveAuctions] = useState<Auction[]>([]);
  const [activeAuctionsTotal, setActiveAuctionsTotal] = useState(0);
  const [activeAuctionsPage, setActiveAuctionsPage] = useState(1);
  const [activeAuctionsPageSize, setActiveAuctionsPageSize] = useState(10);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [auctionBidders, setAuctionBidders] = useState<Bidder[]>([]);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [editingAuctionData, setEditingAuctionData] = useState<Partial<Auction>>({});

  // Transactions state
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [txsTotal, setTxsTotal] = useState(0);
  const [txsPage, setTxsPage] = useState(1);
  const [txsPageSize, setTxsPageSize] = useState(10);
  const [txsStatus, setTxsStatus] = useState<string>('');

  // References state
  const [references, setReferences] = useState<Reference[]>([]);
  const [, setReferencesTotal] = useState(0);
  const [referencesStatus, setReferencesStatus] = useState<'pending' | 'approved' | 'all'>(
    'pending'
  );

  // Meetings state
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [, setMeetingsTotal] = useState(0);
  const [meetingsStatus, setMeetingsStatus] = useState<'pending' | 'approved' | 'all'>('pending');

  const tabs = [
    { id: 'overview', label: 'Przegląd', icon: BarChart3 },
    { id: 'users', label: 'Użytkownicy', icon: Users },
    { id: 'auctions', label: 'Aukcje', icon: Gavel },
    { id: 'references', label: 'Referencje', icon: Star },
    { id: 'meetings', label: 'Spotkania', icon: Camera },
    { id: 'transactions', label: 'Transakcje', icon: DollarSign },
    { id: 'metrics', label: 'Metryki', icon: Activity },
    { id: 'logs', label: 'Logi', icon: FileText },
    { id: 'reports', label: 'Raporty', icon: TrendingUp },
    { id: 'settings', label: 'Ustawienia', icon: Settings },
  ];

  // Load stats
  const loadStats = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Błąd podczas ładowania statystyk:', error);
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser]);

  // Load users
  const loadUsers = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const params = new URLSearchParams({
        page: usersPage.toString(),
        pageSize: usersPageSize.toString(),
        ...(usersRole && { role: usersRole }),
        ...(usersStatus && { status: usersStatus }),
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.items);
        setUsersTotal(data.total);
      }
    } catch (error) {
      console.error('Błąd podczas ładowania użytkowników:', error);
    }
  }, [firebaseUser, usersPage, usersPageSize, usersRole, usersStatus]);

  // Load auctions
  const loadAuctions = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const params = new URLSearchParams({
        page: auctionsPage.toString(),
        limit: auctionsPageSize.toString(),
      });

      const response = await fetch(`/api/admin/auctions/pending?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAuctions(data.auctions || []);
        setAuctionsTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Błąd podczas ładowania aukcji:', error);
    }
  }, [firebaseUser, auctionsPage, auctionsPageSize]);

  // Load active auctions
  const loadActiveAuctions = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const params = new URLSearchParams({
        page: activeAuctionsPage.toString(),
        limit: activeAuctionsPageSize.toString(),
      });

      const response = await fetch(`/api/admin/auctions/active?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setActiveAuctions(data.auctions || []);
        setActiveAuctionsTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Błąd podczas ładowania aktywnych aukcji:', error);
    }
  }, [firebaseUser, activeAuctionsPage, activeAuctionsPageSize]);

  // User handlers
  const handleEditUser = useCallback((user: User) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      isActive: user.isActive,
    });
  }, []);

  const handleSaveUser = useCallback(async () => {
    if (!editingUser || !firebaseUser) return;

    setSaving(true);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        await loadUsers();
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Błąd podczas zapisywania użytkownika:', error);
    } finally {
      setSaving(false);
    }
  }, [editingUser, editForm, loadUsers, firebaseUser]);

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      if (!firebaseUser) return;
      setDeleting(true);
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          await loadUsers();
        }
      } catch (error) {
        console.error('Błąd podczas usuwania użytkownika:', error);
      } finally {
        setDeleting(false);
      }
    },
    [loadUsers, firebaseUser]
  );

  // Auction handlers
  const handleApproveAuction = useCallback(
    async (auctionId: string) => {
      if (!firebaseUser) return;
      setApproving(auctionId);
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/admin/auctions/${auctionId}/approve`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          await loadAuctions();
          await loadActiveAuctions();
        }
      } catch (error) {
        console.error('Błąd podczas zatwierdzania aukcji:', error);
      } finally {
        setApproving(null);
      }
    },
    [loadAuctions, loadActiveAuctions, firebaseUser]
  );

  const handleRejectAuction = useCallback(
    async (auctionId: string) => {
      if (!firebaseUser) return;
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/admin/auctions/${auctionId}/reject`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          await loadAuctions();
        }
      } catch (error) {
        console.error('Błąd podczas odrzucania aukcji:', error);
      }
    },
    [loadAuctions, firebaseUser]
  );

  const handleEditAuction = useCallback((auction: Auction) => {
    setEditingAuction(auction);
    setEditingAuctionData({
      title: auction.title,
      description: auction.description,
      startingPrice: auction.startingPrice,
      currentPrice: auction.currentPrice,
      buyNowPrice: auction.buyNowPrice,
      reservePrice: auction.reservePrice,
    });
  }, []);

  const handleSaveAuction = useCallback(async () => {
    if (!editingAuction || !firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/admin/auctions/${editingAuction.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingAuctionData),
      });

      if (response.ok) {
        await loadAuctions();
        await loadActiveAuctions();
        setEditingAuction(null);
      }
    } catch (error) {
      console.error('Błąd podczas zapisywania aukcji:', error);
    }
  }, [editingAuction, editingAuctionData, loadAuctions, loadActiveAuctions, firebaseUser]);

  const handleSelectAuction = useCallback(async (auction: Auction | null) => {
    setSelectedAuction(auction);
    if (auction && firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/admin/auctions/${auction.id}/bids`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAuctionBidders(data);
        }
      } catch (error) {
        console.error('Błąd podczas ładowania licytacji:', error);
      }
    }
  }, [firebaseUser]);

  // Helper functions
  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'disputed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'active':
        return 'Aktywny';
      case 'pending':
        return 'Oczekuje';
      case 'blocked':
        return 'Zablokowany';
      case 'completed':
        return 'Zakończona';
      case 'disputed':
        return 'Spór';
      default:
        return status;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function getRoleText(_role: string) {
    // Unused helper - may be used in future
    // switch (role) {
    //   case 'USER':
    //     return 'Użytkownik';
    //   case 'ADMIN':
    //     return 'Administrator';
    //   default:
    //     return role;
    // }
    return '';
  }

  // Load transactions
  const loadTransactions = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const params = new URLSearchParams({
        page: txsPage.toString(),
        pageSize: txsPageSize.toString(),
        ...(txsStatus && { status: txsStatus }),
      });

      const response = await fetch(`/api/admin/transactions?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTxs(data.items || []);
        setTxsTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Błąd podczas ładowania transakcji:', error);
    }
  }, [firebaseUser, txsPage, txsPageSize, txsStatus]);

  // Load references
  const loadReferences = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(
        `/api/admin/references?page=1&limit=50&status=${referencesStatus}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setReferences(data.references || []);
        setReferencesTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Błąd podczas ładowania referencji:', error);
    }
  }, [firebaseUser, referencesStatus]);

  // Load meetings
  const loadMeetings = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(
        `/api/admin/breeder-meetings?page=1&limit=50&status=${meetingsStatus}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
        setMeetingsTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Błąd podczas ładowania spotkań:', error);
    }
  }, [firebaseUser, meetingsStatus]);

  // Reference handlers
  const approveReference = useCallback(
    async (referenceId: string, isApproved: boolean) => {
      if (!firebaseUser) return;
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/admin/references/${referenceId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isApproved }),
        });

        if (response.ok) {
          await loadReferences();
        }
      } catch (error) {
        console.error('Błąd podczas aktualizacji referencji:', error);
      }
    },
    [loadReferences, firebaseUser]
  );

  const deleteReference = useCallback(
    async (referenceId: string) => {
      if (!firebaseUser) return;
      if (!confirm('Czy na pewno chcesz usunąć tę referencję?')) return;

      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/admin/references/${referenceId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          await loadReferences();
        }
      } catch (error) {
        console.error('Błąd podczas usuwania referencji:', error);
      }
    },
    [loadReferences, firebaseUser]
  );

  // Meeting handlers
  const approveMeeting = useCallback(
    async (meetingId: string, isApproved: boolean) => {
      if (!firebaseUser) return;
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/admin/breeder-meetings/${meetingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isApproved }),
        });

        if (response.ok) {
          await loadMeetings();
        }
      } catch (error) {
        console.error('Błąd podczas aktualizacji spotkania:', error);
      }
    },
    [loadMeetings, firebaseUser]
  );

  const deleteMeeting = useCallback(
    async (meetingId: string) => {
      if (!firebaseUser) return;
      if (!confirm('Czy na pewno chcesz usunąć to spotkanie?')) return;

      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/admin/breeder-meetings/${meetingId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          await loadMeetings();
        }
      } catch (error) {
        console.error('Błąd podczas usuwania spotkania:', error);
      }
    },
    [loadMeetings, firebaseUser]
  );

  // Effects
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, loadUsers]);

  useEffect(() => {
    if (activeTab === 'auctions') {
      loadAuctions();
      loadActiveAuctions();
    }
  }, [activeTab, loadAuctions, loadActiveAuctions]);

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    }
  }, [activeTab, loadTransactions]);

  useEffect(() => {
    if (activeTab === 'references') {
      loadReferences();
    }
  }, [activeTab, loadReferences]);

  useEffect(() => {
    if (activeTab === 'meetings') {
      loadMeetings();
    }
  }, [activeTab, loadMeetings]);

  // Check admin access
  useEffect(() => {
    if (dbUser && dbUser.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [dbUser, router]);

  if (!firebaseUser || !dbUser || dbUser.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen relative w-full">
      <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12 py-10 text-white">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold text-gradient bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent mb-2">
                Panel Administratora
              </h1>
              <p className="text-white/70 mt-2 text-xl">
                Kompleksowe zarządzanie platformą, użytkownikami, aukcjami i transakcjami
              </p>
            </div>
            <button
              onClick={() => router.push('/api/auth/signout')}
              className="glass-nav-button flex items-center gap-2 px-6 py-3 text-white rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 border border-white/30"
            >
              <LogOut className="w-5 h-5" />
              <span>Wyloguj</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <UnifiedCard variant="glass" className="sticky top-8">
              {/* Admin Info */}
              <div className="text-center mb-8 pb-8 border-b border-white/20">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-32 h-32 bg-gradient-to-br from-red-500 via-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/40"
                >
                  <Shield className="w-16 h-16 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {firebaseUser.displayName || `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim() || 'Administrator'}
                </h2>
                <p className="text-white/70 text-base mb-4">{firebaseUser.email || dbUser.email}</p>
                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
                  <div className="w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-red-400 text-sm font-semibold">Administrator</span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 text-base ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                          : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 hover:scale-102'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="font-semibold">{tab.label}</span>
                    </motion.button>
                  );
                })}
              </nav>
            </UnifiedCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'overview' && <AdminOverview stats={stats} isLoading={isLoading} />}

              {activeTab === 'users' && (
                <AdminUsers
                  users={users}
                  usersTotal={usersTotal}
                  usersPage={usersPage}
                  usersPageSize={usersPageSize}
                  usersRole={usersRole}
                  usersStatus={usersStatus}
                  editingUser={editingUser}
                  editForm={editForm}
                  saving={saving}
                  deleting={deleting}
                  onPageChange={setUsersPage}
                  onPageSizeChange={setUsersPageSize}
                  onRoleFilter={setUsersRole}
                  onStatusFilter={setUsersStatus}
                  onEditUser={handleEditUser}
                  onSaveUser={handleSaveUser}
                  onDeleteUser={handleDeleteUser}
                  onCancelEdit={() => setEditingUser(null)}
                  onFormChange={(field, value) =>
                    setEditForm(prev => ({ ...prev, [field]: value }))
                  }
                />
              )}

              {activeTab === 'auctions' && (
                <AdminAuctions
                  auctions={auctions}
                  auctionsTotal={auctionsTotal}
                  auctionsPage={auctionsPage}
                  auctionsPageSize={auctionsPageSize}
                  auctionTab={auctionTab}
                  activeAuctions={activeAuctions}
                  activeAuctionsTotal={activeAuctionsTotal}
                  activeAuctionsPage={activeAuctionsPage}
                  activeAuctionsPageSize={activeAuctionsPageSize}
                  selectedAuction={selectedAuction}
                  auctionBidders={auctionBidders}
                  editingAuction={editingAuction}
                  editingAuctionData={editingAuctionData}
                  approving={approving}
                  onPageChange={setAuctionsPage}
                  onPageSizeChange={setAuctionsPageSize}
                  onTabChange={setAuctionTab}
                  onActivePageChange={setActiveAuctionsPage}
                  onActivePageSizeChange={setActiveAuctionsPageSize}
                  onSelectAuction={handleSelectAuction}
                  onApproveAuction={handleApproveAuction}
                  onRejectAuction={handleRejectAuction}
                  onEditAuction={handleEditAuction}
                  onSaveAuction={handleSaveAuction}
                  onCancelEdit={() => setEditingAuction(null)}
                  onAuctionDataChange={(field, value) =>
                    setEditingAuctionData((prev: Partial<Auction>) => ({ ...prev, [field]: value }))
                  }
                />
              )}

              {activeTab === 'transactions' && (
                <UnifiedCard variant="glass" className="p-8">
                  <h3 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-yellow-400" />
                    Zarządzanie Transakcjami
                  </h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white/70 mb-2">Status</label>
                    <select
                      value={txsStatus}
                      onChange={e => {
                        setTxsPage(1);
                        setTxsStatus(e.target.value);
                      }}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      aria-label="Filtr statusu transakcji"
                      title="Filtr statusu transakcji"
                    >
                      <option value="">Wszystkie</option>
                      <option value="PENDING">Oczekuje</option>
                      <option value="COMPLETED">Zakończona</option>
                      <option value="DISPUTED">Spór</option>
                    </select>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-3 px-4 text-white font-medium">Aukcja</th>
                          <th className="text-left py-3 px-4 text-white font-medium">Kupujący</th>
                          <th className="text-left py-3 px-4 text-white font-medium">Sprzedawca</th>
                          <th className="text-left py-3 px-4 text-white font-medium">Kwota</th>
                          <th className="text-left py-3 px-4 text-white font-medium">Prowizja</th>
                          <th className="text-left py-3 px-4 text-white font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-white font-medium">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {txs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-white/70">
                              Brak danych transakcji
                            </td>
                          </tr>
                        ) : (
                          txs.map(tx => (
                            <tr key={tx.id} className="border-b border-white/10 hover:bg-white/5">
                              <td className="py-3 px-4 text-white">
                                {tx.auction?.title || 'Aukcja'}
                              </td>
                              <td className="py-3 px-4 text-white/80">
                                {`${tx.buyer?.firstName || ''} ${tx.buyer?.lastName || ''}`.trim() ||
                                  tx.buyer?.email ||
                                  ''}
                              </td>
                              <td className="py-3 px-4 text-white/80">
                                {`${tx.seller?.firstName || ''} ${tx.seller?.lastName || ''}`.trim() ||
                                  tx.seller?.email ||
                                  ''}
                              </td>
                              <td className="py-3 px-4 text-white">
                                {Number(tx.amount || 0).toLocaleString()} zł
                              </td>
                              <td className="py-3 px-4 text-white">
                                {Number(tx.commission || 0).toLocaleString()} zł
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(String(tx.status || 'pending'))}`}
                                >
                                  {getStatusText(String(tx.status || 'pending'))}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-white/70">
                                {new Date(tx.createdAt).toLocaleDateString('pl-PL')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-white/70 text-sm">
                      Strona {txsPage} z {Math.max(1, Math.ceil(txsTotal / txsPageSize))} (
                      {txsTotal} transakcji)
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={txsPage <= 1}
                        onClick={() => setTxsPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded transition-all"
                      >
                        Poprzednia
                      </button>
                      <button
                        disabled={txsPage >= Math.ceil(txsTotal / txsPageSize)}
                        onClick={() => setTxsPage(p => p + 1)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded transition-all"
                      >
                        Następna
                      </button>
                      <select
                        value={txsPageSize}
                        onChange={e => {
                          setTxsPage(1);
                          setTxsPageSize(parseInt(e.target.value, 10));
                        }}
                        className="ml-2 border border-white/20 rounded px-2 py-1 bg-white/10 text-white"
                        aria-label="Rozmiar strony transakcji"
                        title="Rozmiar strony transakcji"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                </UnifiedCard>
              )}

              {activeTab === 'references' && (
                <UnifiedCard variant="glass" className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                      <Star className="w-8 h-8 text-purple-400" />
                      Zarządzanie Referencjami
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReferencesStatus('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          referencesStatus === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        Oczekujące ({referencesStatus === 'pending' ? references.length : 0})
                      </button>
                      <button
                        onClick={() => setReferencesStatus('approved')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          referencesStatus === 'approved'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        Zatwierdzone
                      </button>
                      <button
                        onClick={() => setReferencesStatus('all')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          referencesStatus === 'all'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        Wszystkie
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {references.length === 0 ? (
                      <div className="text-center py-8 text-white/70">
                        Brak referencji do wyświetlenia
                      </div>
                    ) : (
                      references.map(reference => (
                        <div key={reference.id} className="border border-white/20 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-white">{reference.breederName}</h4>
                              <p className="text-sm text-white/70">{reference.location}</p>
                              <p className="text-sm text-white/70">
                                Doświadczenie: {reference.experience}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < reference.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-white/30'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  reference.isApproved
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}
                              >
                                {reference.isApproved ? 'Zatwierdzona' : 'Oczekuje'}
                              </span>
                            </div>
                          </div>
                          <p className="text-white/80 mb-3">{reference.testimonial}</p>
                          {reference.achievements && reference.achievements.length > 0 && (
                            <div className="mb-3">
                              <h5 className="font-medium text-white mb-2">Osiągnięcia:</h5>
                              <div className="space-y-1">
                                {reference.achievements.map((achievement, index) => (
                                  <div key={index} className="text-sm text-white/70">
                                    <strong>{achievement.pigeon}</strong> ({achievement.ringNumber})
                                    -{' '}
                                    {achievement.results
                                      ?.map(
                                        result =>
                                          `${result.place} miejsce w ${result.competition} (${result.date})`
                                      )
                                      .join(', ')}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-3 border-t border-white/10">
                            <span className="text-sm text-white/50">
                              Dodano: {new Date(reference.createdAt).toLocaleDateString('pl-PL')}
                            </span>
                            <div className="flex gap-2">
                              {!reference.isApproved && (
                                <>
                                  <button
                                    onClick={() => approveReference(reference.id, true)}
                                    className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Zatwierdź
                                  </button>
                                  <button
                                    onClick={() => approveReference(reference.id, false)}
                                    className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Odrzuć
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => deleteReference(reference.id)}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors text-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                                Usuń
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </UnifiedCard>
              )}

              {activeTab === 'meetings' && (
                <UnifiedCard variant="glass" className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                      <Camera className="w-8 h-8 text-pink-400" />
                      Zarządzanie Spotkaniami z Hodowcami
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMeetingsStatus('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          meetingsStatus === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        Oczekujące ({meetingsStatus === 'pending' ? meetings.length : 0})
                      </button>
                      <button
                        onClick={() => setMeetingsStatus('approved')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          meetingsStatus === 'approved'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        Zatwierdzone
                      </button>
                      <button
                        onClick={() => setMeetingsStatus('all')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          meetingsStatus === 'all'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        Wszystkie
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {meetings.length === 0 ? (
                      <div className="text-center py-8 text-white/70">
                        Brak spotkań do wyświetlenia
                      </div>
                    ) : (
                      meetings.map(meeting => (
                        <div key={meeting.id} className="border border-white/20 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-white">{meeting.title}</h4>
                              <p className="text-sm text-white/70">{meeting.location}</p>
                              <p className="text-sm text-white/70">
                                Data: {new Date(meeting.date).toLocaleDateString('pl-PL')}
                              </p>
                              <p className="text-sm text-white/70">
                                Dodane przez: {meeting.user.firstName} {meeting.user.lastName}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                meeting.isApproved
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}
                            >
                              {meeting.isApproved ? 'Zatwierdzone' : 'Oczekuje'}
                            </span>
                          </div>
                          {meeting.description && (
                            <p className="text-white/80 mb-3">{meeting.description}</p>
                          )}
                          {meeting.images && meeting.images.length > 0 && (
                            <div className="mb-3">
                              <h5 className="font-medium text-white mb-2">
                                Zdjęcia ({meeting.images.length}):
                              </h5>
                              <div className="grid grid-cols-4 gap-2">
                                {meeting.images.slice(0, 4).map((image: string, index: number) => (
                                  <div
                                    key={index}
                                    className="aspect-square bg-gray-700 rounded-lg overflow-hidden relative"
                                  >
                                    <Image
                                      src={image}
                                      alt={`Zdjęcie ${index + 1}`}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ))}
                                {meeting.images.length > 4 && (
                                  <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
                                    <span className="text-sm text-white/70">
                                      +{meeting.images.length - 4}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-3 border-t border-white/10">
                            <span className="text-sm text-white/50">
                              Dodano: {new Date(meeting.createdAt).toLocaleDateString('pl-PL')}
                            </span>
                            <div className="flex gap-2">
                              {!meeting.isApproved && (
                                <>
                                  <button
                                    onClick={() => approveMeeting(meeting.id, true)}
                                    className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Zatwierdź
                                  </button>
                                  <button
                                    onClick={() => approveMeeting(meeting.id, false)}
                                    className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Odrzuć
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => deleteMeeting(meeting.id)}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors text-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                                Usuń
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </UnifiedCard>
              )}

              {activeTab === 'metrics' && (
                <div className="space-y-6">
                  <UnifiedCard variant="glass">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-semibold text-white flex items-center gap-3">
                        <Activity className="w-6 h-6 text-blue-400" />
                        Metryki Systemowe
                      </h3>
                      <a
                        href="/api/metrics"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Eksportuj
                      </a>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/15 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-white/70 text-base font-medium">Prometheus</p>
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                        <p className="text-3xl font-bold text-white mb-2">Aktywny</p>
                        <p className="text-white/60 text-sm mb-4">Zbieranie metryk w czasie rzeczywistym</p>
                        <a
                          href="http://localhost:9090"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 text-base font-semibold hover:underline inline-flex items-center gap-2"
                        >
                          Otwórz dashboard →
                        </a>
                      </div>
                      <div className="p-6 bg-purple-500/10 border border-purple-500/30 rounded-xl hover:bg-purple-500/15 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-white/70 text-base font-medium">Grafana</p>
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                        <p className="text-3xl font-bold text-white mb-2">Aktywny</p>
                        <p className="text-white/60 text-sm mb-4">Wizualizacja metryk i dashboardy</p>
                        <a
                          href="http://localhost:4000"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 text-base font-semibold hover:underline inline-flex items-center gap-2"
                        >
                          Otwórz dashboard →
                        </a>
                      </div>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                      <p className="text-white/70 text-base font-medium mb-3">Endpoint metryk</p>
                      <code className="text-white text-base bg-black/40 px-4 py-3 rounded-lg block font-mono">
                        /api/metrics
                      </code>
                      <p className="text-white/60 text-sm mt-3">Dostępny w formacie Prometheus</p>
                    </div>
                  </UnifiedCard>

                  <UnifiedCard variant="glass" className="p-8">
                    <h4 className="text-2xl font-bold text-white mb-6">Metryki w czasie rzeczywistym</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-white/80 text-base font-medium">Żądania HTTP (24h)</span>
                          <Activity className="w-5 h-5 text-blue-400" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-2">Ładowanie...</p>
                        <p className="text-white/60 text-sm">Wszystkie requesty do API</p>
                      </div>
                      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-white/80 text-base font-medium">Średni czas odpowiedzi</span>
                          <Database className="w-5 h-5 text-green-400" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-2">Ładowanie...</p>
                        <p className="text-white/60 text-sm">Czas odpowiedzi API</p>
                      </div>
                      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-white/80 text-base font-medium">Błędy (24h)</span>
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <p className="text-3xl font-bold text-red-400 mb-2">Ładowanie...</p>
                        <p className="text-white/60 text-sm">Błędy serwera i klienta</p>
                      </div>
                    </div>
                  </UnifiedCard>
                </div>
              )}

              {activeTab === 'logs' && (
                <UnifiedCard variant="glass">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-semibold text-white flex items-center gap-3">
                      <FileText className="w-6 h-6 text-yellow-400" />
                      Logi Systemowe
                    </h3>
                    <button className="btn-secondary flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Odśwież
                    </button>
                  </div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    <div className="p-4 bg-red-500/10 border-l-4 border-red-500 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-red-400 font-semibold text-sm">ERROR</span>
                        <span className="text-white/50 text-xs">2025-11-15 10:18:17</span>
                      </div>
                      <p className="text-white/90 text-sm">
                        PrismaClientKnownRequestError: The table `public.User` does not exist
                      </p>
                      <p className="text-white/60 text-xs mt-1">app/api/profile/route.ts:170</p>
                    </div>
                    <div className="p-4 bg-yellow-500/10 border-l-4 border-yellow-500 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-yellow-400 font-semibold text-sm">WARN</span>
                        <span className="text-white/50 text-xs">2025-11-15 10:15:00</span>
                      </div>
                      <p className="text-white/90 text-sm">Rate limit warning: User approaching limit</p>
                    </div>
                    <div className="p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-400 font-semibold text-sm">INFO</span>
                        <span className="text-white/50 text-xs">2025-11-15 10:14:48</span>
                      </div>
                      <p className="text-white/90 text-sm">User sync completed: admin@palka-mtm.pl</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <select className="input-field flex-1">
                      <option>Wszystkie poziomy</option>
                      <option>ERROR</option>
                      <option>WARN</option>
                      <option>INFO</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Szukaj w logach..."
                      className="input-field flex-1"
                    />
                  </div>
                </UnifiedCard>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <UnifiedCard variant="glass">
                    <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                      Raporty i Analizy
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button className="p-6 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl hover:scale-105 transition-all duration-300 text-left">
                        <BarChart3 className="w-8 h-8 text-blue-400 mb-3" />
                        <h4 className="text-white font-semibold mb-2">Raport Użytkowników</h4>
                        <p className="text-white/70 text-sm">Analiza aktywności i rejestracji</p>
                      </button>
                      <button className="p-6 bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl hover:scale-105 transition-all duration-300 text-left">
                        <DollarSign className="w-8 h-8 text-green-400 mb-3" />
                        <h4 className="text-white font-semibold mb-2">Raport Finansowy</h4>
                        <p className="text-white/70 text-sm">Przychody, prowizje, transakcje</p>
                      </button>
                      <button className="p-6 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl hover:scale-105 transition-all duration-300 text-left">
                        <Gavel className="w-8 h-8 text-purple-400 mb-3" />
                        <h4 className="text-white font-semibold mb-2">Raport Aukcji</h4>
                        <p className="text-white/70 text-sm">Statystyki aukcji i licytacji</p>
                      </button>
                      <button className="p-6 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl hover:scale-105 transition-all duration-300 text-left">
                        <AlertTriangle className="w-8 h-8 text-yellow-400 mb-3" />
                        <h4 className="text-white font-semibold mb-2">Raport Błędów</h4>
                        <p className="text-white/70 text-sm">Analiza błędów i problemów</p>
                      </button>
                    </div>
                  </UnifiedCard>

                  <UnifiedCard variant="glass">
                    <h4 className="text-xl font-semibold text-white mb-4">Eksport Danych</h4>
                    <div className="space-y-3">
                      <button className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl transition-all duration-300 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Database className="w-5 h-5 text-blue-400" />
                          <span className="text-white">Backup bazy danych</span>
                        </div>
                        <Download className="w-5 h-5 text-white/70" />
                      </button>
                      <button className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl transition-all duration-300 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-green-400" />
                          <span className="text-white">Eksport użytkowników (CSV)</span>
                        </div>
                        <Download className="w-5 h-5 text-white/70" />
                      </button>
                      <button className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl transition-all duration-300 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="w-5 h-5 text-purple-400" />
                          <span className="text-white">Eksport transakcji (CSV)</span>
                        </div>
                        <Download className="w-5 h-5 text-white/70" />
                      </button>
                    </div>
                  </UnifiedCard>
                </div>
              )}

              {activeTab === 'settings' && (
                <UnifiedCard variant="glass">
                  <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                    <Settings className="w-6 h-6 text-blue-400" />
                    Ustawienia Platformy
                  </h3>
                  <div className="space-y-6">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Prowizja platformy (%)
                      </label>
                      <input
                        type="number"
                        defaultValue="5"
                        min="0"
                        max="100"
                        step="0.1"
                        className="input-field"
                        aria-label="Prowizja platformy w procentach"
                        title="Prowizja platformy w procentach"
                      />
                      <p className="text-white/60 text-xs mt-1">
                        Procent od każdej transakcji pobierany przez platformę
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Maksymalny czas trwania aukcji (dni)
                      </label>
                      <input
                        type="number"
                        defaultValue="30"
                        min="1"
                        max="365"
                        className="input-field"
                        aria-label="Maksymalny czas trwania aukcji w dniach"
                        title="Maksymalny czas trwania aukcji w dniach"
                      />
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Minimalna cena wywoławcza (zł)
                      </label>
                      <input
                        type="number"
                        defaultValue="100"
                        min="0"
                        step="10"
                        className="input-field"
                        aria-label="Minimalna cena wywoławcza w złotych"
                        title="Minimalna cena wywoławcza w złotych"
                      />
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                      <label className="block text-sm font-medium text-white/90 mb-2 mb-3">
                        Funkcje platformy
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                          <span className="text-white/90">Wymagana weryfikacja email</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                          <span className="text-white/90">Wymagana weryfikacja telefonu</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="w-5 h-5 rounded" />
                          <span className="text-white/90">Automatyczna akceptacja aukcji</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                          <span className="text-white/90">Powiadomienia email</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button className="btn-primary flex-1">
                        Zapisz ustawienia
                      </button>
                      <button className="btn-secondary">
                        <RefreshCw className="w-4 h-4" />
                        Resetuj
                      </button>
                    </div>
                  </div>
                </UnifiedCard>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
