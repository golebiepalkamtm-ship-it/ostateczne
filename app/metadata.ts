import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  ),
  title: 'Palka Auctions: Mistrzowie Sprintu Gołębie Pocztowe…',
  description: 'Ekskluzywna platforma aukcyjna dla hodowcow golebi pocztowych',
  authors: [
    {
      name: 'Palka MTM - Mistrzowie Sprintu',
      url: 'https://palka.mtm.pl',
    },
  ],
  icons: {
    apple: [
      {
        url: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Palka MTM - Mistrzowie Sprintu',
    description: 'Ekskluzywna platforma aukcyjna dla hodowcow golebi pocztowych',
    type: 'website',
    locale: 'pl_PL',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Palka MTM - Mistrzowie Sprintu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Palka MTM - Mistrzowie Sprintu',
    description: 'Ekskluzywna platforma aukcyjna dla hodowcow golebi pocztowych',
    images: ['/logo.png'],
  },
};
