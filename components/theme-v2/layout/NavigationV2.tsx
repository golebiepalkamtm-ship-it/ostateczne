/**
 * V2 Theme - Navigation Component
 * Minimalistyczna nawigacja z płynnymi mikrointerakcjami
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { NavigationItem } from '../types';

interface NavigationV2Props {
  items?: NavigationItem[];
  className?: string;
  onThemeToggle?: () => void;
}

const defaultItems: NavigationItem[] = [
  { id: 'home', label: 'Główna', href: '/' },
  { id: 'auctions', label: 'Aukcje', href: '/auctions', badge: 'Nowe' },
  { id: 'champions', label: 'Czempiony', href: '/champions' },
  { id: 'about', label: 'O nas', href: '/about' },
  { id: 'contact', label: 'Kontakt', href: '/contact' },
];

export const NavigationV2: React.FC<NavigationV2Props> = ({
  items = defaultItems,
  className = '',
  onThemeToggle,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string>('home');

  return (
    <nav 
      className={`
        sticky top-0 z-50 w-full
        bg-white/80 backdrop-blur-lg
        border-b border-gray-200/50
        transition-all duration-300
        ${className}
      `}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link 
            href="/"
            className="
              flex items-center space-x-3
              group
              transition-transform duration-300
              hover:scale-105
            "
          >
            <div className="
              w-10 h-10 
              bg-gradient-to-br from-blue-500 to-blue-600
              rounded-xl
              flex items-center justify-center
              transform transition-all duration-300
              group-hover:rotate-12 group-hover:shadow-lg
            ">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden md:block">
              Aukcje
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setActiveItem(item.id)}
                className={`
                  relative px-4 py-2 rounded-lg
                  text-sm font-medium
                  transition-all duration-300 ease-out
                  hover:bg-blue-50
                  ${
                    activeItem === item.id
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }
                  group
                `}
              >
                {/* Tekst */}
                <span className="relative z-10">{item.label}</span>
                
                {/* Badge (jeśli istnieje) */}
                {item.badge && (
                  <span 
                    className="
                      absolute -top-1 -right-1 
                      px-2 py-0.5 
                      bg-blue-500 text-white 
                      text-xs rounded-full
                      animate-pulse
                    "
                  >
                    {item.badge}
                  </span>
                )}

                {/* Animated underline */}
                {activeItem === item.id && (
                  <span 
                    className="
                      absolute bottom-0 left-0 right-0 h-0.5 
                      bg-blue-600 rounded-full
                      transition-all duration-300
                    "
                  />
                )}

                {/* Hover effect background */}
                <span 
                  className="
                    absolute inset-0 
                    bg-blue-100 rounded-lg
                    scale-0 opacity-0
                    group-hover:scale-100 group-hover:opacity-100
                    transition-all duration-300
                    -z-0
                  "
                />
              </Link>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            {onThemeToggle && (
              <button
                onClick={onThemeToggle}
                className="
                  px-4 py-2 
                  bg-gray-100 hover:bg-gray-200
                  text-gray-700 font-medium text-sm
                  rounded-lg
                  transition-all duration-300 ease-out
                  hover:scale-105 hover:shadow-md
                  active:scale-95
                "
                aria-label="Przełącz motyw"
              >
                V1 ⇄ V2
              </button>
            )}

            {/* CTA Button */}
            <button
              className="
                hidden md:block
                px-5 py-2
                bg-blue-600 hover:bg-blue-700
                text-white font-medium text-sm
                rounded-lg
                transition-all duration-300 ease-out
                hover:scale-105 hover:shadow-lg
                active:scale-95
              "
            >
              Zaloguj się
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="
                md:hidden
                p-2 text-gray-700 hover:bg-gray-100 rounded-lg
                transition-colors duration-200
              "
              aria-label="Menu"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            className="
              md:hidden 
              py-4 
              border-t border-gray-200
              animate-fadeIn
            "
          >
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  setActiveItem(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`
                  block px-4 py-3 rounded-lg
                  text-sm font-medium
                  transition-all duration-200
                  ${
                    activeItem === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}
            <button
              className="
                w-full mt-4 px-4 py-3
                bg-blue-600 hover:bg-blue-700
                text-white font-medium text-sm
                rounded-lg
                transition-colors duration-200
              "
            >
              Zaloguj się
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </nav>
  );
};
