import { SimpleChampionsList } from '@/components/champions/SimpleChampionsList';
import { Metadata } from 'next';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';

export const metadata: Metadata = {
  title: 'Nasi Championi - Gołębie Pocztowe Palka MTM',
  description: 'Poznaj naszych wybitnych gołębi pocztowych - championów, którzy osiągają najlepsze wyniki w zawodach.',
  keywords: ['gołębie pocztowe', 'championi', 'palka mtm', 'gołębie wyścigowe', 'hodowla gołębi'],
  openGraph: {
    title: 'Nasi Championi - Gołębie Pocztowe Palka MTM',
    description: 'Poznaj naszych wybitnych gołębi pocztowych - championów, którzy osiągają najlepsze wyniki w zawodach.',
    url: '/champions',
    images: [
      {
        url: '/images/champions-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Championi Gołębi Pocztowych Palka MTM',
      },
    ],
  },
};

export default function ChampionsPage() {
  return (
    <UnifiedLayout isHomePage={true}>
      {/* Hero Section */}
      <section
        className="relative z-10 pt-44 pb-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="gold-text-3d mb-6">
            <div className="bg">Champions</div>
            <div className="fg">Champions</div>
          </div>
        </div>
      </section>

      {/* Champions Carousel */}
      <div className="relative z-10 pb-20">
        <SimpleChampionsList />
      </div>
    </UnifiedLayout>
  );
}
