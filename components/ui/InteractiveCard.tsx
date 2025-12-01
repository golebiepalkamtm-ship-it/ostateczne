'use client'

import { type ReactNode, useRef, useState, useEffect, type MouseEvent } from 'react'

/**
 * InteractiveCard - Pokemon-style holographic card effect with mouse tracking
 * 
 * Features:
 * - 3D rotation based on mouse position
 * - Holographic shine/glare effects
 * - Smooth spring animations
 * - Fully responsive
 * - WCAG 2.1 AA compliant
 * 
 * @example
 * <InteractiveCard className="p-6">
 *   <h2>Auction Title</h2>
 *   <p>Details...</p>
 * </InteractiveCard>
 */

interface InteractiveCardProps {
  children: ReactNode
  className?: string
  intensity?: number // 0-1 scale for effect intensity
  disabled?: boolean
  onClick?: () => void
  ariaLabel?: string
}

export function InteractiveCard({
  children,
  className = '',
  intensity = 0.7,
  disabled = false,
  onClick,
  ariaLabel,
}: InteractiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [glareX, setGlareX] = useState(50)
  const [glareY, setGlareY] = useState(50)
  const [glareOpacity, setGlareOpacity] = useState(0)

  const maxRotation = 25 * intensity
  const springConfig = { tension: 120, friction: 14 }

  useEffect(() => {
    if (!isHovering && !disabled) {
      // Snap back to center with spring animation
      const snapBack = () => {
        setRotateX(0)
        setRotateY(0)
        setGlareX(50)
        setGlareY(50)
        setGlareOpacity(0)
      }
      const timeout = setTimeout(snapBack, 50)
      return () => clearTimeout(timeout)
    }
  }, [isHovering, disabled])

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (disabled || !cardRef.current) return

    const card = cardRef.current
    const rect = card.getBoundingClientRect()
    
    // Calculate mouse position relative to card center (0-100%)
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Calculate distance from center (0-1)
    const distanceX = (x - 50) / 50
    const distanceY = (y - 50) / 50
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2)

    // Calculate rotation (inverted for natural feel)
    const rotY = distanceX * maxRotation
    const rotX = -distanceY * maxRotation

    setRotateX(rotX)
    setRotateY(rotY)
    setGlareX(x)
    setGlareY(y)
    setGlareOpacity(Math.min(distance, 1) * 0.6)
  }

  function handleMouseEnter() {
    if (!disabled) {
      setIsHovering(true)
    }
  }

  function handleMouseLeave() {
    if (!disabled) {
      setIsHovering(false)
    }
  }

  function handleClick() {
    if (!disabled && onClick) {
      onClick()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!disabled && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      ref={cardRef}
      className={`
        group relative overflow-hidden rounded-xl
        transition-all duration-300 ease-out
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
        transition: isHovering ? 'transform 0.1s ease-out' : 'all 0.3s ease-out',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-label={ariaLabel}
      aria-disabled={disabled}
    >
      {/* Holographic Shine Layer */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `
            radial-gradient(
              circle at ${glareX}% ${glareY}%,
              rgba(255, 255, 255, 0.8) 0%,
              rgba(255, 255, 255, 0.4) 20%,
              transparent 70%
            )
          `,
          mixBlendMode: 'overlay',
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
              circle 600px at ${glareX}% ${glareY}%,
              rgba(255, 100, 200, 0.3),
              rgba(100, 200, 255, 0.3),
              transparent 40%
            )
          `,
          mixBlendMode: 'color-dodge',
          filter: 'blur(20px)',
          transform: 'translateZ(5px)',
        }}
      />

      {/* Sparkle/Glitter Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-500"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(255, 255, 255, 0.8) 1px, transparent 1px),
            radial-gradient(circle, rgba(200, 220, 255, 0.6) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px, 80px 80px',
          backgroundPosition: `${glareX * 0.5}% ${glareY * 0.5}%, ${glareX * 0.3}% ${glareY * 0.3}%`,
          mixBlendMode: 'screen',
          transform: 'translateZ(8px)',
        }}
      />

      {/* Content */}
      <div
        className="relative z-10"
        style={{
          transform: 'translateZ(20px)',
        }}
      >
        {children}
      </div>

      {/* Border Highlight */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `
            linear-gradient(
              ${Math.atan2(glareY - 50, glareX - 50) * (180 / Math.PI)}deg,
              rgba(255, 255, 255, 0.5),
              transparent 30%
            )
          `,
          padding: '1px',
          mask: 'linear-gradient(white, white) content-box, linear-gradient(white, white)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'destination-out',
        }}
      />
    </div>
  )
}
