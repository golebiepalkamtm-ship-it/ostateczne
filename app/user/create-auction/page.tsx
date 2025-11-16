import CreateAuctionForm from '@/components/auctions/CreateAuctionForm';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Utwórz nową aukcję - Gołębie Pocztowe',
  description: 'Dodaj nową aukcję gołębia pocztowego na platformę',
};

export default function CreateAuctionPage() {
  return (
    <UnifiedLayout>
      <div className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CreateAuctionForm showHeader={true} />
        </div>
      </div>
    </UnifiedLayout>
  );
}
