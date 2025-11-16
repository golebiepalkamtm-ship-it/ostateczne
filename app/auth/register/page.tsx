import AuthFlipCard from '@/components/auth/AuthFlipCard';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';

export const metadata = {
  title: 'Zarejestruj się | Pałka MTM',
  description: 'Utwórz konto na platformie Pałka MTM - aukcje gołębi pocztowych',
};

export default function RegisterPage() {
  return (
    <UnifiedLayout showNavigation={true} showFooter={true}>
      <div className="flex items-start justify-center pt-8 pb-12">
        <AuthFlipCard initialMode="register" />
      </div>
    </UnifiedLayout>
  );
}
