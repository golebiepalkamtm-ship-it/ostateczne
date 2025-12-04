/**
 * V2 Theme - Demo Page
 * Przykładowa strona demonstrująca wszystkie komponenty V2
 */

'use client';

import React from 'react';
import { ThemeV2Container } from '../ThemeV2Container';
import { Scene3DPlaceholder } from '../3d/Scene3DPlaceholder';

interface DemoPageProps {
  onThemeToggle?: () => void;
}

export const DemoPage: React.FC<DemoPageProps> = ({ onThemeToggle }) => {
  return (
    <ThemeV2Container onThemeToggle={onThemeToggle}>
      {/* Przykładowa zawartość strony */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto">
          {/* Sekcja z kartami */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Komponenty V2 Theme
            </h2>
            <p className="text-xl text-gray-600">
              Minimalistyczny design z mikrointerakcjami i efektami 3D
            </p>
          </div>

          {/* Grid z kartami produktów */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="
                  group
                  bg-white 
                  border border-gray-200 
                  rounded-2xl 
                  overflow-hidden
                  transition-all duration-300
                  hover:shadow-2xl hover:scale-105
                  hover:border-blue-300
                "
              >
                {/* Obrazek */}
                <div className="relative h-48 bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="
                      w-24 h-24 
                      bg-blue-500 rounded-full 
                      opacity-50
                      transition-transform duration-500
                      group-hover:scale-150
                    " />
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="
                      px-3 py-1 
                      bg-blue-600 text-white 
                      text-xs font-semibold rounded-full
                    ">
                      Nowe
                    </span>
                  </div>
                </div>

                {/* Zawartość */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    Produkt #{item}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Opis produktu z eleganckimi mikrointerakcjami i płynną animacją.
                  </p>
                  
                  {/* Przyciski akcji */}
                  <div className="flex gap-2">
                    <button className="
                      flex-1 px-4 py-2
                      bg-blue-600 hover:bg-blue-700
                      text-white font-medium text-sm
                      rounded-lg
                      transition-all duration-300
                      hover:scale-105 hover:shadow-lg
                      active:scale-95
                    ">
                      Zobacz więcej
                    </button>
                    <button className="
                      px-4 py-2
                      bg-gray-100 hover:bg-gray-200
                      text-gray-700
                      rounded-lg
                      transition-all duration-300
                      hover:scale-105
                      active:scale-95
                    ">
                      ❤️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sekcja z 3D Scene */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-8 md:p-12 mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Efekty 3D w akcji
              </h2>
              <p className="text-lg text-gray-600">
                Placeholder przygotowany pod WebGPU/WebGL z Three.js
              </p>
            </div>
            <div className="relative h-96 bg-white/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-gray-200">
              <Scene3DPlaceholder
                colorScheme="blue"
                particleCount={800}
                animationSpeed={1.5}
                intensity={0.9}
              />
            </div>
          </div>

          {/* Sekcja z timeline/features */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Kluczowe Funkcje
            </h2>
            <div className="space-y-8">
              {[
                {
                  icon: '🎨',
                  title: 'Minimalistyczny Design',
                  description: 'Czyste linie, duża ilość whitespace i elegancka typografia.',
                },
                {
                  icon: '✨',
                  title: 'Mikrointerakcje',
                  description: 'Płynne animacje i responsywne efekty hover na każdym elemencie.',
                },
                {
                  icon: '🚀',
                  title: 'Efekty 3D',
                  description: 'Gotowość pod WebGPU z fallbackiem do WebGL2 używając Three.js.',
                },
                {
                  icon: '⚡',
                  title: 'Wysoka Wydajność',
                  description: 'Zoptymalizowane komponenty React z TypeScript i Tailwind CSS.',
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="
                    flex items-start gap-6 p-6
                    bg-white border border-gray-200 rounded-2xl
                    transition-all duration-300
                    hover:shadow-lg hover:scale-[1.02] hover:border-blue-300
                  "
                >
                  <div className="
                    flex-shrink-0 w-16 h-16
                    bg-gradient-to-br from-blue-50 to-blue-100
                    rounded-xl
                    flex items-center justify-center
                    text-3xl
                    transition-transform duration-300
                    hover:rotate-12
                  ">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sekcja testimonials */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              Co mówią użytkownicy
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  name: 'Jan Kowalski',
                  role: 'Hodowca',
                  text: 'Nowy design jest absolutnie niesamowity! Mikrointerakcje sprawiają, że korzystanie z platformy to czysta przyjemność.',
                  avatar: '👨‍💼',
                },
                {
                  name: 'Anna Nowak',
                  role: 'Użytkownik',
                  text: 'Efekty 3D dodają profesjonalizmu i nowoczesności. Wreszcie platforma, która wygląda jak XXI wiek!',
                  avatar: '👩‍💼',
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="
                    p-8 
                    bg-gradient-to-br from-white to-blue-50
                    border border-gray-200 
                    rounded-2xl
                    transition-all duration-300
                    hover:shadow-xl hover:scale-105
                  "
                >
                  <div className="text-5xl mb-4">{testimonial.avatar}</div>
                  <p className="text-gray-600 italic mb-6">
                    "{testimonial.text}"
                  </p>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </ThemeV2Container>
  );
};
