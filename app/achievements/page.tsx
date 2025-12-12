
'use client';
import {
  AchievementTimeline,
  achievementsTimelineData,
} from '@/components/achievements/AchievementTimeline';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { motion } from 'framer-motion';

export default function AchievementsPage() {
  return (
    <UnifiedLayout isHomePage={true}>
      {/* Hero Section - z padding-top dla miejsca na logo i nawigację, delay 0.8s czeka na animację fade-in-fwd */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="relative z-10 pt-48 pb-12 px-2 sm:px-4 lg:px-6 xl:px-8 2xl:px-12"
      >
        <div className="w-full mx-auto text-center">
          <h1 className="text-4xl font-bold uppercase tracking-[0.5em] text-white/60 mb-6">Chronologiczne trofea 2001–2024</h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto"
          >
            Kompletna oś czasu obejmująca wyniki Oddziału Lubań 092, Łużyce Lubań 0446, Kwisa 0489, Okręgu Jelenia Góra, Regionu V i MP.
          </motion.p>
        </div>
      </motion.section>

      <div className="relative z-10 px-2 sm:px-4 lg:px-6 xl:px-8 2xl:px-12 pb-20">
        <AchievementTimeline items={achievementsTimelineData} />
      </div>
    </UnifiedLayout>
  );
}
