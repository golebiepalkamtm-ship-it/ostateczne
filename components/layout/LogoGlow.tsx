'use client';

import Image from 'next/image';
import Link from 'next/link';

export function LogoGlow() {
  return (
    <div className="relative z-[100]" suppressHydrationWarning={true}>
      <Link href="/" suppressHydrationWarning={true}>
        <div className="relative" suppressHydrationWarning={true}>
          {/* Główne logo z podświetleniem - dopasowane */}
          <Image
            src="/logo.png"
            alt="Pałka M.T.M. Mistrzowie Sprintu"
            width={220}
            height={220}
            className="object-contain cursor-pointer"
            style={{
              width: '220px',
              height: '220px',
              maxWidth: '220px',
              maxHeight: '220px',
              filter: 'drop-shadow(0 0 25px rgba(218, 182, 98, 0.9)) drop-shadow(0 0 40px rgba(189, 158, 88, 0.7)) brightness(1.15)',
            }}
            unoptimized
            priority
          />
        </div>
      </Link>
    </div>
  );
}
