"use client";

import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { LiquidBackground } from '@/components/home/LiquidBackground';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const searchParams = useSearchParams();
  const router = useRouter();

  // Obsługa Firebase Action Codes (weryfikacja email, reset hasła, etc.)
  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    if (mode === 'verifyEmail' && oobCode) {
      // Przekieruj do dedykowanej strony weryfikacji
      const params = new URLSearchParams(searchParams.toString());
      router.push(`/auth/verify-email?${params.toString()}`);
      return;
    }

    if (mode === 'resetPassword' && oobCode) {
      // Przekieruj do strony resetowania hasła (jeśli istnieje)
      const params = new URLSearchParams(searchParams.toString());
      router.push(`/auth/reset-password?${params.toString()}`);
      return;
    }
  }, [searchParams, router]);

  useEffect(() => {
    // Ukryj scroll na stronie głównej używając CSS zamiast manipulacji DOM
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Cleanup - przywróć scroll gdy komponent się odmontuje
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.documentElement.style.overflow = 'unset';
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
      <UnifiedLayout showFooter={false} showBackground={false}>
        <div className="h-screen relative">
          {/* Liquid Background Effect */}
          <LiquidBackground />
          {/* Napis na górze */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1 }}
            style={{
              position: 'absolute',
              top: '3%',
              left: '40%',
              transform: `translate(-50%, -50%) translate(${mousePosition.x * 10}px, ${mousePosition.y * 5}px)`,
              zIndex: 25,
            }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 drop-shadow-2xl hero-title">
              Pałka MTM
            </h1>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-semibold drop-shadow-xl hero-subtitle">
              Mistrzowie Sprintu
            </h2>
          </motion.div>

          {/* Gołąb poniżej napisu */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 4 }}
            style={{
              position: 'absolute',
              top: '45.5%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              perspective: '1000px',
            }}
          >
            <motion.div
              className="flex items-center justify-center"
              style={{
                rotateY: mousePosition.x * 10,
                rotateX: mousePosition.y * -10,
                transformStyle: 'preserve-3d',
              }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            >
              {/* Animowany GIF gołębia z efektem unoszenia */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6, y: 30 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -8, 0],
                }}
                transition={{
                  opacity: { duration: 1.2, delay: 4.5, ease: 'easeOut' },
                  scale: { duration: 1.2, delay: 4.5, ease: [0.34, 1.56, 0.64, 1] },
                  y: {
                    duration: 3,
                    delay: 5.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                }}
              >
                <Image
                  src="/pigeon.gif"
                  alt="Animowany gołąb MTM Pałka"
                  width={400}
                  height={500}
                  className="object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
                  priority
                  unoptimized
                  style={{ width: '400px', height: '500px' }}
                />
              </motion.div>
            </motion.div>
          </motion.section>
      </div>
    </UnifiedLayout>
  );
}
