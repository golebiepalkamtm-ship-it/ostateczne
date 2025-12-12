'use client';

import { motion } from 'framer-motion';
import { memo, ReactNode, useRef, useState, useEffect, type MouseEvent } from 'react';

interface UnifiedCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | '3d' | 'floating' | 'gradient';
  glow?: boolean;
  hover?: boolean;
  delay?: number;
  intensity?: number; // 0-1 scale for holographic effect intensity
  glowingEdges?: boolean; // Enable colored glowing edges effect
  edgeGlowIntensity?: number; // 0-1 scale for edge glow intensity
}

export const UnifiedCard = memo(function UnifiedCard({
  children,
  className = '',
  variant = 'default',
  glow = false,
  hover = true,
  delay = 0,
  intensity = 0.7,
  glowingEdges = false,
  edgeGlowIntensity = 0.5,
  noTransparency = false,
}: UnifiedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [disabledByNoHover, setDisabledByNoHover] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glareX, setGlareX] = useState(50);
  const [glareY, setGlareY] = useState(50);
  const [glareOpacity, setGlareOpacity] = useState(0);
  const [edgeAngle, setEdgeAngle] = useState(45);
  const [edgeDistance, setEdgeDistance] = useState(0);

  const maxRotation = 15 * intensity; // Subtle 3D rotation

  const variantClasses = {
    default: 'card',
    glass: 'card-glass',
    '3d': 'card-3d',
    floating: 'card-floating',
    gradient: 'card-gradient',
  };

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!hover || disabledByNoHover || !cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Mouse position (0-100%)
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Distance from center
    const distanceX = (x - 50) / 50;
    const distanceY = (y - 50) / 50;
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

    // Rotation (inverted for natural feel)
    const rotY = distanceX * maxRotation;
    const rotX = -distanceY * maxRotation;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlareX(x);
    setGlareY(y);
    setGlareOpacity(Math.min(distance, 1) * 0.5);

    // Glowing edges calculations
    if (glowingEdges) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      
      // Calculate angle
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      setEdgeAngle(angle);
      
      // Calculate closeness to edge
      let k_x = Infinity;
      let k_y = Infinity;
      if (dx !== 0) k_x = centerX / Math.abs(dx);
      if (dy !== 0) k_y = centerY / Math.abs(dy);
      const edgeDist = Math.min(Math.max(1 / Math.min(k_x, k_y), 0), 1);
      setEdgeDistance(edgeDist * 100);
    }

    // Legacy glow effect support
    card.style.setProperty('--card-glow-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--card-glow-y', `${e.clientY - rect.top}px`);
  }

  function handleMouseEnter() {
    if (hover && !disabledByNoHover) {
      setIsHovering(true);
    }
  }

  function handleMouseLeave() {
    if (hover && !disabledByNoHover) {
      setIsHovering(false);
      setRotateX(0);
      setRotateY(0);
      setGlareX(50);
      setGlareY(50);
      setGlareOpacity(0);
      setEdgeDistance(0);
    }
  }

  useEffect(() => {
    // If this card is rendered inside an element with the .no-hover class, disable JS hover effects
    if (cardRef.current && cardRef.current.closest && cardRef.current.closest('.no-hover')) {
      setDisabledByNoHover(true);
    }
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={hover && !disabledByNoHover ? { scale: 1.03, transition: { duration: 0.3 } } : {}}
      transition={{
        duration: 0.8,
        delay,
        type: 'spring' as const,
        stiffness: 100,
      }}
      className={`
        ${glow ? 'animate-glow3D' : ''}
        ${hover ? 'unified-card-hover-highlight' : ''}
        ${className}
        rounded-3xl p-6
      `}
      style={{
        position: 'relative',
        overflow: 'hidden',
        transformStyle: 'preserve-3d',
        transform: disabledByNoHover
          ? 'none'
          : isHovering
          ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(30px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
        transition: disabledByNoHover ? 'none' : isHovering ? 'transform 0.1s ease-out, box-shadow 0.3s ease' : 'transform 0.3s ease-out, box-shadow 0.3s ease',
        // DOKŁADNIE jak w AchievementTimeline - złoty gradient
        background: noTransparency
          ? 'linear-gradient(135deg, #8B7542 0%, #856B38 25%, #6B5B31 50%, #594F2D 75%, #473D26 100%)'
          : 'linear-gradient(135deg, rgba(139, 117, 66, 0.4) 0%, rgba(133, 107, 56, 0.35) 25%, rgba(107, 91, 49, 0.32) 50%, rgba(89, 79, 45, 0.3) 75%, rgba(71, 61, 38, 0.28) 100%)',
        // Jasny fallback kolor, żeby blend-modey nie mogły całkowicie przyciemnić tła
        backgroundColor: noTransparency ? '#8B7542' : 'transparent',
        backgroundBlendMode: 'normal',
        // Gdy noTransparency, nadpisujemy globalne zmienne używane przez ::before/::after
        ['--card-bg' as any]: noTransparency
          ? 'linear-gradient(135deg, #8B7542 0%, #856B38 25%, #6B5B31 50%, #594F2D 75%, #473D26 100%)'
          : undefined,
        ['--blend' as any]: noTransparency ? 'normal' : undefined,
        // DOKŁADNIE jak w AchievementTimeline - złota ramka
        border: '2px solid rgba(218, 182, 98, 1)',
        borderRadius: '1.5rem',
        // Jeżeli noTransparency to usuwamy inset/backlighting i zostawiamy delikatny zewnętrzny cień
        boxShadow: noTransparency
          ? isHovering
            ? '0 8px 40px rgba(218,182,98,0.65), 0 16px 60px rgba(165,138,78,0.35)'
            : '0 4px 20px rgba(165,138,78,0.25)'
          : disabledByNoHover
          ? '0 0 20px rgba(218, 182, 98, 1), 0 0 35px rgba(189, 158, 88, 0.8), 0 0 50px rgba(165, 138, 78, 0.5), inset 0 0 40px rgba(71, 61, 38, 0.15), inset 0 2px 0 rgba(218, 182, 98, 0.6), inset 0 -2px 0 rgba(61, 51, 33, 0.4)'
          : isHovering
          ? '0 0 25px rgba(218, 182, 98, 1), 0 0 40px rgba(189, 158, 88, 0.9), 0 0 55px rgba(165, 138, 78, 0.6), inset 0 0 40px rgba(71, 61, 38, 0.15), inset 0 2px 0 rgba(218, 182, 98, 0.6), inset 0 -2px 0 rgba(61, 51, 33, 0.4)'
          : '0 0 20px rgba(218, 182, 98, 1), 0 0 35px rgba(189, 158, 88, 0.8), 0 0 50px rgba(165, 138, 78, 0.5), inset 0 0 40px rgba(71, 61, 38, 0.15), inset 0 2px 0 rgba(218, 182, 98, 0.6), inset 0 -2px 0 rgba(61, 51, 33, 0.4)',
        backdropFilter: noTransparency ? 'none' : 'blur(16px)',
        WebkitBackdropFilter: noTransparency ? 'none' : 'blur(16px)',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glowing Edges Effect */}
      {glowingEdges && (
        <>
          {/* Mesh Gradient Border */}
          <div
            className="absolute inset-0 pointer-events-none rounded-inherit transition-opacity duration-300"
            style={{
              opacity: Math.max((edgeDistance - 50) / 50, 0) * edgeGlowIntensity,
              background: `
                radial-gradient(at 80% 55%, hsla(268,100%,76%,1) 0px, transparent 50%),
                radial-gradient(at 69% 34%, hsla(349,100%,74%,1) 0px, transparent 50%),
                radial-gradient(at 8% 6%, hsla(136,100%,78%,1) 0px, transparent 50%),
                radial-gradient(at 41% 38%, hsla(192,100%,64%,1) 0px, transparent 50%),
                radial-gradient(at 86% 85%, hsla(186,100%,74%,1) 0px, transparent 50%)
              `,
              maskImage: `conic-gradient(from ${edgeAngle}deg at center, black 25%, transparent 40%, transparent 60%, black 75%)`,
              WebkitMaskImage: `conic-gradient(from ${edgeAngle}deg at center, black 25%, transparent 40%, transparent 60%, black 75%)`,
            }}
          />
          
          {/* Edge Glow */}
          <div
            className="absolute pointer-events-none rounded-inherit"
            style={{
              inset: '-20px',
              opacity: Math.max((edgeDistance - 30) / 70, 0) * edgeGlowIntensity,
              maskImage: `conic-gradient(from ${edgeAngle}deg at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`,
              WebkitMaskImage: `conic-gradient(from ${edgeAngle}deg at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`,
              mixBlendMode: 'plus-lighter',
            }}
          >
            <div
              className="absolute rounded-inherit"
              style={{
                inset: '20px',
                boxShadow: `
                  inset 0 0 0 1px hsl(280deg 90% 80% / 100%),
                  inset 0 0 15px 0 hsl(280deg 90% 80% / 30%),
                  0 0 15px 0 hsl(280deg 90% 80% / 30%)
                `,
              }}
            />
          </div>
        </>
      )}

      {/* Holographic Shine Layer */}
      {hover && !glowingEdges && (
        <>
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `
                radial-gradient(
                  circle at ${glareX}% ${glareY}%,
                  rgba(255, 255, 255, 0.8) 0%,
                  rgba(255, 255, 255, 0.3) 20%,
                  transparent 60%
                )
              `,
              mixBlendMode: 'screen',
              opacity: isHovering ? 1 : 0,
              transform: 'translateZ(10px)',
            }}
          />

          {/* Rainbow Glare Effect */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
            style={{
              opacity: glareOpacity,
              background: `
                radial-gradient(
                  circle 500px at ${glareX}% ${glareY}%,
                  rgba(100, 200, 255, 0.3),
                  rgba(255, 100, 200, 0.2),
                  transparent 40%
                )
              `,
              mixBlendMode: 'screen',
              filter: 'blur(15px)',
              transform: 'translateZ(5px)',
            }}
          />

          {/* Sparkle/Glitter Overlay */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
            style={{
              opacity: isHovering ? 0.2 : 0,
              backgroundImage: `
                radial-gradient(circle, rgba(255, 255, 255, 0.8) 1px, transparent 1px),
                radial-gradient(circle, rgba(200, 220, 255, 0.6) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px, 60px 60px',
              backgroundPosition: `${glareX * 0.5}% ${glareY * 0.5}%, ${glareX * 0.3}% ${glareY * 0.3}%`,
              mixBlendMode: 'screen',
              transform: 'translateZ(8px)',
            }}
          />
        </>
      )}

      {/* Hybrid: Both effects can coexist if needed */}
      {hover && glowingEdges && (
        <>
          {/* Subtle holographic overlay for depth */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              opacity: isHovering ? 0.3 : 0,
              background: `
                radial-gradient(
                  circle at ${glareX}% ${glareY}%,
                  rgba(255, 255, 255, 0.4) 0%,
                  rgba(255, 255, 255, 0.15) 20%,
                  transparent 50%
                )
              `,
              mixBlendMode: 'screen',
              transform: 'translateZ(10px)',
            }}
          />
        </>
      )}

      {/* Universal colorful hover gradient for all cards */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovering ? (noTransparency ? 0.5 : 0.35) : 0,
          background: `linear-gradient(135deg, rgba(255,100,150,0.35) 0%, rgba(120,80,255,0.28) 25%, rgba(0,200,255,0.22) 50%, rgba(0,220,120,0.18) 75%, rgba(255,180,60,0.15) 100%)`,
          // Nie przyciemniaj tła — używamy 'screen' zamiast 'overlay'
          mixBlendMode: 'screen',
          filter: 'blur(18px)',
          transform: 'translateZ(6px)',
        }}
      />

      {!noTransparency && <div className="card-glow-animated-border" aria-hidden="true" />}
      
      {/* Content with depth */}
      <div style={{ transform: 'translateZ(20px)', position: 'relative', zIndex: 10 }}>
        {children}
      </div>
    </motion.div>
  );
});
