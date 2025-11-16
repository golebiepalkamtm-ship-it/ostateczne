import AuthFlipCard from '@/components/auth/AuthFlipCard';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';

export const metadata = {
  title: 'Zaloguj się lub Zarejestruj | Pałka MTM',
  description: 'Flipuj między logowaniem a rejestracją na platformie Pałka MTM',
};

export default function AuthPage() {
  return (
    <UnifiedLayout showNavigation={true} showFooter={true}>
      <div className="min-h-screen flex items-start justify-center pt-0">
        <AuthFlipCard />
      </div>
    </UnifiedLayout>
  );
}
