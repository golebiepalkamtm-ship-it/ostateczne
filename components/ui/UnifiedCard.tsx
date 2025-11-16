'use client';

import { motion } from 'framer-motion';
import { memo, ReactNode } from 'react';

interface UnifiedCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | '3d' | 'floating' | 'gradient';
  glow?: boolean;
  hover?: boolean;
  delay?: number;
}

export const UnifiedCard = memo(function UnifiedCard({
  children,
  className = '',
  variant = 'default',
  glow = false,
  hover = true,
  delay = 0,
}: Omit<UnifiedCardProps, 'intensity'>) {
  const variantClasses = {
    default: 'card',
    glass: 'card-glass',
    '3d': 'card-3d',
    floating: 'card-floating',
    gradient: 'card-gradient',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={
        hover
          ? {
              transition: { duration: 0.3 },
            }
          : {}
      }
      transition={{
        duration: 0.8,
        delay,
        type: 'spring' as const,
        stiffness: 100,
      }}
      className={`
        ${variantClasses[variant]}
        ${glow ? 'animate-glow3D' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
});
