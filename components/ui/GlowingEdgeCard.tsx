'use client'

import { type ReactNode, useRef, useState, type MouseEvent } from 'react'

/**
 * GlowingEdgeCard - EXACT implementation from CodePen
 * https://codepen.io/simeydotme/pen/RNWoPRj
 * 
 * Features:
 * - Mesh gradient border with conic mask
 * - Mesh gradient background with squircle cutout
 * - Glowing edges following pointer
 * - Edge proximity calculations
 */

interface GlowingEdgeCardProps {
  children: ReactNode
  className?: string
  glowSensitivity?: number // 0-100, default 30
  colorSensitivity?: number // 0-100, default 50
  disabled?: boolean
  onClick?: () => void
  ariaLabel?: string
}

export function GlowingEdgeCard({
  children,
  className = '',
  glowSensitivity = 30,
  colorSensitivity = 50,
  disabled = false,
  onClick,
  ariaLabel,
}: GlowingEdgeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [pointerX, setPointerX] = useState(50)
  const [pointerY, setPointerY] = useState(50)
  const [pointerAngle, setPointerAngle] = useState(45)
  const [pointerDistance, setPointerDistance] = useState(0)

  const clamp = (value: number, min = 0, max = 100) =>
    Math.min(Math.max(value, min), max)

  const centerOfElement = (el: HTMLElement): [number, number] => {
    const { width, height } = el.getBoundingClientRect()
    return [width / 2, height / 2]
  }

  const distanceFromCenter = (el: HTMLElement, x: number, y: number): [number, number] => {
    const [cx, cy] = centerOfElement(el)
    return [x - cx, y - cy]
  }

  const closenessToEdge = (el: HTMLElement, x: number, y: number): number => {
    const [cx, cy] = centerOfElement(el)
    const [dx, dy] = distanceFromCenter(el, x, y)
    
    let k_x = Infinity
    let k_y = Infinity
    
    if (dx !== 0) {
      k_x = cx / Math.abs(dx)
    }
    if (dy !== 0) {
      k_y = cy / Math.abs(dy)
    }
    
    return clamp(1 / Math.min(k_x, k_y), 0, 1)
  }

  const angleFromPointer = (dx: number, dy: number): number => {
    let angleRadians = 0
    let angleDegrees = 0
    
    if (dx !== 0 || dy !== 0) {
      angleRadians = Math.atan2(dy, dx)
      angleDegrees = angleRadians * (180 / Math.PI) + 90
      if (angleDegrees < 0) {
        angleDegrees += 360
      }
    }
    
    return angleDegrees
  }

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled || !cardRef.current) return

    const card = cardRef.current
    const rect = card.getBoundingClientRect()
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const px = clamp((100 / rect.width) * x)
    const py = clamp((100 / rect.height) * y)
    
    const [dx, dy] = distanceFromCenter(card, x, y)
    const edge = closenessToEdge(card, x, y)
    const angle = angleFromPointer(dx, dy)

    setPointerX(px)
    setPointerY(py)
    setPointerAngle(angle)
    setPointerDistance(edge * 100)
  }

  const handleMouseLeave = () => {
    if (!disabled) {
      setPointerDistance(0)
    }
  }

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!disabled && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  // Exact opacity calculations from CodePen
  const colorOpacity = (pointerDistance - colorSensitivity) / (100 - colorSensitivity)
  const glowOpacity = (pointerDistance - glowSensitivity) / (100 - glowSensitivity)

  return (
    <div
      ref={cardRef}
      className={`
        relative rounded-[1.768em] border border-white/25
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        background: 'linear-gradient(8deg, hsl(var(--h, 260), 18%, 12%) 75%, color-mix(in hsl, hsl(var(--h, 260), 18%, 12%), white 2.5%) 75.5%)',
        isolation: 'isolate',
        transform: 'translate3d(0, 0, 0.01px)',
        boxShadow: `
          rgba(0, 0, 0, 0.1) 0px 1px 2px,
          rgba(0, 0, 0, 0.1) 0px 2px 4px,
          rgba(0, 0, 0, 0.1) 0px 4px 8px,
          rgba(0, 0, 0, 0.1) 0px 8px 16px,
          rgba(0, 0, 0, 0.1) 0px 16px 32px,
          rgba(0, 0, 0, 0.1) 0px 32px 64px
        `,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-label={ariaLabel}
      aria-disabled={disabled}
    >
      {/* Mesh Gradient Border - ::before equivalent */}
      <div
        className="absolute inset-0 rounded-[1.768em] pointer-events-none transition-opacity duration-[250ms] ease-out"
        style={{
          opacity: pointerDistance === 0 ? 0 : colorOpacity,
          border: '1px solid transparent',
          background: `
            linear-gradient(hsl(var(--h, 260), 18%, 12%) 0 100%) padding-box,
            linear-gradient(rgb(255 255 255 / 0%) 0% 100%) border-box,
            radial-gradient(at 80% 55%, hsla(268,100%,76%,1) 0px, transparent 50%) border-box,
            radial-gradient(at 69% 34%, hsla(349,100%,74%,1) 0px, transparent 50%) border-box,
            radial-gradient(at 8% 6%, hsla(136,100%,78%,1) 0px, transparent 50%) border-box,
            radial-gradient(at 41% 38%, hsla(192,100%,64%,1) 0px, transparent 50%) border-box,
            radial-gradient(at 86% 85%, hsla(186,100%,74%,1) 0px, transparent 50%) border-box,
            radial-gradient(at 82% 18%, hsla(52,100%,65%,1) 0px, transparent 50%) border-box,
            radial-gradient(at 51% 4%, hsla(12,100%,72%,1) 0px, transparent 50%) border-box,
            linear-gradient(#c299ff 0 100%) border-box
          `,
          maskImage: `conic-gradient(from ${pointerAngle}deg at center, black 25%, transparent 40%, transparent 60%, black 75%)`,
          WebkitMaskImage: `conic-gradient(from ${pointerAngle}deg at center, black 25%, transparent 40%, transparent 60%, black 75%)`,
          zIndex: -1,
        }}
      />

      {/* Mesh Gradient Background - ::after equivalent */}
      <div
        className="absolute inset-0 rounded-[1.768em] pointer-events-none transition-opacity duration-[250ms] ease-out"
        style={{
          opacity: pointerDistance === 0 ? 0 : colorOpacity,
          border: '1px solid transparent',
          background: `
            radial-gradient(at 80% 55%, hsla(268,100%,76%,1) 0px, transparent 50%) padding-box,
            radial-gradient(at 69% 34%, hsla(349,100%,74%,1) 0px, transparent 50%) padding-box,
            radial-gradient(at 8% 6%, hsla(136,100%,78%,1) 0px, transparent 50%) padding-box,
            radial-gradient(at 41% 38%, hsla(192,100%,64%,1) 0px, transparent 50%) padding-box,
            radial-gradient(at 86% 85%, hsla(186,100%,74%,1) 0px, transparent 50%) padding-box,
            radial-gradient(at 82% 18%, hsla(52,100%,65%,1) 0px, transparent 50%) padding-box,
            radial-gradient(at 51% 4%, hsla(12,100%,72%,1) 0px, transparent 50%) padding-box,
            linear-gradient(#c299ff 0 100%) padding-box
          `,
          maskImage: `
            linear-gradient(to bottom, black, black),
            radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%),
            radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%),
            radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%),
            radial-gradient(ellipse at 66% 33%, black 5%, transparent 40%),
            radial-gradient(ellipse at 33% 66%, black 5%, transparent 40%),
            conic-gradient(from ${pointerAngle}deg at center, transparent 5%, black 15%, black 85%, transparent 95%)
          `,
          WebkitMaskImage: `
            linear-gradient(to bottom, black, black),
            radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%),
            radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%),
            radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%),
            radial-gradient(ellipse at 66% 33%, black 5%, transparent 40%),
            radial-gradient(ellipse at 33% 66%, black 5%, transparent 40%),
            conic-gradient(from ${pointerAngle}deg at center, transparent 5%, black 15%, black 85%, transparent 95%)
          `,
          maskComposite: 'subtract, add, add, add, add, add',
          WebkitMaskComposite: 'source-over',
          mixBlendMode: 'soft-light',
          zIndex: -1,
        }}
      />

      {/* Glowing Edge - .glow equivalent */}
      <div
        className="absolute pointer-events-none rounded-[1.768em] transition-opacity duration-200 ease-out"
        style={{
          inset: '-40px',
          opacity: pointerDistance === 0 ? 0 : glowOpacity,
          maskImage: `conic-gradient(from ${pointerAngle}deg at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`,
          WebkitMaskImage: `conic-gradient(from ${pointerAngle}deg at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`,
          mixBlendMode: 'plus-lighter',
          zIndex: 1,
        }}
      >
        <div
          className="absolute rounded-[1.768em]"
          style={{
            inset: '40px',
            boxShadow: `
              inset 0 0 0 1px hsl(280deg 90% 80% / 100%),
              inset 0 0 1px 0 hsl(280deg 90% 80% / 60%),
              inset 0 0 3px 0 hsl(280deg 90% 80% / 50%),
              inset 0 0 6px 0 hsl(280deg 90% 80% / 40%),
              inset 0 0 15px 0 hsl(280deg 90% 80% / 30%),
              inset 0 0 25px 2px hsl(280deg 90% 80% / 20%),
              inset 0 0 50px 2px hsl(280deg 90% 80% / 10%),
              0 0 1px 0 hsl(280deg 90% 80% / 60%),
              0 0 3px 0 hsl(280deg 90% 80% / 50%),
              0 0 6px 0 hsl(280deg 90% 80% / 40%),
              0 0 15px 0 hsl(280deg 90% 80% / 30%),
              0 0 25px 2px hsl(280deg 90% 80% / 20%),
              0 0 50px 2px hsl(280deg 90% 80% / 10%)
            `,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
