'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * GlowCard - Komponent karty z holograficznym efektem glowing edges z CodePen
 * https://codepen.io/simeydotme/pen/RNWoPRj
 * 
 * WCAG 2.1 AA: Semantyczne HTML, keyboard navigation, proper focus management
 * 
 * @example
 * ```tsx
 * <GlowCard variant="default" intensity="medium">
 *   <h3>Tytuł karty</h3>
 *   <p>Treść karty z efektem holograficznym</p>
 * </GlowCard>
 * ```
 */

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'solid' | 'gradient' | 'floating';
  intensity?: 'subtle' | 'medium' | 'strong';
  hoverable?: boolean;
  onClick?: () => void;
  as?: 'div' | 'article' | 'section' | 'aside';
  role?: string;
  ariaLabel?: string;
}

export function GlowCard({
  children,
  className = '',
  variant = 'default',
  intensity = 'medium',
  hoverable = true,
  onClick,
  as: Component = 'div',
  role,
  ariaLabel,
}: GlowCardProps) {
  const baseClasses = 'card-glow-edge relative rounded-3xl p-6 transition-all duration-500 ease-out overflow-hidden backdrop-blur-2xl';
  
  const variantClasses = {
    default: 'card border-2 border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-transparent',
    glass: 'card-glass border-2 border-white/20 bg-gradient-to-br from-white/15 via-white/8 to-transparent',
    solid: 'card-solid border-2 border-white/25 bg-gradient-to-br from-white/20 via-white/10 to-white/5',
    gradient: 'card-gradient border-2 border-white/20 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-transparent',
    floating: 'card-floating border-2 border-white/15 bg-gradient-to-br from-white/12 via-white/6 to-transparent',
  };

  const intensityStyles = {
    subtle: { '--glow-boost': '0%' } as React.CSSProperties,
    medium: { '--glow-boost': '15%' } as React.CSSProperties,
    strong: { '--glow-boost': '30%' } as React.CSSProperties,
  };

  // Remove lift (translate/scale) on hover — keep subtle border highlight and cursor
  const hoverClasses = hoverable ? 'hover:border-white cursor-pointer' : '';
  const clickableProps = onClick ? {
    onClick,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
    tabIndex: 0,
    role: role || 'button',
  } : {};

  return (
    <Component
      className={cn(
        baseClasses,
        variantClasses[variant],
        hoverClasses,
        className,
      )}
      style={intensityStyles[intensity]}
      aria-label={ariaLabel}
      {...clickableProps}
    >
      <span className="glow" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </Component>
  );
}

/**
 * GlowButton - Przycisk z holograficznym efektem glowing edges
 * 
 * @example
 * ```tsx
 * <GlowButton variant="primary" onClick={handleClick}>
 *   Kliknij mnie
 * </GlowButton>
 * ```
 */

interface GlowButtonProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  fullWidth?: boolean;
}

export function GlowButton({
  children,
  className = '',
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
  ariaLabel,
  fullWidth = false,
}: GlowButtonProps) {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        variantClasses[variant],
        'relative overflow-hidden font-semibold py-3 px-6 text-sm rounded-2xl transition-all duration-500 ease-out',
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      <span className="glow" aria-hidden="true" />
      {children}
    </button>
  );
}

/**
 * GlowInput - Input z holograficznym efektem glowing edges
 * 
 * @example
 * ```tsx
 * <GlowInput
 *   type="text"
 *   placeholder="Wpisz tekst..."
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 * />
 * ```
 */

interface GlowInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function GlowInput({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: GlowInputProps) {
  const inputId = id || `glow-input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-white/90 mb-2"
        >
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'input-field w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-xl',
          'focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40',
          'transition-all duration-500 ease-out placeholder:text-white/40 text-white',
          'hover:border-white/30',
          error && 'border-red-400/50 focus:ring-red-400/30 focus:border-red-400/50',
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-white/60">
          {helperText}
        </p>
      )}
    </div>
  );
}

/**
 * GlowTextarea - Textarea z holograficznym efektem glowing edges
 */

interface GlowTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function GlowTextarea({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: GlowTextareaProps) {
  const textareaId = id || `glow-textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-white/90 mb-2"
        >
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'input-field w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-xl',
          'focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40',
          'transition-all duration-500 ease-out placeholder:text-white/40 text-white',
          'hover:border-white/30 resize-vertical min-h-[100px]',
          error && 'border-red-400/50 focus:ring-red-400/30 focus:border-red-400/50',
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="mt-1 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${textareaId}-helper`} className="mt-1 text-sm text-white/60">
          {helperText}
        </p>
      )}
    </div>
  );
}
