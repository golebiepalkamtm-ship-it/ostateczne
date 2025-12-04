/**
 * V2 Theme - Header Component
 * Minimalistyczny nagłówek z mikrointerakcjami i integracją 3D
 */

'use client';

import React from 'react';
import { Scene3DPlaceholder } from '../3d/Scene3DPlaceholder';

interface HeaderV2Props {
  title?: string;
  subtitle?: string;
  showScene3D?: boolean;
  className?: string;
}

export const HeaderV2: React.FC<HeaderV2Props> = ({
  title = 'Witaj w V2',
  subtitle = 'Nowoczesny design z efektami 3D',
  showScene3D = true,
  className = '',
}) => {
  return (
    <header 
      className={`
        relative w-full min-h-[70vh] overflow-hidden
        bg-white
        ${className}
      `}
    >
      {/* Scena 3D w tle */}
      {showScene3D && (
        <div className="absolute inset-0 z-0">
          <Scene3DPlaceholder 
            colorScheme="blue"
            particleCount={500}
            animationSpeed={1.2}
            intensity={0.7}
          />
        </div>
      )}

      {/* Gradient overlay dla lepszej czytelności tekstu */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/40 via-white/20 to-white" />

      {/* Zawartość tekstowa */}
      <div className="relative z-20 container mx-auto px-6 h-full min-h-[70vh] flex flex-col justify-center items-center">
        {/* Animowany badge */}
        <div 
          className="
            mb-6 px-4 py-2 
            bg-blue-50 border border-blue-200 rounded-full
            text-sm font-medium text-blue-600
            transition-all duration-300 ease-out
            hover:bg-blue-100 hover:scale-105 hover:shadow-lg
            cursor-default
          "
        >
          ✨ Nowy Design
        </div>

        {/* Główny tytuł z animacją */}
        <h1 
          className="
            text-6xl md:text-7xl lg:text-8xl font-bold 
            text-gray-900
            mb-4
            transition-all duration-500 ease-out
            hover:scale-105
            text-center
            leading-tight
          "
          style={{
            textShadow: '0 2px 20px rgba(59, 130, 246, 0.1)',
          }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        <p 
          className="
            text-xl md:text-2xl 
            text-gray-600
            mb-12
            max-w-2xl
            text-center
            transition-opacity duration-500
            hover:text-gray-900
          "
        >
          {subtitle}
        </p>

        {/* Scroll indicator z animacją */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-gray-400 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Dekoracyjne elementy geometryczne */}
      <div className="absolute top-20 right-10 w-32 h-32 border-2 border-blue-200 rounded-full opacity-20 animate-spin" style={{ animationDuration: '20s' }} />
      <div className="absolute bottom-32 left-10 w-24 h-24 border-2 border-blue-300 rotate-45 opacity-20 animate-pulse" />
    </header>
  );
};
