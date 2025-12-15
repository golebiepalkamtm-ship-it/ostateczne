'use client';

export function HeroSection() {
  return (
    <section className="text-center pt-32 flex flex-col min-h-screen" suppressHydrationWarning={true}>
      <div className="max-w-6xl mx-auto px-4 flex flex-col justify-center" suppressHydrationWarning={true}>
        {/* Tytuł - Efekt złocistego tekstu 3D - teraz responsywny */}
        <div className="mb-2" suppressHydrationWarning={true}>
          <h1 className="responsive-heading font-bold white-text-shadow text-center" suppressHydrationWarning={true}>
            Pałka MTM
          </h1>
          <h2 className="responsive-subheading font-semibold white-text-shadow text-center mt-2" suppressHydrationWarning={true}>
            Mistrzowie Sprintu
          </h2>
        </div>

        {/* Główny gołąb - magiczna animacja boingInUp - teraz responsywny */}
        <div className="flex justify-center relative z-20 mt-0 magictime boingInUp" style={{ animationDelay: '0.5s' }} suppressHydrationWarning={true}>
          <img
            src="/pigeon.gif"
            alt="Gołębie pocztowe w locie - Pałka MTM"
            className="hero-section-image responsive-image"
            style={{
              filter: 'drop-shadow(0 20px 13px rgb(0 0 0 / 0.3))',
            }}
          />
        </div>
      </div>
    </section>
  );
}
