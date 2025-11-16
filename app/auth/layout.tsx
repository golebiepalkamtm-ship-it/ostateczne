/**
 * Auth Layout
 * Filepath: app/auth/layout.tsx
 *
 * Purpose: Shared layout for authentication pages
 * Features: Centered content, clean styling
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const metadata = {
  title: 'Autentykacja | Pałka MTM',
  description: 'Zaloguj się lub zarejestruj na platformie Pałka MTM',
};
