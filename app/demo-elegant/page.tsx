'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * ===================== PREMIUM AUCTION HERO CONCEPT =====================
 * ELEGANCKI DEMO inspirowany:
 * - Luxury auction houses (Christie's, Sotheby's aesthetic)
 * - Theater lighting (golden ratio, spotlight effect)
 * - Premium gallery design (white space, typography, pacing)
 * - Polish heritage + modern sophistication
 *
 * CONCEPT: Pałka MTM jako prestiżowa aukcja gołębi
 * - Spotlight na gołębia (jak na scenie teatralnej)
 * - Licznik aukcji (countdown, exclusivity)
 * - Preview champions (premium showcase)
 * - VIP invitation feel
 */

interface AuctionStat {
  label: string;
  value: string | number;
  icon: string;
}

export default function DemoElegantPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeChampion, setActiveChampion] = useState(0);
  const [auctionCountdown, setAuctionCountdown] = useState({
    days: 7,
    hours: 14,
    minutes: 32,
    seconds: 18,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setAuctionCountdown(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0)
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(countdownInterval);
    };
  }, []);

  const championsShowcase = [
    {
      name: 'Spirit of Champions',
      lineage: 'MTM Pałka Royal Line',
      achievements: '12 Gold Medals',
      image: '/pigeon.gif',
      premium: true,
    },
    {
      name: 'Golden Heritage',
      lineage: 'Pure Bloodline',
      achievements: '8 International Awards',
      image: '/pigeon.gif',
      premium: false,
    },
    {
      name: 'Sprint Master',
      lineage: 'Elite Racing Genetics',
      achievements: '15 Championship Wins',
      image: '/pigeon.gif',
      premium: true,
    },
  ];

  const auctionStats: AuctionStat[] = [
    { label: 'Lots Available', value: '47', icon: '🏆' },
    { label: 'Registered Bidders', value: '312', icon: '👥' },
    { label: 'Total Value', value: '$1.2M+', icon: '💎' },
    { label: 'Global Coverage', value: '28 Countries', icon: '🌍' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-yellow-100 to-yellow-50 overflow-hidden">
      {/* Elegant Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Spotlight effect following mouse */}
        <motion.div
          className="absolute w-[32rem] h-[32rem] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,220,120,0.18) 0%, rgba(255,220,120,0) 70%)',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            x: mousePosition.x * 120,
            y: mousePosition.y * 120,
          }}
          transition={{ type: 'spring', stiffness: 80, damping: 24 }}
        />

        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-[28rem] h-[28rem] bg-gradient-to-br from-yellow-300/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[24rem] h-[24rem] bg-gradient-to-tr from-yellow-200/30 to-transparent rounded-full blur-2xl" />
      </div>

      {/* Header/Navigation area */}
      <header className="relative z-40 flex items-center justify-between px-8 py-6 border-b border-white/5 backdrop-blur-md bg-black/30">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl font-serif font-bold text-amber-50">MTM Pałka</h1>
          <p className="text-xs text-amber-200/60 tracking-widest">MISTRZOWIE SPRINTU</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-6"
        >
          <button className="px-6 py-2 text-sm font-medium text-amber-50 hover:text-amber-200 transition-colors border-b border-amber-200/0 hover:border-amber-200/50 duration-300">
            Auctions
          </button>
          <button className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-700 to-amber-600 rounded-lg hover:shadow-lg hover:shadow-amber-600/50 transition-all duration-300">
            Register to Bid
          </button>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section - Grand Entrance */}
        <motion.section
          className="min-h-screen flex items-center justify-center px-8 py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="max-w-7xl w-full">
            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="text-center mb-16"
            >
              <h2 className="text-6xl md:text-8xl font-serif font-black mb-4 bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 bg-clip-text text-transparent">
                Premium Auction
              </h2>
              <p className="text-xl md:text-2xl text-amber-100/80 font-light tracking-wide">
                Discover Legendary Bloodlines & Champions
              </p>
            </motion.div>

            {/* Central Showcase - Spotlight Effect */}
            <motion.div
              className="relative mb-20 mx-auto max-w-2xl"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Theater-style frame */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-amber-900/30 to-black/50 p-1 backdrop-blur-xl border border-amber-600/30">
                {/* Inner glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-400/5 to-transparent pointer-events-none" />

                {/* Champion showcase */}
                <motion.div
                  className="relative rounded-xl overflow-hidden aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black p-12"
                  variants={itemVariants}
                >
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/10 to-blue-900/10" />

                  {/* Featured Champion - Pigeon image placeholder with glow */}
                  <motion.div
                    className="relative z-10 mb-8"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className="relative w-48 h-48 md:w-64 md:h-64">
                      {/* Golden glow halo */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/30 to-transparent blur-2xl" />

                      {/* Image container */}
                      <div className="relative w-full h-full rounded-full border-2 border-amber-600/50 overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-800 to-black">
                        <div className="text-6xl">🐦</div>
                        {/* In production: <Image src={championsShowcase[activeChampion].image} alt="Champion" fill className="object-cover" /> */}
                      </div>
                    </div>
                  </motion.div>

                  {/* Champion Info */}
                  <h3 className="text-3xl md:text-4xl font-serif font-bold text-amber-50 text-center mb-2">
                    {championsShowcase[activeChampion].name}
                  </h3>
                  <p className="text-amber-200/80 text-center text-lg mb-4">
                    {championsShowcase[activeChampion].lineage}
                  </p>

                  {/* Premium badge */}
                  {championsShowcase[activeChampion].premium && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-600/40 to-amber-500/20 border border-amber-400/60 mb-4"
                    >
                      <span className="text-amber-300">✨</span>
                      <span className="text-amber-100 text-sm font-semibold">PREMIUM LOT</span>
                    </motion.div>
                  )}

                  <p className="text-amber-100/60 text-center">
                    {championsShowcase[activeChampion].achievements}
                  </p>
                </motion.div>
              </div>

              {/* Champion Navigation Dots */}
              <div className="flex justify-center gap-3 mt-8">
                {championsShowcase.map((_, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setActiveChampion(idx)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      idx === activeChampion
                        ? 'bg-amber-400 w-8'
                        : 'bg-amber-600/40 hover:bg-amber-600/70'
                    }`}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Auction Countdown */}
            <motion.div
              className="mb-20 grid grid-cols-4 gap-4 max-w-2xl mx-auto"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {[
                { unit: 'DAYS', value: auctionCountdown.days },
                { unit: 'HOURS', value: auctionCountdown.hours },
                { unit: 'MINS', value: auctionCountdown.minutes },
                { unit: 'SECS', value: auctionCountdown.seconds },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="text-center p-6 rounded-lg bg-gradient-to-br from-slate-800/60 to-black/40 border border-amber-600/30 backdrop-blur-md hover:border-amber-500/60 transition-all duration-300"
                >
                  <motion.p className="text-4xl md:text-5xl font-serif font-bold text-amber-100 mb-2">
                    {String(item.value).padStart(2, '0')}
                  </motion.p>
                  <p className="text-xs font-semibold text-amber-200/60 tracking-widest">
                    {item.unit}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Call to Action */}
            <motion.div
              className="text-center"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(217, 119, 6, 0.8)' }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white font-semibold text-lg rounded-xl border border-amber-400/50 hover:border-amber-300/80 transition-all duration-300 shadow-2xl hover:shadow-amber-600/50 mb-6"
              >
                View Full Auction
              </motion.button>
              <motion.p variants={itemVariants} className="text-amber-200/60 text-sm">
                Exclusive access for registered collectors • Worldwide shipping available
              </motion.p>
            </motion.div>
          </div>
        </motion.section>

        {/* Auction Statistics Section */}
        <motion.section
          className="py-20 px-8 bg-gradient-to-r from-slate-900/50 via-black/50 to-slate-900/50 border-y border-amber-600/20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-serif font-bold text-amber-50 text-center mb-16">
              Auction by Numbers
            </h2>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {auctionStats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="p-8 rounded-xl bg-gradient-to-br from-slate-800/50 to-black/50 border border-amber-600/30 text-center hover:border-amber-500/60 transition-all duration-300 group"
                  whileHover={{ y: -5 }}
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {stat.icon}
                  </div>
                  <p className="text-amber-100 font-bold text-3xl mb-2">{stat.value}</p>
                  <p className="text-amber-200/60 text-sm font-semibold tracking-wider">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Premium Features Section */}
        <motion.section
          className="py-20 px-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-serif font-bold text-amber-50 text-center mb-16">
              Why Choose Pałka MTM
            </h2>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  title: 'Verified Lineage',
                  desc: 'Authenticated bloodlines with complete genealogy',
                  icon: '🏆',
                },
                {
                  title: 'Expert Selection',
                  desc: 'Curated by professional breeders worldwide',
                  icon: '✓',
                },
                {
                  title: 'Secure Trading',
                  desc: 'Safe, transparent, and fully insured auctions',
                  icon: '🔒',
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="p-8 rounded-xl bg-gradient-to-br from-slate-800/40 to-black/40 border border-amber-600/20 text-center hover:border-amber-500/50 transition-all duration-300"
                  whileHover={{ y: -8, borderColor: 'rgba(217, 119, 6, 0.8)' }}
                >
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-serif font-bold text-amber-50 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-amber-200/70 text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Footer CTA */}
        <motion.section
          className="py-20 px-8 text-center border-t border-amber-600/20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-amber-50 mb-6">
            Join the Elite Community
          </h2>
          <p className="text-amber-200/70 max-w-2xl mx-auto mb-8">
            Register today to access exclusive lots, preview upcoming auctions, and connect with
            breeders worldwide.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 bg-gradient-to-r from-amber-700 to-amber-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-amber-600/50 transition-all duration-300"
          >
            Register Now
          </motion.button>
        </motion.section>
      </main>
    </div>
  );
}
