'use client';

export function HeroSection() {
  return (
    <section className="text-center pt-32 flex flex-col min-h-screen" suppressHydrationWarning={true}>
      <div className="max-w-6xl mx-auto px-4 flex flex-col justify-center" suppressHydrationWarning={true}>
        {/* Tytuł - Efekt złocistego tekstu 3D */}
        <div className="mb-2" suppressHydrationWarning={true}>
          <div className="gold-text-3d" suppressHydrationWarning={true}>
            <div className="bg" suppressHydrationWarning={true}>Pałka MTM</div>
            <div className="fg" suppressHydrationWarning={true}>Pałka MTM</div>
          </div>
          <div className="gold-text-3d-subtitle mt-2" suppressHydrationWarning={true}>
            <div className="bg" suppressHydrationWarning={true}>Mistrzowie Sprintu</div>
            <div className="fg" suppressHydrationWarning={true}>Mistrzowie Sprintu</div>
          </div>
        </div>

        {/* Główny gołąb - magiczna animacja boingInUp */}
        <div className="flex justify-center relative z-20 mt-0 magictime boingInUp" style={{ animationDelay: '0.5s' }} suppressHydrationWarning={true}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pigeon.gif"
            alt="Gołębie pocztowe w locie - Pałka MTM"
            width="600"
            height="600"
            style={{
              width: '600px',
              height: '600px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 20px 13px rgb(0 0 0 / 0.3))',
            }}
          />
        </div>
      </div>
    </section>
  );
}
