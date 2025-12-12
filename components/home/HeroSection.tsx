'use client';

export function HeroSection() {
  return (
    <section className="text-center pt-32 flex flex-col min-h-screen">
      <div className="max-w-6xl mx-auto px-4 flex flex-col justify-center">
        {/* Tytuł - pojawia się z dwóch stron */}
        <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-tight mb-2">
          <div
            className="block animate__animated animate__slow animate__backInRight"
            style={{ animationDelay: '0.70s' }}
          >
            {'Pałka MTM'.split('').map((letter, index) => (
              <span key={index} className="hero-title-nav-style inline-block">
                {letter === ' ' ? '\u00A0' : letter}
              </span>
            ))}
          </div>
          <div
            className="block mt-2 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl animate__animated animate__slow animate__backInLeft"
            style={{ animationDelay: '0.85s' }}
          >
            {'Mistrzowie Sprintu'.split('').map((letter, index) => (
              <span key={index} className="hero-title-nav-style inline-block">
                {letter === ' ' ? '\u00A0' : letter}
              </span>
            ))}
          </div>
        </h1>

        {/* Główny gołąb - animacja wejścia zachowana */}
        <div className="flex justify-center relative z-20 mt-0">
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
