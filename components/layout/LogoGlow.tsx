'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export function LogoGlow() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 2.5, delay: 0.8 }}
      className="relative z-[100]"
    >
      <Link href="/">
        <motion.div 
          className="relative"
          animate={{
            filter: [
              'drop-shadow(0 0 20px rgba(255, 255, 255, 0.8)) brightness(1.2)',
              'drop-shadow(0 0 30px rgba(255, 255, 255, 1)) brightness(1.3)',
              'drop-shadow(0 0 20px rgba(255, 255, 255, 0.8)) brightness(1.2)',
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {/* Główne logo z podświetleniem */}
          <Image
            src="/logo.png"
            alt="Pałka M.T.M. Mistrzowie Sprintu"
            width={240}
            height={240}
            className="h-60 w-auto object-contain cursor-pointer"
            style={{ 
              width: 'auto', 
              height: 'auto',
            }}
          />
        </motion.div>
      </Link>
    </motion.div>
  );
}
