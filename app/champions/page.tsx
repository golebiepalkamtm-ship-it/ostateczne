'use client';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { motion } from 'framer-motion';
import { SimpleChampionsList } from '@/components/champions/SimpleChampionsList';
import { useState } from 'react';
import ImageModal from '@/components/ImageModal';

export default function ChampionsPage() {
  const [selectedPedigreeImage, setSelectedPedigreeImage] = useState<string | null>(null);
  const [centralChampion, setCentralChampion] = useState<{ pedigreeImage?: string } | null>(null);

  return (
    <UnifiedLayout isHomePage={true}>
      {/* Hero Section - z padding-top dla miejsca na logo i nawigację, delay 0.8s czeka na animację fade-in-fwd */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="relative z-10 pt-64 pb-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold uppercase tracking-[0.5em] text-white/60 mb-6">Nasze Championy</h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto"
          >
            Poznaj nasze wybitne championy gołębi pocztowych. Każdy z nich to wyjątkowy
            przedstawiciel naszej linii hodowlanej PAŁKA MTM.
          </motion.p>
        </div>
      </motion.section>

      {/* RODOWÓD Button - między nagłówkiem a karuzelą */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="flex justify-center relative z-[1000] mb-8"
      >
        <button
          onClick={() => {
            if (centralChampion?.pedigreeImage) {
              setSelectedPedigreeImage(centralChampion.pedigreeImage);
            }
          }}
          disabled={!centralChampion?.pedigreeImage}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-600 disabled:opacity-50 text-white font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 border-2 border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          RODOWÓD
        </button>
      </motion.div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pb-20 -mt-72">
        <div className="max-w-7xl mx-auto">
          <SimpleChampionsList onPedigreeClick={setSelectedPedigreeImage} onCentralChampionChange={setCentralChampion} />
        </div>
      </div>

      {/* Pedigree Image Modal */}
      {selectedPedigreeImage && (
        <ImageModal
          image={{ id: 'pedigree-image', src: selectedPedigreeImage, alt: 'Rodowód championa' }}
          onClose={() => setSelectedPedigreeImage(null)}
        />
      )}
    </UnifiedLayout>
  );
}
