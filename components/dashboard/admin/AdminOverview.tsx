'use client';

import { UnifiedCard } from '@/components/ui/UnifiedCard';
import { motion } from 'framer-motion';
import {
  BarChart3,
  DollarSign,
  Gavel,
  Users,
  TrendingUp,
  MessageSquare,
  Star,
  Camera,
  Clock,
  AlertCircle,
  Activity,
  Database,
  Server,
} from 'lucide-react';
import { memo } from 'react';

interface StatsResponse {
  totalUsers: number;
  totalAuctions: number;
  totalTransactions: number;
  disputes: number;
}

interface AdminOverviewProps {
  stats: StatsResponse | null;
  isLoading: boolean;
}

const AdminOverview = memo(function AdminOverview({ stats, isLoading }: AdminOverviewProps) {
  const statsCards = [
    {
      title: 'Użytkownicy',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      change: '+12%',
      subtitle: 'Aktywni w tym miesiącu',
    },
    {
      title: 'Aukcje',
      value: stats?.totalAuctions || 0,
      icon: Gavel,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      change: '+8%',
      subtitle: 'Aktywne aukcje',
    },
    {
      title: 'Transakcje',
      value: stats?.totalTransactions || 0,
      icon: DollarSign,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      change: '+24%',
      subtitle: 'Wartość: 0 zł',
    },
    {
      title: 'Spory',
      value: stats?.disputes || 0,
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      change: '-5%',
      subtitle: 'Wymagają uwagi',
    },
    {
      title: 'Referencje',
      value: 0,
      icon: Star,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      change: '+15%',
      subtitle: 'Oczekujące: 0',
    },
    {
      title: 'Spotkania',
      value: 0,
      icon: Camera,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/30',
      change: '+3%',
      subtitle: 'Zaplanowane',
    },
    {
      title: 'Wiadomości',
      value: 0,
      icon: MessageSquare,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      change: '+18%',
      subtitle: 'Nowe wiadomości',
    },
    {
      title: 'Wydajność',
      value: '99.9%',
      icon: Activity,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      change: '+0.1%',
      subtitle: 'Uptime systemu',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-40 bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Main Stats Grid - 8 cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={`card hover-3d-lift ${stat.bgColor} ${stat.borderColor} border p-6`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-white/70 text-sm font-medium mb-1">{stat.title}</p>
                  <p className="text-4xl font-bold text-white mt-2">{stat.value}</p>
                  <p className="text-white/60 text-xs mt-2">{stat.subtitle}</p>
                </div>
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-semibold">{stat.change}</span>
                <span className="text-white/50 text-xs">vs poprzedni miesiąc</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Actions - Expanded */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <UnifiedCard variant="glass" noTransparency={true} glow={true} glowingEdges={true} edgeGlowIntensity={0.5} className="p-8 glass-morphism-strong">
          <h3 className="text-2xl font-semibold text-white mb-6">Szybkie akcje</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button style={{ width: '100%' }} className="w-full text-left p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-4">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-white font-semibold text-lg mb-1">Zarządzaj użytkownikami</p>
                  <p className="text-white/60 text-sm">Przeglądaj i edytuj konta</p>
                </div>
              </div>
            </button>
            <button style={{ width: '100%' }} className="w-full text-left p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-center gap-4">
                <Gavel className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-white font-semibold text-lg mb-1">Moderuj aukcje</p>
                  <p className="text-white/60 text-sm">Zatwierdzaj i odrzucaj</p>
                </div>
              </div>
            </button>
            <button style={{ width: '100%' }} className="w-full text-left p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-center gap-4">
                <DollarSign className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-white font-semibold text-lg mb-1">Transakcje</p>
                  <p className="text-white/60 text-sm">Przeglądaj płatności</p>
                </div>
              </div>
            </button>
            <button style={{ width: '100%' }} className="w-full text-left p-6 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <div className="flex items-center gap-4">
                <BarChart3 className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-white font-semibold text-lg mb-1">Raporty</p>
                  <p className="text-white/60 text-sm">Analiza i statystyki</p>
                </div>
              </div>
            </button>
          </div>
        </UnifiedCard>
      </motion.div>

      {/* System Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UnifiedCard variant="glass" noTransparency={true} glow={true} glowingEdges={true} edgeGlowIntensity={0.5} className="p-8 glass-morphism-strong">
          <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
            <Server className="w-6 h-6 text-blue-400" />
            Status Systemu
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Baza danych</span>
              </div>
              <span className="text-green-400 font-semibold">Online</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Redis Cache</span>
              </div>
              <span className="text-green-400 font-semibold">Aktywny</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Firebase Auth</span>
              </div>
              <span className="text-green-400 font-semibold">Połączony</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">API Endpoints</span>
              </div>
              <span className="text-green-400 font-semibold">Działa</span>
            </div>
          </div>
        </UnifiedCard>

        <UnifiedCard variant="glass" noTransparency={true} glow={true} glowingEdges={true} edgeGlowIntensity={0.5} className="p-8 glass-morphism-strong">
          <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
            <Clock className="w-6 h-6 text-yellow-400" />
            Ostatnia aktywność
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-xl border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Nowy użytkownik</span>
                <span className="text-white/50 text-xs">2 min temu</span>
              </div>
              <p className="text-white/70 text-sm">Zarejestrowano nowe konto</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Aukcja zatwierdzona</span>
                <span className="text-white/50 text-xs">15 min temu</span>
              </div>
              <p className="text-white/70 text-sm">Aukcja została opublikowana</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border-l-4 border-yellow-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Nowa transakcja</span>
                <span className="text-white/50 text-xs">1 godz. temu</span>
              </div>
              <p className="text-white/70 text-sm">Zakończona transakcja</p>
            </div>
          </div>
        </UnifiedCard>
      </div>

      {/* Performance Metrics */}
      <UnifiedCard variant="glass" noTransparency={true} glow={true} glowingEdges={true} edgeGlowIntensity={0.5} className="p-8 glass-morphism-strong">
        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
          <Activity className="w-6 h-6 text-emerald-400" />
          Metryki wydajności
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/70 text-sm">Średni czas odpowiedzi</span>
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">142ms</p>
            <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              -12% vs poprzedni tydzień
            </p>
          </div>
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/70 text-sm">Żądania/min</span>
              <Activity className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-white">1,247</p>
            <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +8% vs poprzedni tydzień
            </p>
          </div>
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/70 text-sm">Wskaźnik błędów</span>
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-white">0.02%</p>
            <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              -0.05% vs poprzedni tydzień
            </p>
          </div>
        </div>
      </UnifiedCard>
    </div>
  );
});

export default AdminOverview;
