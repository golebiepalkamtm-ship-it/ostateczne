'use client';

import { motion } from 'framer-motion';
import { ReactNode, useRef, useState, type MouseEvent } from 'react';

interface GlassContainerProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'strong' | 'ultra' | 'gradient';
  blur?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  glow?: boolean;
  hover?: boolean;
  hoverEffect?: number; // 0-1 scale for holographic intensity
}

export function GlassContainer({
  children,
  className = '',
  variant = 'default',
  blur = 'xl',
  glow = false,
  hover = true,
  hoverEffect = 0.6,
}: GlassContainerProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glareX, setGlareX] = useState(50);
  const [glareY, setGlareY] = useState(50);
  const [glareOpacity, setGlareOpacity] = useState(0);

  const maxRotation = 10 * hoverEffect;

  const variantClasses = {
    default: 'glass-morphism',
    strong: 'glass-morphism-strong',
    ultra: 'glass-morphism-ultra',
    gradient: 'card-gradient',
  };

  const blurClasses = {
    sm: '',
    md: '',
    lg: '',
    xl: '',
    '2xl': '',
    '3xl': '',
  };

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!hover || !cardRef.current) return;

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
    setGlareOpacity(Math.min(distance, 1) * 0.45);
  }

  function handleMouseEnter() {
    if (hover) {
      setIsHovering(true);
    }
  }

  function handleMouseLeave() {
    if (hover) {
      setIsHovering(false);
      setRotateX(0);
      setRotateY(0);
      setGlareX(50);
      setGlareY(50);
      setGlareOpacity(0);
    }
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={
        hover
          ? {
              scale: 1.02,
              y: -4,
              boxShadow: 'var(--shadow-glow-strong)',
              transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
            }
          : {}
      }
      transition={{
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1] as const,
      }}
      className={`
        ${variantClasses[variant]}
        ${blurClasses[blur]}
        ${glow ? 'animate-glow3D' : ''}
        ${hover ? 'hover-3d-lift card-3d-raised-strong' : 'card-3d-raised'}
        transform-3d perspective-1000
        ${className}
      `}
      style={{
        transformStyle: 'preserve-3d',
        transform: isHovering
          ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(25px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
        transition: isHovering ? 'transform 0.1s ease-out, box-shadow 0.3s ease' : 'transform 0.3s ease-out, box-shadow 0.3s ease',
        boxShadow: isHovering
          ? '0 22px 44px rgba(0, 0, 0, 0.22), 0 18px 36px rgba(0, 0, 0, 0.16), inset 2px 2px 5px rgba(255, 255, 255, 0.42), inset -2px -2px 5px rgba(0, 0, 0, 0.22), inset 0 8px 12px rgba(255, 255, 255, 0.32)'
          : '0 9px 18px rgba(0, 0, 0, 0.11), 0 5px 10px rgba(0, 0, 0, 0.09), inset 1px 1px 3px rgba(255, 255, 255, 0.32), inset -1px -1px 3px rgba(0, 0, 0, 0.16), inset 0 5px 8px rgba(255, 255, 255, 0.24)',
        background: `linear-gradient(148deg, 
          rgba(255, 255, 255, 0.26) 0%, 
          rgba(255, 255, 255, 0.14) 35%,
          rgba(210, 210, 210, 0.09) 50%, 
          rgba(170, 170, 170, 0.11) 65%,
          rgba(0, 0, 0, 0.13) 100%
        )`,
        borderTop: '1px solid rgba(255, 255, 255, 0.55)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.45)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.32)',
        borderRight: '1px solid rgba(0, 0, 0, 0.28)',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Holographic Shine Layer */}
      {hover && hoverEffect > 0 && (
        <>
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              opacity: isHovering ? 1 : 0,
              background: `
                radial-gradient(
                  circle at ${glareX}% ${glareY}%,
                  rgba(255, 255, 255, 0.6) 0%,
                  rgba(255, 255, 255, 0.25) 20%,
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
                  circle 450px at ${glareX}% ${glareY}%,
                  rgba(100, 200, 255, 0.25),
                  rgba(255, 100, 200, 0.2),
                  transparent 35%
                )
              `,
              mixBlendMode: 'color-dodge',
              filter: 'blur(14px)',
              transform: 'translateZ(5px)',
              borderRadius: 'inherit',
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
            style={{
              opacity: isHovering ? 0.12 : 0,
              backgroundImage: `
                radial-gradient(circle, rgba(255, 255, 255, 0.7) 1px, transparent 1px),
                radial-gradient(circle, rgba(200, 220, 255, 0.5) 1px, transparent 1px)
              `,
              backgroundSize: '38px 38px, 58px 58px',
              backgroundPosition: `${glareX * 0.5}% ${glareY * 0.5}%, ${glareX * 0.3}% ${glareY * 0.3}%`,
              mixBlendMode: 'screen',
              transform: 'translateZ(8px)',
              borderRadius: 'inherit',
            }}
          />
        </>
      )}

      <div style={{ transform: 'translateZ(15px)', position: 'relative' }}>
        {children}
      </div>
    </motion.div>
  );
}
