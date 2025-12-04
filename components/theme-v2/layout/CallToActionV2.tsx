/**
 * V2 Theme - Call To Action Component
 * Sekcja CTA z mikrointerakcjami i eleganckim designem
 */

'use client';

import React from 'react';
import type { CTAButton } from '../types';

interface CallToActionV2Props {
  title?: string;
  description?: string;
  buttons?: CTAButton[];
  className?: string;
}

const defaultButtons: CTAButton[] = [
  { id: 'primary', text: 'Rozpocznij teraz', href: '/auctions', variant: 'primary', size: 'lg' },
  { id: 'secondary', text: 'Dowiedz się więcej', href: '/about', variant: 'secondary', size: 'lg' },
];

export const CallToActionV2: React.FC<CallToActionV2Props> = ({
  title = 'Gotowy na nowe doświadczenia?',
  description = 'Dołącz do społeczności hodowców i odkryj najlepsze aukcje gołębi pocztowych.',
  buttons = defaultButtons,
  className = '',
}) => {
  const getButtonStyles = (variant: CTAButton['variant'], size: CTAButton['size'] = 'md') => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 ease-out';
    
    const sizeStyles = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    const variantStyles = {
      primary: `
        bg-blue-600 hover:bg-blue-700 
        text-white 
        shadow-lg shadow-blue-500/30 
        hover:shadow-xl hover:shadow-blue-500/40
        hover:scale-105 
        active:scale-95
      `,
      secondary: `
        bg-white hover:bg-gray-50
        text-blue-600 
        border-2 border-blue-600
        hover:border-blue-700
        hover:scale-105 
        active:scale-95
      `,
      ghost: `
        bg-transparent hover:bg-blue-50
        text-blue-600
        hover:scale-105
        active:scale-95
      `,
    };

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`;
  };

  return (
    <section 
      className={`
        relative w-full py-24 overflow-hidden
        bg-gradient-to-br from-gray-50 via-white to-blue-50
        ${className}
      `}
    >
      {/* Dekoracyjne tło */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div 
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full opacity-10 blur-3xl animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl animate-pulse"
          style={{ animationDuration: '6s', animationDelay: '1s' }}
        />
        
        {/* Geometryczne wzory */}
        <div className="absolute top-10 left-10 w-20 h-20 border border-blue-200 rotate-45 opacity-20 animate-spin" style={{ animationDuration: '15s' }} />
        <div className="absolute bottom-10 right-10 w-32 h-32 border-2 border-blue-300 rounded-full opacity-10 animate-pulse" />
      </div>

      {/* Zawartość */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center px-4 py-2 mb-6 bg-blue-50 border border-blue-200 rounded-full text-sm font-medium text-blue-600 animate-fadeIn">
          <span className="mr-2">🎯</span>
          Twoja szansa
        </div>

        {/* Tytuł */}
        <h2 
          className="
            text-4xl md:text-5xl lg:text-6xl 
            font-bold text-gray-900 
            mb-6
            transition-all duration-500
            hover:scale-105
          "
          style={{
            textShadow: '0 2px 20px rgba(59, 130, 246, 0.05)',
          }}
        >
          {title}
        </h2>

        {/* Opis */}
        <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          {description}
        </p>

        {/* Przyciski */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {buttons.map((button) => (
            <a
              key={button.id}
              href={button.href}
              className={getButtonStyles(button.variant, button.size)}
            >
              {button.text}
              {button.variant === 'primary' && (
                <svg 
                  className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </a>
          ))}
        </div>

        {/* Statystyki/Social Proof */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { label: 'Aktywnych użytkowników', value: '1,200+', icon: '👥' },
            { label: 'Zrealizowanych aukcji', value: '3,500+', icon: '🏆' },
            { label: 'Zadowolonych hodowców', value: '98%', icon: '⭐' },
          ].map((stat, index) => (
            <div 
              key={index}
              className="
                p-6 
                bg-white/60 backdrop-blur-sm
                border border-gray-200 rounded-2xl
                transition-all duration-300
                hover:bg-white hover:shadow-lg hover:scale-105
                group
              "
            >
              <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-110">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </section>
  );
};
