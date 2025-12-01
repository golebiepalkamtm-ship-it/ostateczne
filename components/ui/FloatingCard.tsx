'use client';

import { motion } from 'framer-motion';
import { ReactNode, useRef, useState, type MouseEvent } from 'react';

interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  intensity?: 'low' | 'medium' | 'high';
  glow?: boolean;
  hoverEffect?: number; // 0-1 scale for holographic effect
}

export function FloatingCard({
  children,
  className = '',
  delay = 0,
  intensity = 'medium',
  glow = true,
  hoverEffect = 0.5,
}: FloatingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glareX, setGlareX] = useState(50);
  const [glareY, setGlareY] = useState(50);
  const [glareOpacity, setGlareOpacity] = useState(0);

  const intensityMap = {
    low: { y: 5, duration: 4 },
    medium: { y: 10, duration: 6 },
    high: { y: 15, duration: 8 },
  };

  const currentIntensity = intensityMap[intensity];
  const maxRotation = 12 * hoverEffect;

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const distanceX = (x - 50) / 50;
    const distanceY = (y - 50) / 50;
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

    const rotY = distanceX * maxRotation;
    const rotX = -distanceY * maxRotation;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlareX(x);
    setGlareY(y);
    setGlareOpacity(Math.min(distance, 1) * 0.4);
  }

  function handleMouseEnter() {
    setIsHovering(true);
  }

  function handleMouseLeave() {
    setIsHovering(false);
    setRotateX(0);
    setRotateY(0);
    setGlareX(50);
    setGlareY(50);
    setGlareOpacity(0);
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3, type: 'spring', stiffness: 300 },
      }}
      transition={{
        duration: 0.8,
        delay,
        type: 'spring',
        stiffness: 100,
      }}
      className={`
        relative transform-3d perspective-1000 card-3d-raised-strong
        ${glow ? 'animate-glow3D' : ''}
        ${className}
      `}
      style={{
        transformStyle: 'preserve-3d',
        boxShadow: isHovering
          ? '0 25px 50px rgba(0, 0, 0, 0.25), 0 20px 40px rgba(0, 0, 0, 0.18), inset 2px 2px 6px rgba(255, 255, 255, 0.45), inset -2px -2px 6px rgba(0, 0, 0, 0.25), inset 0 10px 15px rgba(255, 255, 255, 0.35)'
          : '0 10px 20px rgba(0, 0, 0, 0.12), 0 6px 12px rgba(0, 0, 0, 0.1), inset 1px 1px 4px rgba(255, 255, 255, 0.35), inset -1px -1px 4px rgba(0, 0, 0, 0.18), inset 0 6px 10px rgba(255, 255, 255, 0.25)',
        background: `linear-gradient(140deg, 
          rgba(255, 255, 255, 0.28) 0%, 
          rgba(255, 255, 255, 0.15) 30%,
          rgba(220, 220, 220, 0.1) 50%, 
          rgba(180, 180, 180, 0.12) 70%,
          rgba(0, 0, 0, 0.14) 100%
        )`,
        borderTop: '1px solid rgba(255, 255, 255, 0.6)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.5)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.35)',
        borderRight: '1px solid rgba(0, 0, 0, 0.3)',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Holographic Shine Layer */}
      {hoverEffect > 0 && (
        <>
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              opacity: isHovering ? 1 : 0,
              background: `
                radial-gradient(
                  circle at ${glareX}% ${glareY}%,
                  rgba(255, 255, 255, 0.7) 0%,
                  rgba(255, 255, 255, 0.3) 20%,
                  transparent 50%
                )
              `,
              mixBlendMode: 'overlay',
              transform: 'translateZ(10px)',
              borderRadius: 'inherit',
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
            style={{
              opacity: glareOpacity,
              background: `
                radial-gradient(
                  circle 400px at ${glareX}% ${glareY}%,
                  rgba(100, 200, 255, 0.25),
                  rgba(255, 100, 200, 0.2),
                  transparent 40%
                )
              `,
              mixBlendMode: 'color-dodge',
              filter: 'blur(12px)',
              transform: 'translateZ(5px)',
              borderRadius: 'inherit',
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
            style={{
              opacity: isHovering ? 0.15 : 0,
              backgroundImage: `
                radial-gradient(circle, rgba(255, 255, 255, 0.8) 1px, transparent 1px),
                radial-gradient(circle, rgba(200, 220, 255, 0.6) 1px, transparent 1px)
              `,
              backgroundSize: '35px 35px, 55px 55px',
              backgroundPosition: `${glareX * 0.5}% ${glareY * 0.5}%, ${glareX * 0.3}% ${glareY * 0.3}%`,
              mixBlendMode: 'screen',
              transform: 'translateZ(8px)',
              borderRadius: 'inherit',
            }}
          />
        </>
      )}

      <motion.div
        animate={{
          y: [0, -currentIntensity.y, 0],
        }}
        transition={{
          duration: currentIntensity.duration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="card-floating hover-3d-lift"
        style={{
          transform: isHovering
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
            : 'rotateX(0deg) rotateY(0deg)',
          transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.3s ease-out',
          transformStyle: 'preserve-3d',
        }}
      >
        <div style={{ transform: 'translateZ(20px)', position: 'relative' }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
