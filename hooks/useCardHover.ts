import { useRef, useState, useCallback, type MouseEvent } from 'react'

/**
 * useCardHover - Custom hook for Pokemon-style card hover effects
 * 
 * Provides state and handlers for 3D rotation and holographic effects
 * Optimized for performance with useCallback and minimal re-renders
 */

interface UseCardHoverOptions {
  intensity?: number // 0-1 scale
  disabled?: boolean
  maxRotation?: number
}

interface CardHoverState {
  isHovering: boolean
  rotateX: number
  rotateY: number
  glareX: number
  glareY: number
  glareOpacity: number
  pointerFromCenter: number
}

export function useCardHover(options: UseCardHoverOptions = {}) {
  const {
    intensity = 0.7,
    disabled = false,
    maxRotation = 25,
  } = options

  const cardRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<CardHoverState>({
    isHovering: false,
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    glareOpacity: 0,
    pointerFromCenter: 0,
  })

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (disabled || !cardRef.current) return

      const card = cardRef.current
      const rect = card.getBoundingClientRect()

      // Mouse position (0-100%)
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      // Distance from center
      const distanceX = (x - 50) / 50
      const distanceY = (y - 50) / 50
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2)

      // Rotation (inverted for natural feel)
      const rotY = distanceX * maxRotation * intensity
      const rotX = -distanceY * maxRotation * intensity

      setState({
        isHovering: true,
        rotateX: rotX,
        rotateY: rotY,
        glareX: x,
        glareY: y,
        glareOpacity: Math.min(distance, 1) * 0.6,
        pointerFromCenter: Math.min(distance, 1),
      })
    },
    [disabled, intensity, maxRotation],
  )

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setState((prev) => ({ ...prev, isHovering: true }))
    }
  }, [disabled])

  const handleMouseLeave = useCallback(() => {
    if (!disabled) {
      setState({
        isHovering: false,
        rotateX: 0,
        rotateY: 0,
        glareX: 50,
        glareY: 50,
        glareOpacity: 0,
        pointerFromCenter: 0,
      })
    }
  }, [disabled])

  return {
    cardRef,
    state,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  }
}
