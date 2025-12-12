'use client';

import { FeaturedChampions } from '@/components/home/FeaturedChampions';
import { HeroSection } from '@/components/home/HeroSection';
import { PhilosophySection } from '@/components/home/PhilosophySection';
import { UpcomingAuctions } from '@/components/home/UpcomingAuctions';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState, useMemo } from 'react';

export default function HomePageClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // 3D Transform effects
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [0, 5, 0]);
  const rotateY = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, -2, 2, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.02, 1]);

  // Smooth spring animations
  const smoothRotateX = useSpring(rotateX, { stiffness: 100, damping: 30 });
  const smoothRotateY = useSpring(rotateY, { stiffness: 100, damping: 30 });
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 });

  // Mouse tracking for 3D effects
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Sprawdź czy jesteśmy w przeglądarce
    if (typeof window === 'undefined') return;
    // Throttle mousemove using requestAnimationFrame to avoid flooding state updates
    let rafId: number | null = null;
    let lastEvent: MouseEvent | null = null;

    const updateFromEvent = () => {
      if (!lastEvent || !containerRef.current) return;
      const e = lastEvent;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      setMousePosition({ x, y });
      lastEvent = null;
      rafId = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      lastEvent = e;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateFromEvent);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Dynamic 3D transforms based on mouse position
  const mouseRotateX = useTransform(
    scrollYProgress,
    [0, 1],
    [mousePosition.y * 10, mousePosition.y * 5],
  );
  const mouseRotateY = useTransform(
    scrollYProgress,
    [0, 1],
    [mousePosition.x * 10, mousePosition.x * 5],
  );

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* 3D Container with perspective */}
      <motion.div
        className="relative z-10"
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
          rotateX: isHovering ? mouseRotateX : smoothRotateX,
          rotateY: isHovering ? mouseRotateY : smoothRotateY,
          scale: smoothScale,
        }}
      >
        {/* Hero Section with 3D entrance */}
        <motion.div
          initial={{ opacity: 0, y: 100, rotateX: -30 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 1.2,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.2,
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <HeroSection />
        </motion.div>

        {/* Featured Champions with 3D card effects */}
        <motion.div
          initial={{ opacity: 0, y: 200, rotateX: 30 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 1.8,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.6,
          }}
          viewport={{ once: true, margin: '-150px' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <FeaturedChampions />
        </motion.div>

        {/* Upcoming Auctions with 3D flip effect */}
        <motion.div
          initial={{ opacity: 0, y: 250, rotateY: 45 }}
          whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{
            duration: 2,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.8,
          }}
          viewport={{ once: true, margin: '-200px' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <UpcomingAuctions />
        </motion.div>

        {/* Philosophy Section with 3D reveal */}
        <motion.div
          initial={{ opacity: 0, y: 300, rotateX: -45 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 2.2,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 1,
          }}
          viewport={{ once: true, margin: '-250px' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <PhilosophySection />
        </motion.div>
      </motion.div>

      {/* Floating particles for extra depth (memoized positions to avoid regen every render) */}
      <div className="fixed inset-0 pointer-events-none z-5">
        {useMemo(() => {
          const particles = Array.from({ length: 20 }).map(() => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            x: Math.random() * 50 - 25,
            duration: Math.random() * 10 + 10,
            delay: Math.random() * 10,
          }));

          return particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{ left: p.left, top: p.top }}
              animate={{
                y: [0, -100, 0],
                x: [0, p.x, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
            />
          ));
        }, [])}
      </div>

      {/* 3D Cursor follower */}
      <motion.div
        className="fixed w-8 h-8 bg-gradient-to-r from-slate-400/30 to-slate-500/30 rounded-full blur-sm pointer-events-none z-50"
        style={{
          x: mousePosition.x * 20,
          y: mousePosition.y * 20,
          rotateX: mousePosition.y * 20,
          rotateY: mousePosition.x * 20,
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          opacity: isHovering ? 0.8 : 0.3,
        }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}
