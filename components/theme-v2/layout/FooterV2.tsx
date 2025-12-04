/**
 * V2 Theme - Footer Component
 * Minimalistyczna stopka z subtelnymi mikrointerakcjami
 */

'use client';

import React from 'react';
import Link from 'next/link';

interface FooterV2Props {
  className?: string;
}

export const FooterV2: React.FC<FooterV2Props> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Aukcje', href: '/auctions' },
      { label: 'Czempiony', href: '/champions' },
      { label: 'Złota Para', href: '/golden-pair' },
      { label: 'Referencje', href: '/references' },
    ],
    company: [
      { label: 'O nas', href: '/about' },
      { label: 'Kontakt', href: '/contact' },
      { label: 'Prasa', href: '/press' },
      { label: 'Spotkania', href: '/breeder-meetings' },
    ],
    legal: [
      { label: 'Polityka prywatności', href: '/privacy' },
      { label: 'Regulamin', href: '/terms' },
      { label: 'Cookies', href: '/cookies' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', icon: 'facebook', href: '#', color: 'hover:text-blue-600' },
    { name: 'Twitter', icon: 'twitter', href: '#', color: 'hover:text-blue-400' },
    { name: 'Instagram', icon: 'instagram', href: '#', color: 'hover:text-pink-600' },
    { name: 'LinkedIn', icon: 'linkedin', href: '#', color: 'hover:text-blue-700' },
  ];

  return (
    <footer 
      className={`
        w-full 
        bg-gradient-to-b from-white to-gray-50
        border-t border-gray-200
        ${className}
      `}
    >
      <div className="container mx-auto px-6 py-12">
        {/* Główna zawartość */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Logo i opis */}
          <div className="lg:col-span-2">
            <Link 
              href="/"
              className="inline-flex items-center space-x-3 mb-4 group"
            >
              <div className="
                w-10 h-10 
                bg-gradient-to-br from-blue-500 to-blue-600
                rounded-xl
                flex items-center justify-center
                transition-transform duration-300
                group-hover:rotate-12 group-hover:shadow-lg
              ">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Aukcje Gołębi
              </span>
            </Link>
            <p className="text-gray-600 text-sm mb-6 max-w-sm leading-relaxed">
              Profesjonalna platforma aukcyjna dla hodowców gołębi pocztowych. 
              Łączymy pasję z nowoczesnymi technologiami.
            </p>
            {/* Social Media */}
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className={`
                    w-10 h-10 
                    flex items-center justify-center
                    bg-gray-100 hover:bg-gray-200
                    text-gray-600 ${social.color}
                    rounded-lg
                    transition-all duration-300
                    hover:scale-110 hover:shadow-md
                    active:scale-95
                  `}
                  aria-label={social.name}
                >
                  {/* Placeholder icon - można zastąpić prawdziwymi ikonami */}
                  <span className="text-lg">
                    {social.icon === 'facebook' && 'f'}
                    {social.icon === 'twitter' && '𝕏'}
                    {social.icon === 'instagram' && '📷'}
                    {social.icon === 'linkedin' && 'in'}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Produkt */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Produkt
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="
                      text-gray-600 hover:text-blue-600
                      text-sm
                      transition-colors duration-200
                      inline-block
                      hover:translate-x-1
                      transform
                    "
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Firma */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Firma
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="
                      text-gray-600 hover:text-blue-600
                      text-sm
                      transition-colors duration-200
                      inline-block
                      hover:translate-x-1
                      transform
                    "
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Prawne */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Prawne
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="
                      text-gray-600 hover:text-blue-600
                      text-sm
                      transition-colors duration-200
                      inline-block
                      hover:translate-x-1
                      transform
                    "
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-200 my-8" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-gray-600">
            © {currentYear} Aukcje Gołębi Pałka MTM. Wszelkie prawa zastrzeżone.
          </p>
          
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <span className="flex items-center">
              Wykonane z <span className="text-red-500 mx-1 animate-pulse">❤️</span> dla hodowców
            </span>
          </div>
        </div>

        {/* Version Badge */}
        <div className="mt-6 text-center">
          <span className="
            inline-block px-3 py-1 
            bg-blue-50 border border-blue-200 rounded-full 
            text-xs text-blue-600 font-mono
          ">
            V2 Theme • Modern Design
          </span>
        </div>
      </div>
    </footer>
  );
};
