'use client';

import { Text3D } from '@/components/ui/Text3D';

// Scroll reveal hook - removed

// Styled card component matching AchievementTimeline
interface GoldenCardProps {
  children: React.ReactNode;
  className?: string;
}

function GoldenCard({ children, className = '' }: GoldenCardProps) {
  return (
    <div className="relative">
      {/* 3D Shadow layers */}
      {[...Array(11)].map((_, i) => {
        const layer = 11 - i;
        const offset = layer * 1.5;
        const opacity = Math.max(0.2, 0.7 - layer * 0.05);

        return (
          <div
            key={i}
            className="absolute inset-0 rounded-3xl border-2 backdrop-blur-sm"
            style={{
              borderColor: `rgba(0, 0, 0, ${opacity})`,
              backgroundColor: `rgba(0, 0, 0, ${opacity * 0.8})`,
              transform: `translateX(${offset}px) translateY(${offset / 2}px) translateZ(-${offset}px)`,
              zIndex: i + 1,
            }}
            aria-hidden="true"
          />
        );
      })}

      <article
        className={`glass-morphism shimmer-gold-mega relative z-[12] w-full rounded-[2rem] border-4 p-12 lg:p-16 text-white overflow-hidden backdrop-blur-xl ${className}`}
        style={{
          background: 'linear-gradient(135deg, rgba(139, 117, 66, 1) 0%, rgba(133, 107, 56, 1) 25%, rgba(107, 91, 49, 1) 50%, rgba(89, 79, 45, 1) 75%, rgba(71, 61, 38, 1) 100%)',
          borderColor: 'rgba(218, 182, 98, 1)',
          boxShadow: '0 0 30px rgba(218, 182, 98, 1), 0 0 50px rgba(189, 158, 88, 1), 0 0 70px rgba(165, 138, 78, 0.8), inset 0 0 40px rgba(71, 61, 38, 0.5), inset 0 2px 0 rgba(218, 182, 98, 1), inset 0 -2px 0 rgba(61, 51, 33, 0.6)',
        }}
      >
        {/* Inner light effects */}
        <div
          className="absolute inset-0 pointer-events-none rounded-3xl"
          style={{
            background: `
              radial-gradient(ellipse 800px 600px at 20% 30%, rgba(255, 245, 200, 0.25) 0%, transparent 50%),
              radial-gradient(ellipse 600px 500px at 80% 70%, rgba(218, 182, 98, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse 400px 300px at 50% 50%, rgba(255, 235, 180, 0.15) 0%, transparent 60%)
            `,
            backdropFilter: 'blur(80px)',
            mixBlendMode: 'soft-light',
            zIndex: 1,
          }}
        />
        <div className="relative z-10">
          {children}
        </div>
      </article>
    </div>
  );
}

export default function AboutPageClient() {
  return (
    <>
      {/* Hero Section */}
      <section
        className="relative z-10 pt-44 pb-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold white-text-shadow mb-6">
            O nas
          </h1>
          <h2 className="text-2xl md:text-4xl font-semibold white-text-shadow mb-8 max-w-3xl mx-auto">
            Poznaj historię i pasję stojącą za hodowlą gołębi pocztowych MTM Pałka
          </h2>
        </div>
      </section>

      {/* Content Sections */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pb-20 magictime twisterInUp" style={{ animationDuration: '1s', animationDelay: '0.35s' }}>
        <div className="max-w-7xl mx-auto">
          {/* Historia MTM Pałka */}
          <section className="mb-20">
            <GoldenCard className="p-12">
              <Text3D
                variant="gradient"
                intensity="medium"
                className="text-3xl md:text-4xl font-bold mb-8 text-center"
              >
                MTM Pałka: Gdzie Rodzinna Pasja Spotyka Mistrzostwo Sprintu
              </Text3D>

              <div className="prose prose-lg max-w-none text-white/90 leading-relaxed">
                <p className="mb-6">
                  Witamy w świecie MTM Pałka – hodowli gołębi pocztowych, której fundamentem jest
                  historia trzech pokoleń, a siłą napędową bezgraniczna miłość do lotu. W sercu
                  Dolnego Śląska, pod niebem Lubania, od ponad czterdziestu pięciu lat piszemy sagę,
                  w której precyzja genetyki łączy się z siłą rodzinnych więzi. Nasza nazwa to
                  symbol jedności – Mariusz, Tadeusz, Marcin Pałka – ojciec i synowie, których
                  połączyła wspólna pasja.
                </p>

                <p className="mb-6">
                  Specjalizujemy się w tym, co najtrudniejsze i najbardziej ekscytujące: w lotach
                  sprinterskich. Dla nas gołębiarstwo to sztuka strategii, intuicji i codziennej,
                  ciężkiej pracy.
                </p>

                <div className="mb-8">
                  <h3 className="text-2xl font-bold uppercase tracking-[0.3em] text-white/60 mb-4">
                    Filozofia Mistrza: Ojciec Założyciel Tadeusz Pałka
                  </h3>
                  <p className="mb-4 text-white/80">
                    U steru naszej hodowli od samego początku, czyli od lat 80., stoi Tadeusz Pałka –
                    patriarcha, mentor i wizjoner. To on wpoił nam filozofię, że prawdziwego hodowcę
                    poznaje się nie po zasobności portfela, lecz po oddaniu. Przez 365 dni w roku
                    jesteśmy dla naszych ptaków weterynarzami, dietetykami i trenerami.
                  </p>
                  <p className="text-white/80">
                    Tadeusz mawia: &quot;Ptaki to czują&quot;, a wyniki, które osiągamy, są tego
                    najlepszym dowodem. Jego dekady doświadczenia to kapitał, na którym budujemy nasze
                    dzisiejsze sukcesy.
                  </p>
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-bold uppercase tracking-[0.3em] text-white/60 mb-4">
                    Siła Pokoleń: Energia, Która Zmieniła Wszystko
                  </h3>
                  <p className="mb-4 text-white/80">
                    Prawdziwy przełom nastąpił, gdy do Tadeusza dołączyli synowie, wnosząc nową
                    energię i odwagę do działania. To właśnie Mariusz Pałka, jego prawa ręka, wraz z
                    ojcem na przełomie wieków zrewolucjonizował naszą hodowlę. Import elitarnych
                    gołębi z linii Janssen, Vandenabeele czy od mistrzów jak Gerhard Peters, nasycił
                    nasze stado genem zwycięzców i nadał mu niezrównaną szybkość.
                  </p>
                  <p className="text-white/80">
                    Dziś tę misję kontynuuje Marcin Pałka, który od dziecka związany jest z
                    gołębnikiem. Jego precyzja w logistyce i organizacji lotów zapewnia, że każdy
                    start naszych podopiecznych jest przygotowany perfekcyjnie. To dzięki tej synergii
                    pokoleń MTM Pałka stało się synonimem &quot;mistrzów sprintu&quot;.
                  </p>
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-bold uppercase tracking-[0.3em] text-white/60 mb-4">
                    W Cieniu Skrzydeł: Historia, Która Daje Nam Siłę
                  </h3>
                  <p className="mb-4 text-white/80">
                    Nasza droga nie była usłana wyłącznie sukcesami. 29 stycznia 2006 roku tragedia na
                    Międzynarodowych Targach Katowickich na zawsze zabrała nam Mariusza. Jego odejście
                    pozostawiło pustkę, ale jego pasja i marzenia stały się naszym największym
                    zobowiązaniem. Tadeusz, jako lider rodziny, przekuł niewyobrażalny ból w
                    determinację, by dziedzictwo syna trwało w każdym locie i każdym kolejnym
                    pokoleniu mistrzów z naszego gołębnika.
                  </p>
                  <p className="text-white/80">
                    Adrenalina towarzysząca oczekiwaniu na powrót stada to dziś coś więcej niż sport –
                    to hołd dla pamięci i symbol niezłomności.
                  </p>
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-bold uppercase tracking-[0.3em] text-white/60 mb-4">
                    Tradycja w Nowoczesnym Wydaniu: MTM Pałka Dziś
                  </h3>
                  <p className="mb-4 text-white/80">
                    Dziś MTM Pałka to hodowla, która z szacunkiem patrzy w przeszłość, ale odważnie
                    spogląda w przyszłość.
                  </p>
                  <p className="mb-4 text-white/80">
                    Elitarne Pochodzenie: Nasz gołębnik jest domem dla potomków legendarnych
                    sprinterów, a ich jakość potwierdzają hodowcy w całej Polsce.
                  </p>
                  <p className="text-white/80">
                    Zapraszamy do poznania naszej historii i naszych skrzydlatych atletów. MTM Pałka
                    to więcej niż hodowla – to dowód, że największe sukcesy rodzą się z serca,
                    wytrwałości i rodzinnych więzi.
                  </p>
                </div>
              </div>
            </GoldenCard>
          </section>
        </div>
      </div>
    </>
  );
}
