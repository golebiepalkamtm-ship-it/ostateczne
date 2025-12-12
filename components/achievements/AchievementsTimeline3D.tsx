'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { achievementsData } from '@/lib/achievements/data';
import type { YearData } from '@/lib/achievements/types';
import { Trophy, Award, Sparkles, ChevronRight } from 'lucide-react';
import { GlowingEdgeCard } from '@/components/ui/GlowingEdgeCard';

interface YearCardProps {
  data: YearData;
  index: number;
  total: number;
  onClick: () => void;
  isSelected: boolean;
  isVisible: boolean;
}

function YearCard({ data, index, total, onClick, isSelected, isVisible }: YearCardProps) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isMasterYear = data.totalMasterTitles >= 3;
  const isLeft = index % 2 === 0;
  
  // 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / (rect.width / 2));
    y.set((e.clientY - centerY) / (rect.height / 2));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setHovered(false);
  };

  const positionPercent = (index / (total - 1)) * 100;

  return (
    <motion.div
      ref={cardRef}
      className={`absolute left-1/2 ${isLeft ? '-translate-x-[120%]' : 'translate-x-[20%]'} w-[45%] max-w-md magictime ${isLeft ? 'slideRight' : 'slideLeft'}`}
      style={{
        top: `${10 + positionPercent * 0.8}%`,
        perspective: '1000px',
        animationDelay: `${index * 0.2}s`,
      }}
      initial={{ opacity: 0, y: 100, rotateX: isLeft ? -30 : 30 }}
      animate={{
        opacity: isVisible ? 1 : 0.3,
        y: isVisible ? 0 : (isLeft ? -50 : 50),
        scale: isVisible ? 1 : 0.9,
      }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setHovered(true)}
      onClick={onClick}
    >
      <motion.div
        className={`relative cursor-pointer group ${isSelected ? 'magictime twisterInUp' : ''}`}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: 1.05, z: 50 }}
      >
        {/* Glow effect */}
        <motion.div
          className={`absolute -inset-2 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity ${
            isMasterYear ? 'bg-yellow-500/50' : 'bg-blue-500/50'
          }`}
          animate={isSelected ? {
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.1, 1],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Main Card */}
        <GlowingEdgeCard
          className={`relative bg-gradient-to-br ${
            isMasterYear
              ? 'from-yellow-900/90 via-yellow-800/80 to-yellow-900/90'
              : 'from-gray-900/95 via-gray-800/90 to-gray-900/95'
          } backdrop-blur-2xl p-8 transition-all duration-500 overflow-hidden ${
            isSelected
              ? 'shadow-2xl shadow-yellow-500/50'
              : hovered
              ? 'shadow-xl shadow-blue-500/40'
              : 'shadow-lg'
          }`}
          glowSensitivity={25}
          colorSensitivity={45}
        >
          {/* Animated background pattern */}
          <motion.div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at ${isLeft ? '20%' : '80%'} 30%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />

          {/* Shimmer effect */}
          {hovered && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {/* Content */}
          <div className="relative z-10">
            {/* Year Badge */}
            <div className="flex items-center justify-between mb-6">
              <motion.div
                className={`text-6xl font-black ${isMasterYear ? 'text-yellow-400' : 'text-blue-400'} ${isSelected ? 'magictime puffIn' : ''}`}
                animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.6 }}
              >
                {data.year}
              </motion.div>
              {isMasterYear && (
                <motion.div
                  className={`${isSelected ? 'magictime boingInUp' : ''}`}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full p-3 shadow-lg shadow-yellow-500/50">
                    <Sparkles className="w-6 h-6 text-yellow-900" />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <motion.div
                className={`bg-black/40 rounded-xl p-4 text-center border border-white/10 ${isSelected ? 'magictime perspectiveUp' : ''}`}
                whileHover={{ scale: 1.05, y: -5 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="text-3xl font-black text-white mb-1">{data.totalMasterTitles}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Mistrzów</div>
              </motion.div>
              <motion.div
                className={`bg-black/40 rounded-xl p-4 text-center border border-white/10 ${isSelected ? 'magictime perspectiveDown' : ''}`}
                whileHover={{ scale: 1.05, y: -5 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="text-3xl font-black text-white mb-1">{data.divisions.length}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Dywizji</div>
              </motion.div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Award className="w-4 h-4" />
                <span>{data.divisions.reduce((sum, d) => sum + d.results.length, 0)} osiągnięć</span>
              </div>
              {isMasterYear && (
                <motion.div
                  className="flex items-center gap-2 text-sm text-yellow-400 font-semibold"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Trophy className="w-4 h-4" />
                  <span>Rok Mistrzowski</span>
                </motion.div>
              )}
            </div>

            {/* Preview divisions */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {data.divisions.slice(0, 2).map((div, i) => (
                <div
                  key={i}
                  className={`bg-black/30 rounded-lg p-2 text-center border border-white/05 ${isSelected ? 'magictime vanishIn' : ''}`}
                >
                  <div className="text-xs text-gray-400 mb-1">{div.level}</div>
                  <div className="text-lg font-bold text-white">{div.results.length}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              className="flex items-center justify-center gap-2 text-xs text-gray-400 group-hover:text-white transition-colors"
              animate={hovered ? { x: [0, 5, 0] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span>Kliknij aby zobaczyć szczegóły</span>
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </div>
        </GlowingEdgeCard>
      </motion.div>
    </motion.div>
  );
}

// Particle component
function Particle({ index: _index }: { index: number }) {
  const size = Math.random() * 3 + 1;
  const startX = Math.random() * 100;
  const startY = Math.random() * 100;
  const duration = Math.random() * 5 + 5;
  const delay = Math.random() * 5;

  return (
    <motion.div
      className="absolute rounded-full bg-blue-400/20"
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        top: `${startY}%`,
      }}
      animate={{
        y: [0, -100, 0],
        x: [0, Math.random() * 50 - 25, 0],
        opacity: [0, 0.6, 0],
        scale: [0, 1, 0],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: 'easeInOut',
      }}
    />
  );
}

export default function AchievementsTimeline3D({
  onYearSelect,
}: {
  onYearSelect: (year: number) => void;
}) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Intersection Observer for scroll-based visibility
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          setVisibleIndices((prev) => {
            const next = new Set(prev);
            if (entry.isIntersecting) {
              next.add(index);
            } else {
              next.delete(index);
            }
            return next;
          });
        });
      },
      { threshold: 0.3 },
    );

    const cards = containerRef.current.querySelectorAll('[data-index]');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [mounted]);

  const handleSelect = (year: number) => {
    setSelectedYear(year);
    onYearSelect(year);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          className="text-white text-xl font-semibold magictime vanishIn"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Ładowanie timeline...
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-y-auto">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-black pointer-events-none" />
      
      {/* Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <Particle key={i} index={i} />
        ))}
      </div>

      {/* Timeline Container */}
      <div className="relative min-h-[400vh] py-32">
        {/* Central Timeline Line */}
        <div className="fixed left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 pointer-events-none z-0">
          <div className="w-full h-full bg-gradient-to-b from-blue-500 via-yellow-500 to-blue-500 opacity-30" />
          <motion.div
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-blue-500 via-yellow-500 to-blue-500"
            style={{
              height: '100%',
              scaleY: 0,
            }}
            animate={{
              scaleY: 1,
            }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
        </div>

        {/* Year Cards */}
        {achievementsData.map((yearData, index) => {
          const positionPercent = (index / (achievementsData.length - 1)) * 100;
          const isMasterYear = yearData.totalMasterTitles >= 3;

          return (
            <div key={yearData.year} data-index={index}>
              {/* Central Marker */}
              <motion.div
                className={`fixed left-1/2 -translate-x-1/2 pointer-events-none z-5 magictime ${isMasterYear ? 'twisterInUp' : 'puffIn'}`}
                style={{
                  top: `${10 + positionPercent * 0.8}%`,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div
                  className={`w-6 h-6 rounded-full border-4 border-gray-900 ${
                    isMasterYear
                      ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50'
                      : 'bg-blue-500 shadow-lg shadow-blue-500/50'
                  }`}
                  animate={{
                    scale: [1, 1.3, 1],
                    boxShadow: isMasterYear
                      ? [
                          '0 0 0px rgba(255, 215, 0, 0.5)',
                          '0 0 25px rgba(255, 215, 0, 0.9)',
                          '0 0 0px rgba(255, 215, 0, 0.5)',
                        ]
                      : [
                          '0 0 0px rgba(59, 130, 246, 0.5)',
                          '0 0 20px rgba(59, 130, 246, 0.9)',
                          '0 0 0px rgba(59, 130, 246, 0.5)',
                        ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              {/* Year Card */}
              <YearCard
                data={yearData}
                index={index}
                total={achievementsData.length}
                onClick={() => handleSelect(yearData.year)}
                isSelected={selectedYear === yearData.year}
                isVisible={visibleIndices.has(index)}
              />
            </div>
          );
        })}

        {/* Scroll Indicator */}
        <motion.div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 bg-black/80 backdrop-blur-md px-8 py-4 rounded-full border border-gray-700/50 text-white text-sm flex items-center gap-3 magictime slideUp"
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ↓
          </motion.div>
          <span className="font-medium">Przewiń aby zobaczyć więcej</span>
        </motion.div>
      </div>
    </div>
  );
}
