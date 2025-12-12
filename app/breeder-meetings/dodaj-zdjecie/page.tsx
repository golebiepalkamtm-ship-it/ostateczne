'use client';

import AddBreederMeetingForm from '@/components/breeder-meetings/AddBreederMeetingForm';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

export default function AddBreederMeetingPage() {
  return (
    <UnifiedLayout>
      <AddBreederMeetingForm />
    </UnifiedLayout>
  );
}
