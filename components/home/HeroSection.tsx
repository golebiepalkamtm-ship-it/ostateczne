'use client';

import { motion } from 'framer-motion';
import { GlowCard, GlowButton } from '@/components/ui/GlowCard';
import { useRouter } from 'next/navigation';

export function HeroSection() {
  const router = useRouter();

  return (
    <section className="text-center py-4 sm:py-6 min-h-screen flex flex-col">
      <div className="max-w-6xl mx-auto px-4">
        {/* Tytuł i opis w karcie z glowing effect */}
        <GlowCard 
          variant="glass" 
          intensity="strong" 
          className="mb-6 mt-2 bg-gradient-to-br from-blue-900/10 to-purple-900/10"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-tight"
          >
            Pałka MTM
            <span className="block text-primary-400 mt-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
              Mistrzowie Sprintu
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.6 }}
            className="mt-8 max-w-4xl mx-auto text-lg sm:text-xl md:text-2xl text-secondary-200 leading-relaxed"
          >
            Pasja, tradycja i nowoczesność w hodowli gołębi pocztowych. Tworzymy historię polskiego
            sportu gołębiarskiego.
          </motion.p>

          {/* Przyciski CTA z glowing effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.9 }}
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <GlowButton 
              variant="primary"
              onClick={() => router.push('/auctions')}
              ariaLabel="Zobacz aktywne aukcje"
            >
              🏆 Zobacz Aukcje
            </GlowButton>
            <GlowButton 
              variant="secondary"
              onClick={() => router.push('/about')}
              ariaLabel="Dowiedz się więcej o hodowli"
            >
              📖 O Nas
            </GlowButton>
            <GlowButton 
              variant="outline"
              onClick={() => router.push('/demo-glowing')}
              ariaLabel="Demo efektu holograficznego"
            >
              ✨ Demo Efektu
            </GlowButton>
          </motion.div>
        </GlowCard>

        {/* Główny gołąb - wyśrodkowany pod tekstem */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 1.2 }}
          className="flex justify-center relative z-20 mt-16"
        >
          <GlowCard 
            variant="floating" 
            intensity="medium"
            className="inline-block p-8 bg-gradient-to-br from-white/5 to-blue-900/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/pigeon.gif"
              alt="Gołębie pocztowe w locie - Pałka MTM"
              width="600"
              height="600"
              style={{
                width: '600px',
                height: '600px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 20px 13px rgb(0 0 0 / 0.3))',
              }}
            />
          </GlowCard>
        </motion.div>

      </div>
    </section>
  );
}
