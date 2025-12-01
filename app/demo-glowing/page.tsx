'use client';

import { motion } from 'framer-motion';
import { GlowCard, GlowButton, GlowInput, GlowTextarea } from '@/components/ui/GlowCard';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { useState } from 'react';

/**
 * Demo Page - Glowing Edge Effect z CodePen
 * https://codepen.io/simeydotme/pen/RNWoPRj
 * 
 * Prezentacja holograficznych efektów dla całej strony
 */

export default function GlowingEffectDemo() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  return (
    <UnifiedLayout showNavigation={true} showFooter={true} showBackground={true}>
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold text-white mb-4">
              Holograficzny Efekt Glowing Edges
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Przesuń mysz nad kartami, przyciskami i polami formularza, aby zobaczyć magiczny
              efekt świecących krawędzi z kolorowymi gradientami.
            </p>
          </motion.div>

          {/* Grid demonstracyjny - różne warianty kart */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Karta Default */}
            <GlowCard variant="default" intensity="medium">
              <h3 className="text-2xl font-bold text-white mb-3">Default Card</h3>
              <p className="text-white/70 mb-4">
                Standardowa karta z efektem glowing edges. Przesuń mysz, aby zobaczyć
                holograficzny gradient.
              </p>
              <GlowButton variant="primary" fullWidth>
                Akcja
              </GlowButton>
            </GlowCard>

            {/* Karta Glass */}
            <GlowCard variant="glass" intensity="strong">
              <h3 className="text-2xl font-bold text-white mb-3">Glass Card</h3>
              <p className="text-white/70 mb-4">
                Karta z efektem szkła i mocniejszym świeceniem. Idealna dla wyróżnionych treści.
              </p>
              <div className="flex gap-2">
                <GlowButton variant="primary">Zapisz</GlowButton>
                <GlowButton variant="secondary">Anuluj</GlowButton>
              </div>
            </GlowCard>

            {/* Karta Floating */}
            <GlowCard variant="floating" intensity="medium">
              <h3 className="text-2xl font-bold text-white mb-3">Floating Card</h3>
              <p className="text-white/70 mb-4">
                Karta z efektem unoszenia przy hover. Dłuższa animacja dla płynnego efektu.
              </p>
              <GlowButton variant="outline" fullWidth>
                Więcej
              </GlowButton>
            </GlowCard>
          </div>

          {/* Sekcja z przyciskami */}
          <GlowCard variant="gradient" intensity="strong" className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-6">Przyciski z Efektem</h2>
            <div className="flex flex-wrap gap-4">
              <GlowButton variant="primary">Primary Button</GlowButton>
              <GlowButton variant="secondary">Secondary Button</GlowButton>
              <GlowButton variant="outline">Outline Button</GlowButton>
              <GlowButton variant="ghost">Ghost Button</GlowButton>
            </div>
          </GlowCard>

          {/* Sekcja z formularzem */}
          <GlowCard variant="glass" intensity="medium" className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-6">Formularz Kontaktowy</h2>
            <form className="space-y-6">
              <GlowInput
                label="Adres Email"
                type="email"
                placeholder="twoj@email.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                helperText="Podaj swój adres email do kontaktu"
              />

              <GlowTextarea
                label="Wiadomość"
                placeholder="Napisz swoją wiadomość..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                helperText="Minimum 10 znaków"
              />

              <div className="flex gap-4">
                <GlowButton type="submit" variant="primary" fullWidth>
                  Wyślij Wiadomość
                </GlowButton>
                <GlowButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEmail('');
                    setMessage('');
                  }}
                >
                  Wyczyść
                </GlowButton>
              </div>
            </form>
          </GlowCard>

          {/* Grid z mniejszymi kartami - galeria */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Galeria Efektów
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <GlowCard
                  key={index}
                  variant={['default', 'glass', 'solid', 'gradient'][index % 4] as any}
                  intensity={['subtle', 'medium', 'strong'][index % 3] as any}
                  className="aspect-square flex items-center justify-center"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">✨</div>
                    <p className="text-white/80 text-sm">Karta {index + 1}</p>
                  </div>
                </GlowCard>
              ))}
            </div>
          </div>

          {/* Sekcja z instrukcją */}
          <GlowCard variant="default" intensity="subtle" className="bg-gradient-to-br from-blue-900/20 to-purple-900/20">
            <h2 className="text-3xl font-bold text-white mb-4">Jak to działa?</h2>
            <div className="space-y-4 text-white/70">
              <p>
                <strong className="text-white">1. CSS Variables:</strong> Efekt wykorzystuje zmienne CSS
                do śledzenia pozycji myszy i obliczania kąta oraz odległości od krawędzi.
              </p>
              <p>
                <strong className="text-white">2. Pseudo-elementy:</strong> ::before i ::after tworzą
                wielowarstwowe gradienty mesh, które dynamicznie się zmieniają.
              </p>
              <p>
                <strong className="text-white">3. JavaScript:</strong> Skrypt glowing-cards.ts obsługuje
                zdarzenia myszy i aktualizuje zmienne CSS w czasie rzeczywistym.
              </p>
              <p>
                <strong className="text-white">4. Blend Modes:</strong> Mix-blend-mode i mask-composite
                tworzą holograficzny efekt świecenia.
              </p>
            </div>
          </GlowCard>
        </div>
      </div>
    </UnifiedLayout>
  );
}
